import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./src/modules/auth/auth.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "KnowAPI server is running",
    mongoStatus: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    port: PORT
  });
});

// Start Express server immediately
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Connect to MongoDB if MONGO_URI is configured
const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/rag_db";
if (mongoUri) {
  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("Connected to MongoDB successfully");
    })
    .catch((err) => {
      console.warn("MongoDB connection notice:", err.message);
      console.log("Server active and accepting auth requests on port", PORT);
    });
}

export default app;
