import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_for_initialization";
export const stripe = new Stripe(stripeKey);

/**
 * Platform Subscription Plans Specification:
 * - Free: ₹0/month, 2 documents, 100 API requests/month
 * - Starter: ₹499/month, 5 documents, 1,000 API requests/month
 * - Pro: ₹999/month, 12 documents, 2,500 API requests/month
 * - Enterprise: Contact us, Custom documents, Custom API requests
 */
export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Free",
    displayName: "Free Plan",
    price: "₹0",
    currency: "INR",
    priceInPaise: 0,
    interval: "month",
    documentLimit: 2,
    requestLimit: 100,
    features: [
      "2 documents upload limit",
      "100 API requests / month",
      "Standard vector indexing",
      "Community support"
    ],
    isPopular: false,
    isPaid: false,
    isEnterprise: false
  },
  starter: {
    id: "starter",
    name: "Starter",
    displayName: "Starter Plan",
    price: "₹499",
    currency: "INR",
    priceInPaise: 49900,
    interval: "month",
    documentLimit: 5,
    requestLimit: 1000,
    features: [
      "5 documents upload limit",
      "1,000 API requests / month",
      "High-throughput vector search",
      "Priority embedding pipeline",
      "Standard email support"
    ],
    isPopular: true,
    isPaid: true,
    isEnterprise: false
  },
  pro: {
    id: "pro",
    name: "Pro",
    displayName: "Pro Plan",
    price: "₹999",
    currency: "INR",
    priceInPaise: 99900,
    interval: "month",
    documentLimit: 12,
    requestLimit: 2500,
    features: [
      "12 documents upload limit",
      "2,500 API requests / month",
      "Dedicated vector indexing",
      "Custom chunking parameters",
      "Priority email support"
    ],
    isPopular: false,
    isPaid: true,
    isEnterprise: false
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    displayName: "Enterprise",
    price: "Custom",
    currency: "INR",
    priceInPaise: 0,
    interval: "custom",
    documentLimit: 999999,
    requestLimit: 999999,
    features: [
      "Custom document upload limit",
      "Custom API request quotas",
      "Dedicated infrastructure & SLAs",
      "Custom chunking & embedding models",
      "24/7 dedicated support manager"
    ],
    isPopular: false,
    isPaid: false,
    isEnterprise: true
  }
};

/**
 * Match a plan by key or name
 */
export const findPlanByKey = (keyOrName) => {
  if (!keyOrName) return null;
  const normalized = keyOrName.toLowerCase().trim();

  for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (
      key.toLowerCase() === normalized ||
      plan.name.toLowerCase() === normalized ||
      plan.displayName.toLowerCase() === normalized
    ) {
      return plan;
    }
  }
  return null;
};

/**
 * Get or create a Stripe customer
 */
export const getOrCreateStripeCustomer = async ({ email, name, userId, organizationId }) => {
  if (!email) throw new Error("Email is required to create a Stripe customer");

  // Search existing customers by email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    // Keep metadata synced
    await stripe.customers.update(customer.id, {
      metadata: {
        userId: userId || "",
        organizationId: organizationId || userId || ""
      }
    });
    return customer;
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name: name || email.split("@")[0],
    metadata: {
      userId: userId || "",
      organizationId: organizationId || userId || ""
    }
  });
};
