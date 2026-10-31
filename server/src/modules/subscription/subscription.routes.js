import { Router } from "express";
import { verifyToken } from "../auth/auth.middleware.js";
import {
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  verifyCheckoutSession,
  switchToFreePlan,
  createCustomerPortalSession,
} from "./subscription.controller.js";

const router = Router();

// Public: View all subscription plans
router.get("/plans", getPlans);

// Protected: Authenticated user subscription operations
router.get("/current", verifyToken, getCurrentSubscription);
router.post("/create-checkout-session", verifyToken, createCheckoutSession);
router.get("/verify-session", verifyToken, verifyCheckoutSession);
router.post("/verify-session", verifyToken, verifyCheckoutSession);
router.post("/switch-free", verifyToken, switchToFreePlan);
router.post("/portal", verifyToken, createCustomerPortalSession);

export default router;
