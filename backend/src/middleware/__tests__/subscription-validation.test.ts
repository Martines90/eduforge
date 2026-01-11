/**
 * E2E Tests for Subscription Validation Middleware
 * Tests all validation scenarios: active subscription, credits, Basic plan requirement
 */

import { Request, Response, NextFunction } from "express";
import {
  requireActiveSubscription,
  requireBasicPlan,
  requireTaskCredits,
} from "../role.middleware";
import * as authService from "../../services/auth.service";

jest.mock("../../services/auth.service");

describe("Subscription Validation Middleware E2E Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Mock system date FIRST to 2025-12-01 to make all subscription dates valid
    const realDate = Date;
    const mockDate = new realDate('2025-12-01');
    // @ts-ignore
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          // @ts-ignore
          super(...args);
        }
      }
      static now() {
        return mockDate.getTime();
      }
    } as any;
    // Copy all static methods from Date
    Object.assign(global.Date, realDate);

    jest.clearAllMocks();

    mockReq = {
      user: {
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher" as any,
        name: "Test Teacher",
      },
    } as any;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    // Restore real Date (already handled by jest.clearAllMocks)
  });

  describe("requireActiveSubscription Middleware", () => {
    it("should pass with active subscription", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher",
        subscription: {
          tier: "normal",
          status: "active",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2030-01-01"), // Valid date relative to mocked current time (2025-12-01)
        },
        taskCredits: 1000,
      });

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect((mockReq as any).subscription).toBeDefined();
      expect((mockReq as any).subscription.tier).toBe("normal");
    });

    it("should reject when no subscription exists", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher",
        // No subscription
      });

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            "Your subscription has ended! Go to My Subscriptions and pick a plan!",
          errorCode: "NO_SUBSCRIPTION",
        })
      );
    });

    it("should reject inactive subscription", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher",
        subscription: {
          tier: "normal",
          status: "cancelled",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2026-01-01"),
        },
      });

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            "Your Normal plan subscription has ended! Go to My Subscriptions and pick/restart a plan!",
          errorCode: "SUBSCRIPTION_INACTIVE",
          data: {
            subscriptionTier: "normal",
            subscriptionStatus: "cancelled",
          },
        })
      );
    });

    it("should reject expired subscription (past end date)", async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher",
        subscription: {
          tier: "basic",
          status: "active", // Status is active but date has passed
          startDate: new Date("2024-01-01"),
          endDate: pastDate,
        },
      });

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            "Your Basic plan subscription has ended! Go to My Subscriptions and pick/restart a plan!",
          errorCode: "SUBSCRIPTION_EXPIRED",
        })
      );
    });

    it("should require authentication", async () => {
      (mockReq as any).user = undefined;

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Authentication required",
        })
      );
    });

    it("should handle user not found", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue(null);

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe("requireBasicPlan Middleware", () => {
    it("should pass with Basic plan", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        subscription: {
          tier: "basic",
          status: "active",
        },
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should pass with Normal plan", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        subscription: {
          tier: "normal",
          status: "active",
        },
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should pass with Pro plan", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        subscription: {
          tier: "pro",
          status: "active",
        },
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should pass with Trial plan", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        subscription: {
          tier: "trial",
          status: "active",
        },
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("should reject no subscription", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        // No subscription
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          errorCode: "NO_ACTIVE_SUBSCRIPTION",
        })
      );
    });

    it("should reject inactive subscription", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        subscription: {
          tier: "basic",
          status: "expired",
        },
      });

      await requireBasicPlan(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requireTaskCredits Middleware", () => {
    it("should pass with sufficient credits", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        taskCredits: 100,
      });

      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect((mockReq as any).remainingCredits).toBe(100);
    });

    it("should pass with exactly 1 credit", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        taskCredits: 1,
      });

      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).remainingCredits).toBe(1);
    });

    it("should reject with 0 credits", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        taskCredits: 0,
      });

      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message:
            'You run out of credits! Subscribe for any plan to get more credits at "My Subscription".',
          errorCode: "NO_CREDITS",
          data: {
            remainingCredits: 0,
          },
        })
      );
    });

    it("should reject with undefined credits", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        // taskCredits is undefined
      });

      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("should reject with negative credits", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        taskCredits: -10,
      });

      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe("Combined Middleware Chain", () => {
    it("should pass all checks for Normal plan with credits", async () => {
      const user = {
        uid: "test-user-123",
        email: "teacher@example.com",
        role: "teacher",
        subscription: {
          tier: "normal",
          status: "active",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2030-01-01"), // Valid date relative to mocked current time (2025-12-01)
        },
        taskCredits: 1000,
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(user);

      // Test requireActiveSubscription
      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      expect(mockNext).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();
      (authService.getUserById as jest.Mock).mockResolvedValue(user);

      // Test requireTaskCredits
      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it("should fail on first check (no subscription)", async () => {
      (authService.getUserById as jest.Mock).mockResolvedValue({
        uid: "test-user-123",
        taskCredits: 1000, // Has credits but no subscription
      });

      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it("should fail on second check (no credits)", async () => {
      const user = {
        uid: "test-user-123",
        subscription: {
          tier: "basic",
          status: "active",
        },
        taskCredits: 0, // Has subscription but no credits
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(user);

      // First check passes
      await requireActiveSubscription(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      expect(mockNext).toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();
      (authService.getUserById as jest.Mock).mockResolvedValue(user);

      // Second check fails
      await requireTaskCredits(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: "NO_CREDITS",
        })
      );
    });
  });
});
