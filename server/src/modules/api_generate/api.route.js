import { Router } from "express";
import { verifyToken } from "../auth/auth.middleware.js";
import {
  createApiKeyController,
  getApiKeyController,
} from "./api.controller.js";

const router = Router();

// Routes for API key management (requires user authentication)
router.post("/generate", verifyToken, createApiKeyController);
router.get("/current", verifyToken, getApiKeyController);
router.get("/", verifyToken, getApiKeyController);

export default router;

