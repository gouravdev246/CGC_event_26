import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, getMe } from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { validate, verifyToken } from "./auth.middleware.js";

const router = Router();

// Rate limiting for auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: {
    success: false,
    message: "Too many attempts from this IP. Please try again after 15 minutes.",
  },
});

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.get("/me", verifyToken, getMe);

export default router;

