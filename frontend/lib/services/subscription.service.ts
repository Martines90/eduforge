import { API_BASE_URL, buildApiUrl } from './api.service';
import { APP_BASE_URL } from '@/lib/config/urls';
import type { SubscriptionTier, PlansResponse, CheckoutSessionResponse } from '@/types/subscription';

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<PlansResponse> {
  const response = await fetch(buildApiUrl('/subscription/plans'), {
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

  const response = await fetch(buildApiUrl('/subscription/create-checkout-session'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      tier,
      successUrl: `${APP_BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${APP_BASE_URL}/subscription/cancel?cancelled=true`,
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
  const response = await fetch(buildApiUrl('/subscription/checkout-success'), {
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
  const response = await fetch(buildApiUrl('/subscription/cancel'), {
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
  const response = await fetch(buildApiUrl('/subscription/reactivate'), {
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
