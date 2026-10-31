import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";

import authRoutes from "./modules/auth/auth.routes.js";
import fileRoutes from "./modules/fileupload/fileupload.route.js";
import apiRoutes from "./modules/api_generate/api.route.js";
import ragRoutes from "./modules/rag/rag.route.js";
import subscriptionRoutes from "./modules/subscription/subscription.routes.js";
import usageRoutes from "./modules/usage/usage.routes.js";
import { handleStripeWebhook } from "./modules/subscription/subscription.controller.js";

const app = express();

// Security headers with cross-origin allowance
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Single unified CORS configuration
const allowedOrigins = [
  "https://raas.imgourav.tech",
  "http://raas.imgourav.tech",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, postman, mobile)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".imgourav.tech") ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }
    // Allow any origin for public RAG endpoints
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-api-key",
    "x-user-id",
    "Accept",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Stripe webhook raw body handling (must be mounted before express.json)
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

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
app.use("/api/subscription", subscriptionRoutes);
app.use("/api", ragRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "KnowAPI server is running" });
});

export default app;
