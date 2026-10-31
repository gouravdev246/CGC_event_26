import express from "express";
import cors from "cors";
import path from "node:path";

import authRoutes from "./modules/auth/auth.routes.js";
import fileRoutes from "./modules/fileupload/fileupload.route.js";
import apiRoutes from "./modules/api_generate/api.route.js";
import ragRoutes from "./modules/rag/rag.route.js";
import usageRoutes from "./modules/usage/usage.route.js";

const app = express();


app.use(cors(
  {
    origin: ["https://raas.imgourav.tech", "http://raas.imgourav.tech" , "http://raas.imgourav.tech/" , "http://localhost:3000"],
    credentials: true
  }
));
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
app.use("/api/usage", usageRoutes);
app.use("/api", ragRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "KnowAPI server is running" });
});

export default app;
