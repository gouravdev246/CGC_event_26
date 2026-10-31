import mongoose from "mongoose";
import {
  stripe,
  SUBSCRIPTION_PLANS,
  findPlanByKey,
  getOrCreateStripeCustomer
} from "./stripe.service.js";
import { User } from "../auth/auth.model.js";
import { inMemoryUsers } from "../auth/auth.controller.js";
import { File } from "../fileupload/fileupload.module.js";

// Set to ensure webhook idempotency
const processedWebhookEvents = new Set();

/**
 * Helper to fetch a user by ID or Email with Mongo and In-Memory fallback
 */
export const findUserByIdOrEmail = async (id, email) => {
  if (mongoose.connection.readyState === 1) {
    if (id && mongoose.isValidObjectId(id)) {
      const user = await User.findById(id);
      if (user) return user;
    }
    if (email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) return user;
    }
  }

  // In-memory fallback
  for (const [, user] of inMemoryUsers) {
    if ((id && (user._id === id || user.id === id)) || (email && user.email?.toLowerCase() === email.toLowerCase())) {
      return user;
    }
  }

  // If not found in in-memory map (e.g., after server restart), re-initialize gracefully from verified identity
  if (email || id) {
    const fallbackUser = {
      _id: id || `usr_${Date.now()}`,
      id: id || `usr_${Date.now()}`,
      email: email ? email.toLowerCase().trim() : "user@example.com",
      name: email ? email.split("@")[0] : "User",
      subscription: {
        plan: "Free",
        status: "active",
        billingCycle: "monthly",
        renewsOn: "Never (Free Tier)",
        documentLimit: 2,
        documentsUsed: 0,
        requestLimit: 100,
        requestsUsed: 0
      }
    };
    inMemoryUsers.set(fallbackUser.id, fallbackUser);
    return fallbackUser;
  }

  return null;
};

/**
 * Helper to persist user updates across Mongo and In-Memory
 */
export const saveUser = async (user) => {
  if (mongoose.connection.readyState === 1 && typeof user.save === "function") {
    return await user.save();
  }

  const userId = user._id || user.id;
  if (userId) {
    inMemoryUsers.set(userId, user);
  }
  return user;
};

/**
 * Check and advance billing period if expired (resets monthly request count)
 */
export const checkAndResetBillingPeriod = async (user) => {
  if (!user.subscription) return;

  const now = new Date();
  const periodEnd = user.subscription.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd) : null;

  if (periodEnd && now > periodEnd) {
    // Advance billing period by 30 days and reset request usage
    user.subscription.currentPeriodStart = now;
    user.subscription.currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    user.subscription.requestsUsed = 0;
    if (user.subscription.plan !== "Free") {
      user.subscription.renewsOn = user.subscription.currentPeriodEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
    await saveUser(user);
  }
};

/**
 * Count active documents for user
 */
export const countUserDocuments = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      return await File.countDocuments({ userId: String(userId) });
    } catch (_) {
      return 0;
    }
  }
  return 0;
};

/**
 * 1. GET /api/subscription/plans
 */
export const getPlans = (req, res) => {
  return res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS
  });
};

/**
 * 2. GET /api/subscription/current
 */
export const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Advance billing period and reset usage if past renewal date
    await checkAndResetBillingPeriod(user);

    // Sync documents count
    const docCount = await countUserDocuments(userId);
    if (user.subscription) {
      user.subscription.documentsUsed = Math.max(user.subscription.documentsUsed || 0, docCount);
    }

    return res.json({
      success: true,
      subscription: {
        plan: user.subscription?.plan || "Free",
        status: user.subscription?.status || "active",
        billingCycle: user.subscription?.billingCycle || "monthly",
        currentPeriodStart: user.subscription?.currentPeriodStart,
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        renewsOn: user.subscription?.renewsOn || "Never (Free Tier)",
        documentLimit: user.subscription?.documentLimit ?? 2,
        documentsUsed: user.subscription?.documentsUsed ?? docCount,
        requestLimit: user.subscription?.requestLimit ?? 100,
        requestsUsed: user.subscription?.requestsUsed ?? 0,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        stripePriceId: user.stripePriceId,
        organizationId: user.organizationId || userId
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 3. POST /api/subscription/create-checkout-session
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    if (!planId) {
      return res.status(400).json({ success: false, message: "planId is required" });
    }

    const plan = findPlanByKey(planId);
    if (!plan) {
      return res.status(400).json({ success: false, message: `Invalid plan: ${planId}` });
    }

    if (!plan.isPaid) {
      if (plan.id === "free") {
        return res.status(400).json({
          success: false,
          message: "Free plan does not require checkout. Use /switch-free instead."
        });
      }
      if (plan.isEnterprise) {
        return res.status(400).json({
          success: false,
          message: "Enterprise plans require contacting our sales team."
        });
      }
    }

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get or create Stripe Customer
    let customer;
    if (user.stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (_) {
        customer = null;
      }
    }

    if (!customer || customer.deleted) {
      customer = await getOrCreateStripeCustomer({
        email: user.email,
        name: user.name,
        userId: String(userId),
        organizationId: user.organizationId || String(userId)
      });
      user.stripeCustomerId = customer.id;
      await saveUser(user);
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    // Create recurring Stripe Checkout Session in INR (amount in paise)
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${plan.name} Plan - RAG SaaS Platform`,
              description: `${plan.documentLimit} documents, ${plan.requestLimit.toLocaleString()} API requests / month`
            },
            unit_amount: plan.priceInPaise,
            recurring: {
              interval: "month"
            }
          },
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          userId: String(userId),
          organizationId: String(user.organizationId || userId),
          planId: plan.id,
          planName: plan.name
        }
      },
      metadata: {
        userId: String(userId),
        organizationId: String(user.organizationId || userId),
        planId: plan.id,
        planName: plan.name
      },
      success_url: `${clientUrl}/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${clientUrl}/subscription?canceled=true`
    });

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
  } catch (err) {
    console.error("Stripe create-checkout-session error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 4. GET /api/subscription/verify-session?session_id=...
 */
export const verifyCheckoutSession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ success: false, message: "session_id parameter is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription", "customer"]
    });

    if (!session || session.status !== "complete") {
      return res.status(400).json({
        success: false,
        message: "Payment session is incomplete or expired."
      });
    }

    const targetUserId = session.metadata?.userId || req.user?.id || req.user?._id;
    const targetEmail = session.customer_details?.email || req.user?.email;

    const user = await findUserByIdOrEmail(targetUserId, targetEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "Associated user not found" });
    }

    const planKey = session.metadata?.planId || "starter";
    const plan = findPlanByKey(planKey) || SUBSCRIPTION_PLANS.starter;

    const sub = session.subscription;
    const periodStart = sub?.current_period_start ? new Date(sub.current_period_start * 1000) : new Date();
    const periodEnd = sub?.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const renewalStr = periodEnd.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });

    user.stripeCustomerId = session.customer?.id || session.customer || user.stripeCustomerId;
    user.stripeSubscriptionId = sub?.id || user.stripeSubscriptionId;
    user.stripePriceId = sub?.items?.data?.[0]?.price?.id || null;

    if (!user.subscription) user.subscription = {};
    user.subscription.plan = plan.name;
    user.subscription.status = sub?.status || "active";
    user.subscription.billingCycle = "monthly";
    user.subscription.currentPeriodStart = periodStart;
    user.subscription.currentPeriodEnd = periodEnd;
    user.subscription.renewsOn = renewalStr;
    user.subscription.documentLimit = plan.documentLimit;
    user.subscription.requestLimit = plan.requestLimit;
    user.subscription.requestsUsed = 0; // Reset usage for new paid plan

    await saveUser(user);

    return res.json({
      success: true,
      message: `Successfully activated ${plan.name} subscription!`,
      subscription: user.subscription
    });
  } catch (err) {
    console.error("verifyCheckoutSession error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 5. POST /api/subscription/switch-free
 */
export const switchToFreePlan = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If there's an active Stripe subscription, cancel it in Stripe
    if (user.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
      } catch (stripeErr) {
        console.warn("Notice cancelling stripe sub:", stripeErr.message);
      }
    }

    if (!user.subscription) user.subscription = {};
    user.subscription.plan = "Free";
    user.subscription.status = "active";
    user.subscription.billingCycle = "monthly";
    user.subscription.currentPeriodStart = new Date();
    user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.subscription.renewsOn = "Never (Free Tier)";
    user.subscription.documentLimit = SUBSCRIPTION_PLANS.free.documentLimit;
    user.subscription.requestLimit = SUBSCRIPTION_PLANS.free.requestLimit;
    user.stripeSubscriptionId = null;
    user.stripePriceId = null;

    await saveUser(user);

    return res.json({
      success: true,
      message: "Successfully switched to the Free Plan.",
      subscription: user.subscription
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 6. POST /api/subscription/portal
 */
export const createCustomerPortalSession = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;

    const user = await findUserByIdOrEmail(userId, userEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await getOrCreateStripeCustomer({
        email: user.email,
        name: user.name,
        userId: String(userId),
        organizationId: user.organizationId || String(userId)
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await saveUser(user);
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${clientUrl}/subscription`
    });

    return res.json({
      success: true,
      url: portalSession.url
    });
  } catch (err) {
    console.error("createCustomerPortalSession error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 7. POST /api/subscription/webhook
 * Handles:
 *  - checkout.session.completed
 *  - customer.subscription.created
 *  - customer.subscription.updated
 *  - customer.subscription.deleted
 *  - invoice.paid
 *  - invoice.payment_failed
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Direct JSON parsing fallback for development tests
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }
  } catch (err) {
    console.error("Stripe Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check: prevent duplicate event processing
  if (event.id && processedWebhookEvents.has(event.id)) {
    return res.status(200).json({ received: true, duplicate: true });
  }
  if (event.id) {
    processedWebhookEvents.add(event.id);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const planKey = session.metadata?.planId || "starter";
        const plan = findPlanByKey(planKey) || SUBSCRIPTION_PLANS.starter;

        const user = await findUserByIdOrEmail(userId, session.customer_details?.email);
        if (user) {
          user.stripeCustomerId = session.customer || user.stripeCustomerId;
          user.stripeSubscriptionId = session.subscription || user.stripeSubscriptionId;

          if (!user.subscription) user.subscription = {};
          user.subscription.plan = plan.name;
          user.subscription.status = "active";
          user.subscription.documentLimit = plan.documentLimit;
          user.subscription.requestLimit = plan.requestLimit;
          user.subscription.requestsUsed = 0; // Reset for new period
          user.subscription.currentPeriodStart = new Date();
          user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          user.subscription.renewsOn = user.subscription.currentPeriodEnd.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });

          await saveUser(user);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const customerId = sub.customer;
        const status = sub.status; // active, past_due, canceled, unpaid

        // Find user by stripeCustomerId
        let user = null;
        if (mongoose.connection.readyState === 1) {
          user = await User.findOne({ stripeCustomerId: customerId });
        }
        if (!user) {
          for (const [, u] of inMemoryUsers) {
            if (u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
        }

        if (user) {
          user.stripeSubscriptionId = sub.id;
          user.stripePriceId = sub.items?.data?.[0]?.price?.id || null;

          if (!user.subscription) user.subscription = {};
          user.subscription.status = status;

          if (sub.current_period_end) {
            const periodEnd = new Date(sub.current_period_end * 1000);
            user.subscription.currentPeriodEnd = periodEnd;
            user.subscription.renewsOn = periodEnd.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
          }

          // If plan changed via Customer Portal
          const planKey = sub.metadata?.planId;
          if (planKey) {
            const plan = findPlanByKey(planKey);
            if (plan) {
              user.subscription.plan = plan.name;
              user.subscription.documentLimit = plan.documentLimit;
              user.subscription.requestLimit = plan.requestLimit;
            }
          }

          await saveUser(user);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;

        let user = null;
        if (mongoose.connection.readyState === 1) {
          user = await User.findOne({ stripeCustomerId: customerId });
        }
        if (!user) {
          for (const [, u] of inMemoryUsers) {
            if (u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
        }

        if (user) {
          // Automatic downgrade to Free Plan
          user.stripeSubscriptionId = null;
          user.stripePriceId = null;

          if (!user.subscription) user.subscription = {};
          user.subscription.plan = "Free";
          user.subscription.status = "canceled";
          user.subscription.documentLimit = SUBSCRIPTION_PLANS.free.documentLimit;
          user.subscription.requestLimit = SUBSCRIPTION_PLANS.free.requestLimit;
          user.subscription.renewsOn = "Never (Free Tier)";

          await saveUser(user);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        let user = null;
        if (mongoose.connection.readyState === 1) {
          user = await User.findOne({ stripeCustomerId: customerId });
        }
        if (!user) {
          for (const [, u] of inMemoryUsers) {
            if (u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
        }

        if (user) {
          if (!user.subscription) user.subscription = {};
          user.subscription.status = "active";
          user.subscription.requestsUsed = 0; // Fresh monthly quota reset on invoice payment
          if (invoice.lines?.data?.[0]?.period?.end) {
            const periodEnd = new Date(invoice.lines.data[0].period.end * 1000);
            user.subscription.currentPeriodEnd = periodEnd;
            user.subscription.renewsOn = periodEnd.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
          }
          await saveUser(user);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        let user = null;
        if (mongoose.connection.readyState === 1) {
          user = await User.findOne({ stripeCustomerId: customerId });
        }
        if (!user) {
          for (const [, u] of inMemoryUsers) {
            if (u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
        }

        if (user) {
          if (!user.subscription) user.subscription = {};
          user.subscription.status = "past_due";
          await saveUser(user);
        }
        break;
      }

      default:
        // Ignore unhandled event types cleanly
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing error" });
  }
};
