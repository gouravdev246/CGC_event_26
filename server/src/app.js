import express from "express";
import cors from "cors";
import helmet from "helmet";

import authRoutes from "./modules/auth/auth.routes.js";
import fileRoutes from "./modules/fileupload/fileupload.route.js";
import ragRoutes from "./modules/rag/rag.route.js";
import subscriptionRoutes from "./modules/subscription/subscription.routes.js";
import usageRoutes from "./modules/usage/usage.routes.js";
import { handleStripeWebhook } from "./modules/subscription/subscription.controller.js";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
  credentials: true
}));

// Stripe webhook raw body handling
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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "KnowAPI server is running" });
});

export default app;
