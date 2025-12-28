import { getFirestore } from '../config/firebase.config';
import { SubscriptionTier, SubscriptionData, SUBSCRIPTION_PLANS } from '../types/subscription.types';
import { UserDocument } from '../types/auth.types';

/**
 * Mock payment service for localhost development
 * Simulates Stripe checkout without actual payment processing
 */

/**
 * Create a mock checkout session (simulates Stripe)
 */
export async function createMockCheckoutSession(
  userId: string,
  tier: SubscriptionTier,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string }> {
  const db = getFirestore();

  // Get user
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as UserDocument;

  // Trial users can't checkout for trial
  if (tier === 'trial') {
    throw new Error('Cannot purchase trial subscription');
  }

  // Generate mock session ID with tier info
  const sessionId = `mock_session_${Date.now()}_${userId}_${tier}`;

  // In mock mode, redirect directly to success URL with session_id, mock flag, and tier
  const mockUrl = `${successUrl}${successUrl.includes('?') ? '&' : '?'}session_id=${sessionId}&mock=true&tier=${tier}`;

  console.log('[Mock Payment] Created mock checkout session:', {
    sessionId,
    userId,
    tier,
    user: user.email,
  });

  return {
    sessionId,
    url: mockUrl,
  };
}

/**
 * Handle mock checkout success
 */
export async function handleMockCheckoutSuccess(
  sessionId: string,
  userId: string,
  tier: SubscriptionTier
): Promise<void> {
  const db = getFirestore();

  console.log('[Mock Payment] Processing mock payment success:', {
    sessionId,
    userId,
    tier,
  });

  // Get user
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as UserDocument;

  // Calculate subscription dates (1 year from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  // Create mock subscription data
  const subscriptionData: SubscriptionData = {
    tier,
    status: 'active',
    startDate: startDate as any,
    endDate: endDate as any,
    stripeCustomerId: `mock_customer_${userId}`,
    stripeSubscriptionId: `mock_sub_${Date.now()}`,
    stripePriceId: `mock_price_${tier}`,
    cancelAtPeriodEnd: false,
  };

  // Get plan configuration
  const plan = SUBSCRIPTION_PLANS[tier];

  // Update user document
  await db.collection('users').doc(userId).update({
    subscription: subscriptionData,
    taskCredits: plan.features.taskCreationCredits,
    updatedAt: new Date(),
  });

  console.log('[Mock Payment] Successfully upgraded user:', {
    userId,
    tier,
    credits: plan.features.taskCreationCredits,
    email: user.email,
  });
}

/**
 * Mock subscription cancellation
 */
export async function cancelMockSubscription(userId: string): Promise<void> {
  const db = getFirestore();

  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription) {
    throw new Error('No active subscription found');
  }

  // Mark subscription to cancel at period end
  await db.collection('users').doc(userId).update({
    'subscription.cancelAtPeriodEnd': true,
    updatedAt: new Date(),
  });

  console.log('[Mock Payment] Subscription marked for cancellation:', userId);
}

/**
 * Mock subscription reactivation
 */
export async function reactivateMockSubscription(userId: string): Promise<void> {
  const db = getFirestore();

  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const user = userDoc.data() as UserDocument;

  if (!user.subscription) {
    throw new Error('No subscription found');
  }

  // Remove cancel flag
  await db.collection('users').doc(userId).update({
    'subscription.cancelAtPeriodEnd': false,
    updatedAt: new Date(),
  });

  console.log('[Mock Payment] Subscription reactivated:', userId);
}

/**
 * Check if we're in mock payment mode
 * Automatically enabled in development mode
 */
export function isMockPaymentMode(): boolean {
  // Always use mock payments in development unless explicitly disabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.USE_MOCK_PAYMENTS !== 'false';
  }

  // In production, only use mock if explicitly enabled
  return process.env.USE_MOCK_PAYMENTS === 'true';
}
