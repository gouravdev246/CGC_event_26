import fs from "fs";
import {
  findUserByIdOrEmail,
  saveUser,
  checkAndResetBillingPeriod,
  countUserDocuments
} from "./subscription.controller.js";
import { SUBSCRIPTION_PLANS } from "./stripe.service.js";

/**
 * Middleware: Enforce Document Upload Limits
 * - Free: 2 documents
 * - Starter: 5 documents
 * - Pro: 12 documents
 * - Enterprise: Custom
 */
export const enforceDocumentLimit = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      // If unauthenticated, require authentication to enforce organization limits
      return res.status(401).json({
        success: false,
        message: "Authentication required to upload documents and track plan quota."
      });
    }

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const planName = user.subscription?.plan || "Free";
    const documentLimit = user.subscription?.documentLimit ?? (SUBSCRIPTION_PLANS[planName.toLowerCase()]?.documentLimit || 2);
    const currentCount = await countUserDocuments(userId);

    if (currentCount >= documentLimit) {
      // If a file was written to disk by multer before this handler, clean it up
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}
      }

      return res.status(403).json({
        success: false,
        error: "Document upload limit reached for your plan.",
        code: "DOCUMENT_LIMIT_REACHED",
        plan: planName,
        limit: documentLimit,
        currentUsage: currentCount,
        upgradeRequired: true,
        message: `Your ${planName} plan allows up to ${documentLimit} uploaded documents. You currently have ${currentCount}. Upgrade your plan to upload more knowledge documents.`
      });
    }

    // Attach user record for subsequent handler
    req.currentUser = user;
    next();
  } catch (err) {
    console.error("enforceDocumentLimit error:", err);
    next(err);
  }
};

/**
 * Middleware: Enforce API Request Limits
 * - Free: 100 requests / month
 * - Starter: 1,000 requests / month
 * - Pro: 2,500 requests / month
 * - Enterprise: Custom
 *
 * Automatically resets request count when billing period rolls over.
 */
export const enforceRequestLimit = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    if (!userId && !userEmail) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to query RAG APIs."
      });
    }

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if billing period expired and advance if so (resets requestsUsed)
    await checkAndResetBillingPeriod(user);

    const planName = user.subscription?.plan || "Free";
    const requestLimit = user.subscription?.requestLimit ?? (SUBSCRIPTION_PLANS[planName.toLowerCase()]?.requestLimit || 100);
    const requestsUsed = user.subscription?.requestsUsed ?? 0;

    if (requestsUsed >= requestLimit) {
      return res.status(429).json({
        success: false,
        error: "Monthly API request limit reached for your plan.",
        code: "REQUEST_LIMIT_REACHED",
        plan: planName,
        limit: requestLimit,
        currentUsage: requestsUsed,
        renewsOn: user.subscription?.renewsOn || "next billing cycle",
        upgradeRequired: true,
        message: `Your ${planName} plan has reached its limit of ${requestLimit.toLocaleString()} monthly API requests. You have used ${requestsUsed.toLocaleString()}. Please upgrade your plan for higher throughput.`
      });
    }

    // Increment request count on user
    if (!user.subscription) user.subscription = {};
    user.subscription.requestsUsed = requestsUsed + 1;
    await saveUser(user);

    req.currentUser = user;
    req.currentUsage = {
      requestsUsed: user.subscription.requestsUsed,
      requestLimit
    };

    next();
  } catch (err) {
    console.error("enforceRequestLimit error:", err);
    next(err);
  }
};
