import express from "express";
import cors from "cors";
import helmet from "helmet";
import fileRoutes from "./modules/fileupload/fileupload.route.js";

import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "KnowAPI server is running" });
});

export default app;

