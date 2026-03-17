import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ticketsRouter from "./routes/tickets";
import authRouter from "./routes/auth";
import { authMiddleware } from "./middleware/auth";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes (no authentication required)
app.use("/api/auth", authRouter);

// Protected routes (require authentication)
app.use("/api/tickets", authMiddleware as any, ticketsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
