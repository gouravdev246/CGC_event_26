import { Router } from "express";
import { verifyToken } from "../auth/auth.middleware.js";
import {
  getOverview,
  getRequestsTimeSeries,
  getTokensTimeSeries,
  getLatencyTimeSeries,
  getModelWiseUsage,
  getRagPerformance,
  getRequestHistory
} from "./usage.controller.js";

const router = Router();

// Middleware: allow token if present, or let through for public demo dashboard
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    return verifyToken(req, res, next);
  }
  next();
};

router.get("/overview", optionalAuth, getOverview);
router.get("/requests", optionalAuth, getRequestsTimeSeries);
router.get("/tokens", optionalAuth, getTokensTimeSeries);
router.get("/latency", optionalAuth, getLatencyTimeSeries);
router.get("/models", optionalAuth, getModelWiseUsage);
router.get("/rag-performance", optionalAuth, getRagPerformance);
router.get("/history", optionalAuth, getRequestHistory);

export default router;
