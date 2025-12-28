import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Use test mode when in development or if no key is provided
const isTestMode = process.env.NODE_ENV !== "production" || !STRIPE_SECRET_KEY;

// Initialize Stripe with the secret key
export const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const stripeConfig = {
  secretKey: STRIPE_SECRET_KEY,
  webhookSecret: STRIPE_WEBHOOK_SECRET,
  isTestMode,
};

// Stripe Price IDs (you'll need to create these in Stripe Dashboard or via API)
// For now, we'll use placeholder IDs that need to be set in environment variables
export const STRIPE_PRICE_IDS = {
  basic_annual:
    process.env.STRIPE_PRICE_ID_BASIC_ANNUAL || "price_basic_annual",
  normal_annual:
    process.env.STRIPE_PRICE_ID_NORMAL_ANNUAL || "price_normal_annual",
  pro_annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || "price_pro_annual",
};

console.log("[Stripe Config] Initialized:", {
  isTestMode,
  hasSecretKey: !!STRIPE_SECRET_KEY,
  hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
});
