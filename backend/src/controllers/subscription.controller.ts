import { Request, Response } from "express";
import * as subscriptionService from "../services/subscription.service";
import * as mockPaymentService from "../services/mock-payment.service";
import {
  SubscriptionTier,
  SUBSCRIPTION_PLANS,
} from "../types/subscription.types";
import { stripe, stripeConfig } from "../config/stripe.config";
import { verifyToken } from "../services/auth.service";

/**
 * GET /api/subscription/plans
 * Get all available subscription plans
 */
export async function getPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = Object.values(SUBSCRIPTION_PLANS).filter(
      (plan) => plan.id !== "trial"
    );

    res.status(200).json({
      success: true,
      message: "Subscription plans retrieved successfully",
      data: { plans },
    });
  } catch (error: any) {
    console.error("Get plans error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription plans",
      error: error.message,
    });
  }
}

/**
 * POST /api/subscription/create-checkout-session
 * Create a checkout session for subscribing to a plan
 */
export async function createCheckoutSession(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const { tier, successUrl, cancelUrl } = req.body;

    // Validate tier
    if (!tier || !["basic", "normal", "pro"].includes(tier)) {
      res.status(400).json({
        success: false,
        message: "Invalid subscription tier",
      });
      return;
    }

    // Validate URLs
    if (!successUrl || !cancelUrl) {
      res.status(400).json({
        success: false,
        message: "Success URL and Cancel URL are required",
      });
      return;
    }

    // Use mock payment service if in development mode
    let sessionData;
    if (mockPaymentService.isMockPaymentMode()) {
      console.log("[Subscription Controller] Using mock payment mode");
      sessionData = await mockPaymentService.createMockCheckoutSession(
        decoded.uid,
        tier as SubscriptionTier,
        successUrl,
        cancelUrl
      );
    } else {
      sessionData = await subscriptionService.createCheckoutSession(
        decoded.uid,
        tier as SubscriptionTier,
        successUrl,
        cancelUrl
      );
    }

    res.status(200).json({
      success: true,
      message: "Checkout session created successfully",
      data: sessionData,
    });
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
      error: error.message,
    });
  }
}

/**
 * POST /api/subscription/checkout-success
 * Handle successful checkout (called from frontend after redirect)
 */
export async function checkoutSuccess(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId, userId, tier } = req.body;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
      return;
    }

    // Use mock payment service if in development mode
    if (mockPaymentService.isMockPaymentMode()) {
      if (!userId || !tier) {
        res.status(400).json({
          success: false,
          message: "User ID and tier are required for mock payment",
        });
        return;
      }

      await mockPaymentService.handleMockCheckoutSuccess(
        sessionId,
        userId,
        tier as SubscriptionTier
      );
    } else {
      await subscriptionService.handleCheckoutSuccess(sessionId);
    }

    res.status(200).json({
      success: true,
      message: "Subscription activated successfully",
    });
  } catch (error: any) {
    console.error("Checkout success error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process checkout success",
      error: error.message,
    });
  }
}

/**
 * POST /api/subscription/webhook
 * Handle Stripe webhook events
 */
export async function webhookHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      res.status(400).json({
        success: false,
        message: "No signature provided",
      });
      return;
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      stripeConfig.webhookSecret
    );

    // Handle the event
    await subscriptionService.handleStripeWebhook(event);

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    res.status(400).json({
      success: false,
      message: "Webhook error",
      error: error.message,
    });
  }
}

/**
 * POST /api/subscription/cancel
 * Cancel subscription at period end
 */
export async function cancelSubscription(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Use mock payment service if in development mode
    if (mockPaymentService.isMockPaymentMode()) {
      await mockPaymentService.cancelMockSubscription(decoded.uid);
    } else {
      await subscriptionService.cancelSubscription(decoded.uid);
    }

    res.status(200).json({
      success: true,
      message:
        "Subscription will be cancelled at the end of the billing period",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription",
      error: error.message,
    });
  }
}

/**
 * POST /api/subscription/reactivate
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Use mock payment service if in development mode
    if (mockPaymentService.isMockPaymentMode()) {
      await mockPaymentService.reactivateMockSubscription(decoded.uid);
    } else {
      await subscriptionService.reactivateSubscription(decoded.uid);
    }

    res.status(200).json({
      success: true,
      message: "Subscription reactivated successfully",
    });
  } catch (error: any) {
    console.error("Reactivate subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reactivate subscription",
      error: error.message,
    });
  }
}

/**
 * GET /api/subscription/details
 * Get current user's subscription details
 */
export async function getSubscriptionDetails(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const details = await subscriptionService.getSubscriptionDetails(
      decoded.uid
    );

    res.status(200).json({
      success: true,
      message: "Subscription details retrieved successfully",
      data: details,
    });
  } catch (error: any) {
    console.error("Get subscription details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription details",
      error: error.message,
    });
  }
}
