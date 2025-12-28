/**
 * E2E Tests for Mock Payment Service
 * Tests mock checkout flow, subscription activation, and credit allocation
 */

import {
  createMockCheckoutSession,
  handleMockCheckoutSuccess,
  cancelMockSubscription,
  reactivateMockSubscription,
  isMockPaymentMode,
} from '../mock-payment.service';
import { getFirestore } from '../../config/firebase.config';
import { SUBSCRIPTION_PLANS } from '../../types/subscription.types';

jest.mock('../../config/firebase.config');

describe('Mock Payment Service E2E Tests', () => {
  let mockFirestore: any;
  let mockUserDoc: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserDoc = {
      exists: true,
      data: () => ({
        uid: 'test-user-123',
        email: 'teacher@example.com',
        name: 'Test Teacher',
        role: 'teacher',
        subscription: {
          tier: 'trial',
          status: 'active',
        },
        taskCredits: 100,
      }),
    };

    mockFirestore = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue(mockUserDoc),
      update: jest.fn().mockResolvedValue(undefined),
    };

    (getFirestore as jest.Mock).mockReturnValue(mockFirestore);
  });

  describe('isMockPaymentMode', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return true in development mode by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.USE_MOCK_PAYMENTS;

      const result = isMockPaymentMode();
      expect(result).toBe(true);
    });

    it('should return false in development if explicitly disabled', () => {
      process.env.NODE_ENV = 'development';
      process.env.USE_MOCK_PAYMENTS = 'false';

      const result = isMockPaymentMode();
      expect(result).toBe(false);
    });

    it('should return false in production by default', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.USE_MOCK_PAYMENTS;

      const result = isMockPaymentMode();
      expect(result).toBe(false);
    });

    it('should return true in production if explicitly enabled', () => {
      process.env.NODE_ENV = 'production';
      process.env.USE_MOCK_PAYMENTS = 'true';

      const result = isMockPaymentMode();
      expect(result).toBe(true);
    });
  });

  describe('createMockCheckoutSession', () => {
    it('should create mock session for Basic plan', async () => {
      const result = await createMockCheckoutSession(
        'test-user-123',
        'basic',
        'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      expect(result.sessionId).toContain('mock_session_');
      expect(result.sessionId).toContain('test-user-123');
      expect(result.sessionId).toContain('basic');
      expect(result.url).toContain('/subscription/success');
      expect(result.url).toContain('mock=true');
      expect(result.url).toContain('tier=basic');
      expect(result.url).toContain('session_id=');
    });

    it('should create mock session for Normal plan', async () => {
      const result = await createMockCheckoutSession(
        'test-user-123',
        'normal',
        'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      expect(result.sessionId).toContain('normal');
      expect(result.url).toContain('tier=normal');
    });

    it('should create mock session for Pro plan', async () => {
      const result = await createMockCheckoutSession(
        'test-user-123',
        'pro',
        'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      expect(result.sessionId).toContain('pro');
      expect(result.url).toContain('tier=pro');
    });

    it('should reject trial tier', async () => {
      await expect(
        createMockCheckoutSession(
          'test-user-123',
          'trial',
          'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
          'http://localhost:3001/subscription/cancel'
        )
      ).rejects.toThrow('Cannot purchase trial subscription');
    });

    it('should reject if user not found', async () => {
      mockFirestore.get.mockResolvedValueOnce({ exists: false });

      await expect(
        createMockCheckoutSession(
          'non-existent-user',
          'normal',
          'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
          'http://localhost:3001/subscription/cancel'
        )
      ).rejects.toThrow('User not found');
    });

    it('should append to existing query params', async () => {
      const result = await createMockCheckoutSession(
        'test-user-123',
        'normal',
        'http://localhost:3001/subscription/success?existing=param&session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      expect(result.url).toContain('existing=param');
      expect(result.url).toContain('&session_id=');
      expect(result.url).toContain('&mock=true');
    });
  });

  describe('handleMockCheckoutSuccess', () => {
    it('should activate Basic plan subscription', async () => {
      await handleMockCheckoutSuccess(
        'mock_session_123',
        'test-user-123',
        'basic'
      );

      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockFirestore.doc).toHaveBeenCalledWith('test-user-123');
      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription: expect.objectContaining({
            tier: 'basic',
            status: 'active',
            cancelAtPeriodEnd: false,
          }),
          taskCredits: SUBSCRIPTION_PLANS.basic.features.taskCreationCredits, // 0
        })
      );
    });

    it('should activate Normal plan with 1,000 credits', async () => {
      await handleMockCheckoutSuccess(
        'mock_session_123',
        'test-user-123',
        'normal'
      );

      const updateCall = mockFirestore.update.mock.calls[0][0];
      expect(updateCall.subscription.tier).toBe('normal');
      expect(updateCall.taskCredits).toBe(1000);
    });

    it('should activate Pro plan with 10,000 credits', async () => {
      await handleMockCheckoutSuccess(
        'mock_session_123',
        'test-user-123',
        'pro'
      );

      const updateCall = mockFirestore.update.mock.calls[0][0];
      expect(updateCall.subscription.tier).toBe('pro');
      expect(updateCall.taskCredits).toBe(10000);
    });

    it('should set subscription dates (1 year from now)', async () => {
      const beforeTest = new Date();

      await handleMockCheckoutSuccess(
        'mock_session_123',
        'test-user-123',
        'normal'
      );

      const afterTest = new Date();
      const updateCall = mockFirestore.update.mock.calls[0][0];

      // Check start date is around now
      const startDate = updateCall.subscription.startDate;
      expect(startDate.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(startDate.getTime()).toBeLessThanOrEqual(afterTest.getTime());

      // Check end date is approximately 1 year from now
      const endDate = updateCall.subscription.endDate;
      const expectedEndDate = new Date();
      expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);

      const timeDiff = Math.abs(endDate.getTime() - expectedEndDate.getTime());
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds
    });

    it('should create Stripe mock IDs', async () => {
      await handleMockCheckoutSuccess(
        'mock_session_123',
        'test-user-123',
        'normal'
      );

      const updateCall = mockFirestore.update.mock.calls[0][0];
      expect(updateCall.subscription.stripeCustomerId).toContain('mock_customer_');
      expect(updateCall.subscription.stripeSubscriptionId).toContain('mock_sub_');
      expect(updateCall.subscription.stripePriceId).toContain('mock_price_normal');
    });

    it('should reject if user not found', async () => {
      mockFirestore.get.mockResolvedValueOnce({ exists: false });

      await expect(
        handleMockCheckoutSuccess(
          'mock_session_123',
          'non-existent-user',
          'normal'
        )
      ).rejects.toThrow('User not found');
    });
  });

  describe('cancelMockSubscription', () => {
    beforeEach(() => {
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        email: 'teacher@example.com',
        subscription: {
          tier: 'normal',
          status: 'active',
          cancelAtPeriodEnd: false,
        },
      });
    });

    it('should mark subscription for cancellation', async () => {
      await cancelMockSubscription('test-user-123');

      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'subscription.cancelAtPeriodEnd': true,
        })
      );
    });

    it('should reject if user not found', async () => {
      mockFirestore.get.mockResolvedValueOnce({ exists: false });

      await expect(
        cancelMockSubscription('non-existent-user')
      ).rejects.toThrow('User not found');
    });

    it('should reject if no active subscription', async () => {
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        email: 'teacher@example.com',
        // No subscription
      });

      await expect(
        cancelMockSubscription('test-user-123')
      ).rejects.toThrow('No active subscription found');
    });
  });

  describe('reactivateMockSubscription', () => {
    beforeEach(() => {
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        email: 'teacher@example.com',
        subscription: {
          tier: 'normal',
          status: 'active',
          cancelAtPeriodEnd: true,
        },
      });
    });

    it('should remove cancel flag', async () => {
      await reactivateMockSubscription('test-user-123');

      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'subscription.cancelAtPeriodEnd': false,
        })
      );
    });

    it('should reject if user not found', async () => {
      mockFirestore.get.mockResolvedValueOnce({ exists: false });

      await expect(
        reactivateMockSubscription('non-existent-user')
      ).rejects.toThrow('User not found');
    });

    it('should reject if no subscription', async () => {
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        email: 'teacher@example.com',
        // No subscription
      });

      await expect(
        reactivateMockSubscription('test-user-123')
      ).rejects.toThrow('No subscription found');
    });
  });

  describe('End-to-End Mock Payment Flow', () => {
    it('should complete full upgrade flow from Trial to Normal', async () => {
      const userId = 'test-user-123';
      const tier = 'normal';

      // Step 1: Create checkout session
      const session = await createMockCheckoutSession(
        userId,
        tier,
        'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      expect(session.sessionId).toBeTruthy();
      expect(session.url).toContain('mock=true');

      // Step 2: Handle checkout success
      await handleMockCheckoutSuccess(session.sessionId, userId, tier);

      // Step 3: Verify subscription was activated
      const updateCall = mockFirestore.update.mock.calls[0][0];
      expect(updateCall.subscription.tier).toBe('normal');
      expect(updateCall.subscription.status).toBe('active');
      expect(updateCall.taskCredits).toBe(1000);
      expect(updateCall.subscription.cancelAtPeriodEnd).toBe(false);
    });

    it('should complete cancellation and reactivation flow', async () => {
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        subscription: {
          tier: 'normal',
          status: 'active',
          cancelAtPeriodEnd: false,
        },
      });

      // Step 1: Cancel subscription
      await cancelMockSubscription('test-user-123');
      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'subscription.cancelAtPeriodEnd': true,
        })
      );

      // Update mock for reactivation test
      mockUserDoc.data = () => ({
        uid: 'test-user-123',
        subscription: {
          tier: 'normal',
          status: 'active',
          cancelAtPeriodEnd: true,
        },
      });

      // Step 2: Reactivate subscription
      jest.clearAllMocks();
      await reactivateMockSubscription('test-user-123');
      expect(mockFirestore.update).toHaveBeenCalledWith(
        expect.objectContaining({
          'subscription.cancelAtPeriodEnd': false,
        })
      );
    });

    it('should handle upgrade from Trial to Pro with full credits', async () => {
      const userId = 'test-user-123';
      const tier = 'pro';

      // Create and complete checkout
      const session = await createMockCheckoutSession(
        userId,
        tier,
        'http://localhost:3001/subscription/success?session_id={CHECKOUT_SESSION_ID}',
        'http://localhost:3001/subscription/cancel'
      );

      await handleMockCheckoutSuccess(session.sessionId, userId, tier);

      // Verify Pro plan features
      const updateCall = mockFirestore.update.mock.calls[0][0];
      expect(updateCall.subscription.tier).toBe('pro');
      expect(updateCall.taskCredits).toBe(10000); // Pro gets 10,000 credits
    });
  });
});
