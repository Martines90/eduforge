import { Router } from "express";
import * as subscriptionController from "../controllers/subscription.controller";

const router = Router();

/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Successfully retrieved subscription plans
 *       500:
 *         description: Server error
 */
router.get("/plans", subscriptionController.getPlans);

/**
 * @swagger
 * /api/subscription/create-checkout-session:
 *   post:
 *     summary: Create a checkout session for subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tier
 *               - successUrl
 *               - cancelUrl
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [basic, normal, pro]
 *               successUrl:
 *                 type: string
 *               cancelUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid input
 */
router.post(
  "/create-checkout-session",
  subscriptionController.createCheckoutSession
);

/**
 * @swagger
 * /api/subscription/checkout-success:
 *   post:
 *     summary: Handle successful checkout
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               userId:
 *                 type: string
 *               tier:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription activated successfully
 *       400:
 *         description: Invalid input
 */
router.post("/checkout-success", subscriptionController.checkoutSuccess);

/**
 * @swagger
 * /api/subscription/webhook:
 *   post:
 *     summary: Handle Stripe webhook events
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Invalid signature
 */
router.post("/webhook", subscriptionController.webhookHandler);

/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Cancel subscription at period end
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription will be cancelled at period end
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/cancel", subscriptionController.cancelSubscription);

/**
 * @swagger
 * /api/subscription/reactivate:
 *   post:
 *     summary: Reactivate a cancelled subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription reactivated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/reactivate", subscriptionController.reactivateSubscription);

/**
 * @swagger
 * /api/subscription/details:
 *   get:
 *     summary: Get current user's subscription details
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/details", subscriptionController.getSubscriptionDetails);

export default router;
