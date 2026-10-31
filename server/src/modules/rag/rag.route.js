import { Router } from "express";
import { handleChatQuery } from "./rag.controller.js";

const router = Router();

// Endpoint with API key in URL: /api/:userid/:apikey/chat
router.post("/:userid/:apikey/chat", handleChatQuery);

// Endpoint with API key in headers or body: /api/:userid/chat
router.post("/:userid/chat", handleChatQuery);

export default router;

