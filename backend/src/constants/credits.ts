/**
 * Credit constants for task generation and subscriptions
 * Single source of truth for all credit-related values
 */

export const TRIAL_START_CREDITS = 100;
export const GUEST_GENERATION_LIMIT = 3;
export const GUEST_TASK_VIEW_LIMIT = 3;

/**
 * Task generation credits per subscription tier
 */
export const TASK_GENERATION_CREDITS = {
  trial: TRIAL_START_CREDITS,
  basic: 0,
  normal: 1000,
  pro: 10000,
} as const;

// Legacy export for backward compatibility
export const SUBSCRIPTION_CREDITS = TASK_GENERATION_CREDITS;

export type SubscriptionTier = keyof typeof TASK_GENERATION_CREDITS;
