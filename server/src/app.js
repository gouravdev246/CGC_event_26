import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";

import authRoutes from "./modules/auth/auth.routes.js";
import fileRoutes from "./modules/fileupload/fileupload.route.js";
import apiRoutes from "./modules/api_generate/api.route.js";
import ragRoutes from "./modules/rag/rag.route.js";

const app = express();

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline documentation styles and copy scripts
  })
);
app.use(cors());
app.use(express.json());

// Interactive API Documentation endpoint
const docsFilePath = path.resolve(import.meta.dirname, "../public/api-docs.html");
app.get(["/docs", "/api-docs"], (req, res) => {
  res.sendFile(docsFilePath);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/keys", apiRoutes);
app.use("/api", ragRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "KnowAPI server is running" });
});

export default app;
