/**
 * E2E Tests for Subscription System
 * Tests all subscription flows including mock payments, validation, and error scenarios
 */

import request from "supertest";
import express from "express";
import subscriptionRoutes from "../subscription.routes";
import * as authService from "../../services/auth.service";
import * as subscriptionService from "../../services/subscription.service";
import * as mockPaymentService from "../../services/mock-payment.service";
import { getFirestore } from "../../config/firebase.config";

// Mock dependencies
jest.mock("../../services/auth.service");
jest.mock("../../services/subscription.service");
jest.mock("../../services/mock-payment.service");
jest.mock("../../config/firebase.config");

const app = express();
app.use(express.json());
app.use("/api/subscription", subscriptionRoutes);

describe("Subscription Routes E2E Tests", () => {
  const mockToken = "mock-jwt-token";
  const mockUserId = "test-user-123";
  const mockUserEmail = "teacher@example.com";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock JWT verification
    (authService.verifyToken as jest.Mock).mockReturnValue({
      uid: mockUserId,
      email: mockUserEmail,
      role: "teacher",
      name: "Test Teacher",
    });
  });

  describe("GET /api/subscription/plans", () => {
    it("should return all subscription plans", async () => {
      const response = await request(app)
        .get("/api/subscription/plans")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plans).toHaveLength(3);

      const plans = response.body.data.plans;
      const planIds = plans.map((p: any) => p.id);

      expect(planIds).toContain("basic");
      expect(planIds).toContain("normal");
      expect(planIds).toContain("pro");

      // Verify Basic plan
      const basicPlan = plans.find((p: any) => p.id === "basic");
      expect(basicPlan.price).toBe(99);
      expect(basicPlan.currency).toBe("eur");
      expect(basicPlan.features.taskCreationCredits).toBe(0);

      // Verify Normal plan
      const normalPlan = plans.find((p: any) => p.id === "normal");
      expect(normalPlan.price).toBe(199);
      expect(normalPlan.features.taskCreationCredits).toBe(1000);

      // Verify Pro plan
      const proPlan = plans.find((p: any) => p.id === "pro");
      expect(proPlan.price).toBe(599);
      expect(proPlan.features.taskCreationCredits).toBe(10000);
      expect(proPlan.features.additionalTeachers).toBe(10);
    });
  });

  describe("POST /api/subscription/create-checkout-session", () => {
    it("should create mock checkout session in development mode", async () => {
      // Mock development mode
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(true);
      (
        mockPaymentService.createMockCheckoutSession as jest.Mock
      ).mockResolvedValue({
        sessionId: "mock_session_123_test-user-123_normal",
        url: "http://localhost:3001/subscription/success?session_id=mock_session_123&mock=true&tier=normal",
      });

      const response = await request(app)
        .post("/api/subscription/create-checkout-session")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          tier: "normal",
          successUrl:
            "http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: "http://localhost:3001/subscription/cancel?cancelled=true",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toContain("mock_session");
      expect(response.body.data.url).toContain("mock=true");
      expect(response.body.data.url).toContain("tier=normal");

      expect(mockPaymentService.createMockCheckoutSession).toHaveBeenCalledWith(
        mockUserId,
        "normal",
        expect.stringContaining("success"),
        expect.stringContaining("cancel")
      );
    });

    it("should create real Stripe checkout session in production mode", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(
        false
      );
      (
        subscriptionService.createCheckoutSession as jest.Mock
      ).mockResolvedValue({
        sessionId: "cs_test_stripe_session_123",
        url: "https://checkout.stripe.com/c/pay/cs_test_stripe_session_123",
      });

      const response = await request(app)
        .post("/api/subscription/create-checkout-session")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          tier: "basic",
          successUrl:
            "http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}",
          cancelUrl: "http://localhost:3001/subscription/cancel?cancelled=true",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toContain("cs_test");
      expect(response.body.data.url).toContain("stripe.com");

      expect(subscriptionService.createCheckoutSession).toHaveBeenCalled();
    });

    it("should reject invalid tier", async () => {
      const response = await request(app)
        .post("/api/subscription/create-checkout-session")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          tier: "invalid_tier",
          successUrl: "http://localhost:3001/subscription/success",
          cancelUrl: "http://localhost:3001/subscription/cancel",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid subscription tier");
    });

    it("should reject trial tier purchase", async () => {
      const response = await request(app)
        .post("/api/subscription/create-checkout-session")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({
          tier: "trial",
          successUrl: "http://localhost:3001/subscription/success",
          cancelUrl: "http://localhost:3001/subscription/cancel",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Invalid subscription tier");
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/subscription/create-checkout-session")
        .send({
          tier: "normal",
          successUrl: "http://localhost:3001/subscription/success",
          cancelUrl: "http://localhost:3001/subscription/cancel",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/subscription/checkout-success", () => {
    it("should handle mock payment success", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(true);
      (
        mockPaymentService.handleMockCheckoutSuccess as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/subscription/checkout-success")
        .send({
          sessionId: "mock_session_123_test-user-123_normal",
          userId: mockUserId,
          tier: "normal",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("activated successfully");

      expect(mockPaymentService.handleMockCheckoutSuccess).toHaveBeenCalledWith(
        "mock_session_123_test-user-123_normal",
        mockUserId,
        "normal"
      );
    });

    it("should handle real Stripe success", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(
        false
      );
      (
        subscriptionService.handleCheckoutSuccess as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/subscription/checkout-success")
        .send({
          sessionId: "cs_test_real_session",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(subscriptionService.handleCheckoutSuccess).toHaveBeenCalledWith(
        "cs_test_real_session"
      );
    });

    it("should require sessionId", async () => {
      const response = await request(app)
        .post("/api/subscription/checkout-success")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Session ID is required");
    });

    it("should require userId and tier for mock payments", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(true);

      const response = await request(app)
        .post("/api/subscription/checkout-success")
        .send({
          sessionId: "mock_session_123",
          // Missing userId and tier
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("User ID and tier are required");
    });
  });

  describe("POST /api/subscription/cancel", () => {
    beforeEach(() => {
      const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: mockUserId,
            email: mockUserEmail,
            role: "teacher",
            subscription: {
              tier: "normal",
              status: "active",
              cancelAtPeriodEnd: false,
            },
          }),
        }),
      };
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    });

    it("should cancel subscription in mock mode", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(true);
      (
        mockPaymentService.cancelMockSubscription as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/subscription/cancel")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("Subscription will be cancelled");

      expect(mockPaymentService.cancelMockSubscription).toHaveBeenCalledWith(
        mockUserId
      );
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/subscription/cancel")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/subscription/reactivate", () => {
    beforeEach(() => {
      const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: mockUserId,
            email: mockUserEmail,
            role: "teacher",
            subscription: {
              tier: "normal",
              status: "active",
              cancelAtPeriodEnd: true,
            },
          }),
        }),
      };
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
    });

    it("should reactivate cancelled subscription in mock mode", async () => {
      (mockPaymentService.isMockPaymentMode as jest.Mock).mockReturnValue(true);
      (
        mockPaymentService.reactivateMockSubscription as jest.Mock
      ).mockResolvedValue(undefined);

      const response = await request(app)
        .post("/api/subscription/reactivate")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("reactivated");

      expect(
        mockPaymentService.reactivateMockSubscription
      ).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("GET /api/subscription/details", () => {
    it("should return subscription details", async () => {
      const mockSubscription = {
        tier: "normal",
        status: "active",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2026-01-01"),
        cancelAtPeriodEnd: false,
      };

      const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: mockUserId,
            email: mockUserEmail,
            role: "teacher",
            subscription: mockSubscription,
            taskCredits: 1000,
          }),
        }),
      };
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

      // Mock getSubscriptionDetails to return subscription with plan
      (
        subscriptionService.getSubscriptionDetails as jest.Mock
      ).mockResolvedValue({
        ...mockSubscription,
        plan: {
          id: "normal",
          name: "Normal",
          features: {},
        },
      });

      const response = await request(app)
        .get("/api/subscription/details")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tier).toBe("normal");
      expect(response.body.data.status).toBe("active");
    });

    it("should return null for users without subscription", async () => {
      const mockFirestore = {
        collection: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            uid: mockUserId,
            email: mockUserEmail,
            role: "teacher",
            // No subscription
          }),
        }),
      };
      (getFirestore as jest.Mock).mockReturnValue(mockFirestore);

      // Mock getSubscriptionDetails to return null
      (
        subscriptionService.getSubscriptionDetails as jest.Mock
      ).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/subscription/details")
        .set("Authorization", `Bearer ${mockToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it("should require authentication", async () => {
      const response = await request(app)
        .get("/api/subscription/details")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
