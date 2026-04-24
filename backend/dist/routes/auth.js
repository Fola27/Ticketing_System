"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const usersPath = (0, path_1.join)(__dirname, "..", "store", "users.json");
const resetTokensPath = (0, path_1.join)(__dirname, "..", "store", "resetTokens.json");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
function loadUsers() {
    if (!(0, fs_1.existsSync)(usersPath))
        return [];
    const raw = (0, fs_1.readFileSync)(usersPath, "utf8");
    return JSON.parse(raw || "[]");
}
function saveUsers(users) {
    (0, fs_1.writeFileSync)(usersPath, JSON.stringify(users, null, 2));
}
function loadResetTokens() {
    if (!(0, fs_1.existsSync)(resetTokensPath))
        return [];
    const raw = (0, fs_1.readFileSync)(resetTokensPath, "utf8");
    return JSON.parse(raw || "[]");
}
function saveResetTokens(tokens) {
    (0, fs_1.writeFileSync)(resetTokensPath, JSON.stringify(tokens, null, 2));
}
function generateResetToken() {
    return crypto_1.default.randomBytes(32).toString("hex");
}
// Register route
router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: "Email, password, and name are required" });
        }
        const users = loadUsers();
        const userExists = users.find((u) => u.email === email);
        if (userExists) {
            return res.status(409).json({ error: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            name,
        };
        users.push(newUser);
        saveUsers(users);
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(201).json({
            token,
            user: { id: newUser.id, email: newUser.email, name: newUser.name },
        });
    }
    catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Login route
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const users = loadUsers();
        const user = users.find((u) => u.email === email);
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user' },
        });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Admin login route
router.post("/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const users = loadUsers();
        const user = users.find((u) => u.email === email && u.role === 'admin');
        if (!user) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid admin credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: 'admin' }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({
            token,
            user: { id: user.id, email: user.email, name: user.name, role: 'admin' },
        });
    }
    catch (err) {
        console.error("Admin login error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Create admin user (for initial setup)
router.post("/admin/create", async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: "Email, password, and name are required" });
        }
        const users = loadUsers();
        const userExists = users.find((u) => u.email === email);
        if (userExists) {
            return res.status(409).json({ error: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword,
            name,
            role: 'admin',
        };
        users.push(newUser);
        saveUsers(users);
        const token = jsonwebtoken_1.default.sign({ id: newUser.id, email: newUser.email, role: 'admin' }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(201).json({
            token,
            user: { id: newUser.id, email: newUser.email, name: newUser.name, role: 'admin' },
        });
    }
    catch (err) {
        console.error("Create admin error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Verify token route
router.post("/verify", (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ valid: true, user: decoded });
    }
    catch (err) {
        res.status(401).json({ valid: false, error: "Invalid token" });
    }
});
// Forgot password route
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const users = loadUsers();
        const user = users.find((u) => u.email === email);
        if (!user) {
            // Return success even if user doesn't exist (security best practice)
            return res.json({ message: "If an account exists with this email, a reset link has been sent" });
        }
        // Generate reset token (valid for 1 hour)
        const resetToken = generateResetToken();
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        const tokens = loadResetTokens();
        // Remove any existing tokens for this email
        const filteredTokens = tokens.filter((t) => t.email !== email);
        filteredTokens.push({ token: resetToken, email, expiresAt });
        saveResetTokens(filteredTokens);
        res.json({
            message: "If an account exists with this email, a reset link has been sent",
            resetToken, // In production, this would be sent via email
        });
    }
    catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// Reset password route
router.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ error: "Reset token and new password are required" });
        }
        const tokens = loadResetTokens();
        const tokenRecord = tokens.find((t) => t.token === resetToken);
        if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
            return res.status(401).json({ error: "Invalid or expired reset token" });
        }
        // Update user password
        const users = loadUsers();
        const user = users.find((u) => u.email === tokenRecord.email);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        saveUsers(users);
        // Remove used token
        const updatedTokens = tokens.filter((t) => t.token !== resetToken);
        saveResetTokens(updatedTokens);
        res.json({ message: "Password has been reset successfully" });
    }
    catch (err) {
        console.error("Reset password error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
