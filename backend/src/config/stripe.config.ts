import Stripe from "stripe";

// Helper function to safely get Firebase config
function getFirebaseConfig(key: string): Record<string, unknown> {
  try {
    // Only available at runtime in Firebase Functions
    // Dynamic import is necessary here as firebase-functions may not be available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const functions = require("firebase-functions");
    return functions.config()[key];
  } catch {
    return {};
  }
}

// Read from Firebase Functions config first, fallback to .env
const STRIPE_SECRET_KEY =
  (getFirebaseConfig("stripe")?.secret_key as string | undefined) ||
  process.env.STRIPE_SECRET_KEY ||
  "";

const STRIPE_WEBHOOK_SECRET =
  (getFirebaseConfig("stripe")?.webhook_secret as string | undefined) ||
  process.env.STRIPE_WEBHOOK_SECRET ||
  "";

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

// Stripe Price IDs - read from Firebase Functions config first, fallback to .env
export const STRIPE_PRICE_IDS = {
  basic_annual:
    (getFirebaseConfig("stripe")?.price_id_basic_annual as
      | string
      | undefined) ||
    process.env.STRIPE_PRICE_ID_BASIC_ANNUAL ||
    "price_basic_annual",
  normal_annual:
    (getFirebaseConfig("stripe")?.price_id_normal_annual as
      | string
      | undefined) ||
    process.env.STRIPE_PRICE_ID_NORMAL_ANNUAL ||
    "price_normal_annual",
  pro_annual:
    (getFirebaseConfig("stripe")?.price_id_pro_annual as string | undefined) ||
    process.env.STRIPE_PRICE_ID_PRO_ANNUAL ||
    "price_pro_annual",
};

console.log("[Stripe Config] Initialized:", {
  isTestMode,
  hasSecretKey: !!STRIPE_SECRET_KEY,
  hasWebhookSecret: !!STRIPE_WEBHOOK_SECRET,
});
