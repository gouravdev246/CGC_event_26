import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./src/modules/auth/auth.routes.js";
import fileRoutes from "./src/modules/fileupload/fileupload.route.js";
import ragRoutes from "./src/modules/rag/rag.route.js";
import subscriptionRoutes from "./src/modules/subscription/subscription.routes.js";
import usageRoutes from "./src/modules/usage/usage.routes.js";
import { handleStripeWebhook } from "./src/modules/subscription/subscription.controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));

// Stripe webhook requires raw body for signature verification
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/rag", ragRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/usage", usageRoutes);

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
