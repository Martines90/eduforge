import { API_BASE_URL } from './api.service';
import type { SubscriptionTier, PlansResponse, CheckoutSessionResponse } from '@/types/subscription';

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<PlansResponse> {
  const response = await fetch(`${API_BASE_URL}/subscription/plans`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch subscription plans');
  }

  return response.json();
}

/**
 * Create a checkout session for a subscription tier
 */
export async function createCheckoutSession(
  tier: SubscriptionTier,
  token: string
): Promise<CheckoutSessionResponse> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';

  const response = await fetch(`${API_BASE_URL}/subscription/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      tier,
      successUrl: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/subscription/cancel?cancelled=true`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Handle successful checkout
 */
export async function handleCheckoutSuccess(
  sessionId: string,
  userId?: string,
  tier?: SubscriptionTier
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subscription/checkout-success`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      userId,
      tier,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to process checkout');
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subscription/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to cancel subscription');
  }
}

/**
 * Reactivate a cancelled subscription
 */
export async function reactivateSubscription(token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subscription/reactivate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to reactivate subscription');
  }
}
