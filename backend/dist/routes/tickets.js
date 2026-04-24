"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = require("fs");
const path_1 = require("path");
const uuid_1 = require("uuid");
const mail_1 = require("../utils/mail");
const multer_1 = __importDefault(require("multer"));
const blob_1 = require("../utils/blob");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
const storePath = (0, path_1.join)(__dirname, "..", "store", "tickets.json");
function loadTickets() {
    if (!(0, fs_1.existsSync)(storePath))
        return [];
    const raw = (0, fs_1.readFileSync)(storePath, "utf8");
    return JSON.parse(raw || "[]");
}
function saveTickets(tickets) {
    (0, fs_1.writeFileSync)(storePath, JSON.stringify(tickets, null, 2));
}
router.get("/", (req, res) => {
    const tickets = loadTickets();
    res.json(tickets);
});
router.post("/", upload.array('attachments'), async (req, res) => {
    const payload = req.body;
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const attachments = [];
    const files = req.files;
    if (files && files.length) {
        for (const f of files) {
            try {
                const url = await (0, blob_1.uploadBufferToBlob)(f.buffer, f.originalname, f.mimetype);
                attachments.push({ filename: f.originalname, url, contentType: f.mimetype, size: f.size });
            }
            catch (err) {
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
        progress_level: "low",
        assigned_username: null,
        status_history: [{
                status: "Open",
                timestamp: now,
                updated_by: payload.reported_by || "system"
            }],
        progress_history: [{
                level: "low",
                timestamp: now,
                updated_by: payload.reported_by || "system"
            }],
    };
    const tickets = loadTickets();
    tickets.unshift(ticket);
    saveTickets(tickets);
    // send confirmation to user
    try {
        await (0, mail_1.sendMail)({
            to: ticket.reported_by,
            subject: `Ticket received: ${ticket.ticket_id}`,
            body: `Your ticket has been received. Ticket ID: ${ticket.ticket_id}`,
        });
        // notify IT team
        if (process.env.IT_TEAM_EMAIL) {
            await (0, mail_1.sendMail)({
                to: process.env.IT_TEAM_EMAIL,
                subject: `New ticket: ${ticket.ticket_id}`,
                body: `A new ticket was logged by ${ticket.reported_by}: ${ticket.description}`,
            });
        }
    }
    catch (err) {
        console.error("Mail send error:", err);
    }
    res.status(201).json(ticket);
});
router.patch("/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.ticket_id === id);
    if (idx === -1)
        return res.status(404).json({ error: "Not found" });
    const ticket = tickets[idx];
    const now = new Date().toISOString();
    const updatedBy = req.user?.email || "system";
    // Handle status updates with history
    if (updates.status && updates.status !== ticket.status) {
        if (!ticket.status_history)
            ticket.status_history = [];
        ticket.status_history.push({
            status: updates.status,
            timestamp: now,
            updated_by: updatedBy
        });
    }
    // Handle progress level updates with history
    if (updates.progress_level && updates.progress_level !== ticket.progress_level) {
        if (!ticket.progress_history)
            ticket.progress_history = [];
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
router.post("/:id/assign", (req, res) => {
    const { id } = req.params;
    const { assigned_to, assigned_username } = req.body;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.ticket_id === id);
    if (idx === -1)
        return res.status(404).json({ error: "Not found" });
    const ticket = tickets[idx];
    const now = new Date().toISOString();
    const updatedBy = req.user?.email || "admin";
    ticket.assigned_to = assigned_to;
    ticket.assigned_username = assigned_username;
    ticket.status = "In Progress";
    // Add status history
    if (!ticket.status_history)
        ticket.status_history = [];
    ticket.status_history.push({
        status: "In Progress",
        timestamp: now,
        updated_by: updatedBy
    });
    saveTickets(tickets);
    res.json(ticket);
});
router.post("/:id/escalate", (req, res) => {
    const { id } = req.params;
    const { escalation_level, reason } = req.body;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.ticket_id === id);
    if (idx === -1)
        return res.status(404).json({ error: "Not found" });
    const ticket = tickets[idx];
    const now = new Date().toISOString();
    const updatedBy = req.user?.email || "admin";
    ticket.escalation_level = escalation_level;
    ticket.progress_level = "high";
    // Add progress history
    if (!ticket.progress_history)
        ticket.progress_history = [];
    ticket.progress_history.push({
        level: "high",
        timestamp: now,
        updated_by: updatedBy,
        reason: reason || "Escalated to " + escalation_level
    });
    saveTickets(tickets);
    res.json(ticket);
});
router.post("/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { resolution } = req.body;
    const tickets = loadTickets();
    const idx = tickets.findIndex((t) => t.ticket_id === id);
    if (idx === -1)
        return res.status(404).json({ error: "Not found" });
    const ticket = tickets[idx];
    const now = new Date().toISOString();
    const updatedBy = req.user?.email || "admin";
    ticket.status = "Completed";
    ticket.closed_at = now;
    // Add status history
    if (!ticket.status_history)
        ticket.status_history = [];
    ticket.status_history.push({
        status: "Completed",
        timestamp: now,
        updated_by: updatedBy,
        resolution: resolution
    });
    saveTickets(tickets);
    res.json(ticket);
});
exports.default = router;
