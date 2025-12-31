/**
 * Credit constants for task generation and subscriptions
 * Single source of truth for all credit-related values
 */

export const TRIAL_START_CREDITS = 100;
export const GUEST_GENERATION_LIMIT = 3;

export const SUBSCRIPTION_CREDITS = {
  trial: TRIAL_START_CREDITS,
  basic: 0,
  normal: 1000,
  pro: 10000,
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_CREDITS;
