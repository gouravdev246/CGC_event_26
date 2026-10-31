import { Router } from "express";
import { handleQuery } from "./rag.controller.js";
import { verifyToken } from "../auth/auth.middleware.js";
import { enforceRequestLimit } from "../subscription/usage.middleware.js";

const router = Router();

// POST /api/rag/query - Enforces subscription request limits (Free: 100, Starter: 1,000, Pro: 2,500)
router.post("/query", verifyToken, enforceRequestLimit, handleQuery);

export default router;
