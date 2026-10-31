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
