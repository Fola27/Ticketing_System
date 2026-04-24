"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = require("path");
const tickets_1 = __importDefault(require("./routes/tickets"));
const auth_1 = __importDefault(require("./routes/auth"));
const auth_2 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Serve local uploads directory
app.use("/uploads", express_1.default.static((0, path_1.join)(__dirname, "..", "uploads")));
// Auth routes (no authentication required)
app.use("/api/auth", auth_1.default);
// Protected routes (require authentication)
app.use("/api/tickets", auth_2.authMiddleware, tickets_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
