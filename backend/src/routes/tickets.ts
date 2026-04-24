import { Router, Request } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "../utils/mail";
import multer from 'multer'
import { uploadBufferToBlob } from '../utils/blob'

interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const storePath = join(__dirname, "..", "store", "tickets.json");

function loadTickets() {
  if (!existsSync(storePath)) return [] as any[];
  const raw = readFileSync(storePath, "utf8");
  return JSON.parse(raw || "[]");
}

function saveTickets(tickets: any[]) {
  writeFileSync(storePath, JSON.stringify(tickets, null, 2));
}

router.get("/", (req, res) => {
  const tickets = loadTickets();
  res.json(tickets);
});

router.post("/", upload.array('attachments'), async (req: any, res) => {
  const payload = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  const attachments: any[] = [];
  const files = req.files as any[] | undefined;
  if (files && files.length) {
    for (const f of files) {
      try {
        const url = await uploadBufferToBlob(f.buffer, f.originalname, f.mimetype);
        attachments.push({ filename: f.originalname, url, contentType: f.mimetype, size: f.size });
      } catch (err) {
        console.error('Blob upload error for', f.originalname, err);
      }
    }
  }

  const ticket = {
    ticket_id: id,
    description: payload.description || "",
    priority: payload.priority || "Medium",
    reported_by: payload.reported_by || "unknown@domain",
    tracker: "New",
    status: "Open",
    assigned_to: payload.assigned_to || null,
    reported_at: now,
    attachments,
    closed_at: null,
    // Admin fields
    escalation_level: "first-level",
    progress_level: "Open",
    assigned_username: null,
    status_history: [{
      status: "Open",
      timestamp: now,
      updated_by: payload.reported_by || "system"
    }],
    progress_history: [{
      level: "Open",
      timestamp: now,
      updated_by: payload.reported_by || "system"
    }],
  };

  const tickets = loadTickets();
  tickets.unshift(ticket);
  saveTickets(tickets);

  // send confirmation to user
  try {
    await sendMail({
      to: ticket.reported_by,
      subject: `Ticket received: ${ticket.ticket_id}`,
      body: `Your ticket has been received. Ticket ID: ${ticket.ticket_id}`,
    });

    // notify IT team
    if (process.env.IT_TEAM_EMAIL) {
      await sendMail({
        to: process.env.IT_TEAM_EMAIL,
        subject: `New ticket: ${ticket.ticket_id}`,
        body: `A new ticket was logged by ${ticket.reported_by}: ${ticket.description}`,
      });
    }
  } catch (err) {
    console.error("Mail send error:", err);
  }

  res.status(201).json(ticket);
});

// Notify user about ticket updates - must come before /:id routes
router.post("/notify", (req: AuthRequest, res) => {
  const { email, subject, message } = req.body;
  
  sendMail({
    to: email,
    subject: subject,
    body: message,
  })
    .then(() => {
      res.json({ success: true, message: "Notification sent" });
    })
    .catch((err) => {
      console.error("Mail send error:", err);
      res.status(500).json({ error: "Failed to send notification" });
    });
});

router.patch("/:id", (req: AuthRequest, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tickets = loadTickets();
  const idx = tickets.findIndex((t: any) => t.ticket_id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const ticket = tickets[idx];
  const now = new Date().toISOString();
  const updatedBy = req.user?.email || "system";

  // Handle status updates with history
  if (updates.status && updates.status !== ticket.status) {
    if (!ticket.status_history) ticket.status_history = [];
    ticket.status_history.push({
      status: updates.status,
      timestamp: now,
      updated_by: updatedBy
    });
  }

  // Handle progress level updates with history
  if (updates.progress_level && updates.progress_level !== ticket.progress_level) {
    if (!ticket.progress_history) ticket.progress_history = [];
    ticket.progress_history.push({
      level: updates.progress_level,
      timestamp: now,
      updated_by: updatedBy
    });
  }

  // Update the ticket
  tickets[idx] = { ...ticket, ...updates };

  // Set closed timestamp if status is completed/closed
  if (updates.status === "Completed" && !tickets[idx].closed_at) {
    tickets[idx].closed_at = now;
  }

  saveTickets(tickets);
  res.json(tickets[idx]);
});

// Admin routes for ticket management
router.post("/:id/assign", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { assigned_to, assigned_username } = req.body;
  const tickets = loadTickets();
  const idx = tickets.findIndex((t: any) => t.ticket_id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const ticket = tickets[idx];
  const now = new Date().toISOString();
  const updatedBy = req.user?.email || "admin";

  ticket.assigned_to = assigned_to;
  ticket.assigned_username = assigned_username;
  ticket.status = "In Progress";

  // Add status history
  if (!ticket.status_history) ticket.status_history = [];
  ticket.status_history.push({
    status: "In Progress",
    timestamp: now,
    updated_by: updatedBy
  });

  saveTickets(tickets);
  res.json(ticket);
});

router.post("/:id/escalate", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { escalation_level, reason } = req.body;
  const tickets = loadTickets();
  const idx = tickets.findIndex((t: any) => t.ticket_id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const ticket = tickets[idx];
  const now = new Date().toISOString();
  const updatedBy = req.user?.email || "admin";

  ticket.escalation_level = escalation_level;
  ticket.progress_level = "In-Progress";

  // Add progress history
  if (!ticket.progress_history) ticket.progress_history = [];
  ticket.progress_history.push({
    level: "In-Progress",
    timestamp: now,
    updated_by: updatedBy,
    reason: reason || "Escalated to " + escalation_level
  });

  saveTickets(tickets);
  res.json(ticket);
});

router.post("/:id/resolve", (req: AuthRequest, res) => {
  const { id } = req.params;
  const { resolution } = req.body;
  const tickets = loadTickets();
  const idx = tickets.findIndex((t: any) => t.ticket_id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });

  const ticket = tickets[idx];
  const now = new Date().toISOString();
  const updatedBy = req.user?.email || "admin";

  ticket.status = "Completed";
  ticket.closed_at = now;

  // Add status history
  if (!ticket.status_history) ticket.status_history = [];
  ticket.status_history.push({
    status: "Completed",
    timestamp: now,
    updated_by: updatedBy,
    resolution: resolution
  });

  saveTickets(tickets);
  res.json(ticket);
});

export default router;
