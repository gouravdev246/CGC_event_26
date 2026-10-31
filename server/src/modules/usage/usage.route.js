import { Router } from "express";
import jwt from "jsonwebtoken";
import * as usageController from "./usage.controller.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_rag_service_2026_dev";

// Tolerant auth: populates req.user if valid token provided, but doesn't block unauthenticated queries
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (_) {
      // Continue without user
    }
  }
  next();
};

router.use(optionalAuth);

// Dashboard telemetry endpoints
router.get("/overview", usageController.getOverview);
router.get("/requests", usageController.getRequestsTimeSeries);
router.get("/tokens", usageController.getTokensTimeSeries);
router.get("/latency", usageController.getLatencyTimeSeries);
router.get("/models", usageController.getModelUsage);
router.get("/rag-performance", usageController.getRagPerformance);
router.get("/history", usageController.getRequestHistory);

export default router;

