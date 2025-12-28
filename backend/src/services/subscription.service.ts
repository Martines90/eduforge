import { stripe, STRIPE_PRICE_IDS } from "../config/stripe.config";
import { getFirestore } from "../config/firebase.config";
import {
  SubscriptionTier,
  SubscriptionData,
  SUBSCRIPTION_PLANS,
} from "../types/subscription.types";
import { UserDocument } from "../types/auth.types";

/**
 * Create a Stripe checkout session for a subscription
 */
export async function createCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const db = getFirestore();

  // Get user
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data() as UserDocument;

  // Trial users can't checkout for trial
  if (tier === "trial") {
    throw new Error("Cannot purchase trial subscription");
  }

  // Get price ID based on tier
  const priceId = getPriceIdForTier(tier);

  // Create or get Stripe customer
  let customerId = user.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.uid,
        role: user.role,
        country: user.country,
      },
      // Set customer's country for tax calculation
      address: {
        country: user.country.toUpperCase(), // ISO country code (e.g., 'HU', 'US', 'MX')
      },
    });
    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: user.uid,
      tier,
    },
    subscription_data: {
      metadata: {
        userId: user.uid,
        tier,
      },
    },
    // Enable automatic tax calculation
    automatic_tax: {
      enabled: true,
    },
    // Set customer's billing address country
    customer_update: {
      address: "auto",
    },
  });

  if (!session.url) {
    throw new Error("Failed to create checkout session");
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Handle successful checkout - upgrade user subscription
 */
export async function handleCheckoutSuccess(sessionId: string): Promise<void> {
  const db = getFirestore();

  // Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription", "customer"],
  });

  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed");
  }

  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as SubscriptionTier;

  if (!userId || !tier) {
    throw new Error("Missing metadata in checkout session");
  }

  const subscription = session.subscription as any;
  const customer = session.customer as any;

  // Update user subscription in Firestore
  const startDate = new Date(subscription.current_period_start * 1000);
  const endDate = new Date(subscription.current_period_end * 1000);

  const subscriptionData: SubscriptionData = {
    tier,
    status: "active",
    startDate: startDate as any,
    endDate: endDate as any,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  // Get plan configuration
  const plan = SUBSCRIPTION_PLANS[tier];

  // Update user document
  await db.collection("users").doc(userId).update({
    subscription: subscriptionData,
    taskCredits: plan.features.taskCreationCredits,
    updatedAt: new Date(),
  });

  console.log(`[Subscription Service] User ${userId} upgraded to ${tier}`);
}

/**
 * Handle subscription webhook events from Stripe
 */
export async function handleStripeWebhook(event: any): Promise<void> {
  const db = getFirestore();

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSuccess(event.data.object.id);
      break;

    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.error(
            "[Subscription Service] No userId in subscription metadata"
          );
          return;
        }

        // Determine status
        let status: SubscriptionData["status"] = "active";
        if (
          subscription.status === "canceled" ||
          subscription.status === "incomplete_expired"
        ) {
          status = "cancelled";
        } else if (subscription.status === "past_due") {
          status = "past_due";
        } else if (subscription.status === "unpaid") {
          status = "expired";
        }

        // Update subscription in Firestore
        await db.collection("users").doc(userId).update({
          "subscription.status": status,
          "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
          updatedAt: new Date(),
        });

        console.log(
          `[Subscription Service] Updated subscription for user ${userId}: ${status}`
        );
      }
      break;

    case "invoice.payment_failed":
      {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by Stripe customer ID
        const usersSnapshot = await db
          .collection("users")
          .where("subscription.stripeCustomerId", "==", customerId)
          .get();

        if (!usersSnapshot.empty) {
          const userId = usersSnapshot.docs[0].id;
          await db.collection("users").doc(userId).update({
            "subscription.status": "past_due",
            updatedAt: new Date(),
          });

          console.log(
            `[Subscription Service] Payment failed for user ${userId}`
          );
        }
      }
      break;

    default:
      console.log(`[Subscription Service] Unhandled event type: ${event.type}`);
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const db = getFirestore();

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription?.stripeSubscriptionId) {
    throw new Error("No active subscription found");
  }

  // Cancel subscription in Stripe
  await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Update in Firestore
  await db.collection("users").doc(userId).update({
    "subscription.cancelAtPeriodEnd": true,
    updatedAt: new Date(),
  });

  console.log(
    `[Subscription Service] Subscription cancelled for user ${userId}`
  );
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(userId: string): Promise<void> {
  const db = getFirestore();

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription?.stripeSubscriptionId) {
    throw new Error("No subscription found");
  }

  // Reactivate subscription in Stripe
  await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  // Update in Firestore
  await db.collection("users").doc(userId).update({
    "subscription.cancelAtPeriodEnd": false,
    updatedAt: new Date(),
  });

  console.log(
    `[Subscription Service] Subscription reactivated for user ${userId}`
  );
}

/**
 * Get price ID for a subscription tier
 */
function getPriceIdForTier(tier: SubscriptionTier): string {
  switch (tier) {
    case "basic":
      return STRIPE_PRICE_IDS.basic_annual;
    case "normal":
      return STRIPE_PRICE_IDS.normal_annual;
    case "pro":
      return STRIPE_PRICE_IDS.pro_annual;
    default:
      throw new Error(`Invalid subscription tier: ${tier}`);
  }
}

/**
 * Check if user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const db = getFirestore();

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    return false;
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription) {
    return false;
  }

  const now = new Date();
  const endDate = user.subscription.endDate.toDate();

  return user.subscription.status === "active" && endDate > now;
}

/**
 * Get subscription details for a user
 */
export async function getSubscriptionDetails(userId: string) {
  const db = getFirestore();

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription) {
    return null;
  }

  const plan = SUBSCRIPTION_PLANS[user.subscription.tier];

  return {
    ...user.subscription,
    plan,
  };
}
