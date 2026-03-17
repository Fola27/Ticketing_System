import { Router } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "../utils/mail";
import multer from 'multer'
import { uploadBufferToBlob } from '../utils/blob'

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
  const files = req.files as Express.Multer.File[] | undefined;
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

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tickets = loadTickets();
  const idx = tickets.findIndex((t: any) => t.ticket_id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  tickets[idx] = { ...tickets[idx], ...updates };
  if (updates.status === "Close" && !tickets[idx].closed_at) tickets[idx].closed_at = new Date().toISOString();
  saveTickets(tickets);
  res.json(tickets[idx]);
});

export default router;
