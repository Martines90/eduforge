/**
 * Credit and subscription constants
 * Single source of truth for credit values across the application
 */

/**
 * Initial credits given to new teacher registrations (trial plan)
 */
export const TRIAL_START_CREDITS = 100;

/**
 * Number of free task generations for guest users
 */
export const GUEST_GENERATION_LIMIT = 3;

/**
 * Number of free task views for guest users
 */
export const GUEST_VIEW_LIMIT = 3;

/**
 * localStorage key for guest task view tracking
 */
export const GUEST_TASK_VIEW_KEY = 'eduforger_guest_task_views';

/**
 * Credits granted per subscription tier (monthly)
 */
export const SUBSCRIPTION_CREDITS = {
  trial: TRIAL_START_CREDITS,
  basic: 0, // Basic plan is for browsing only
  normal: 1000,
  pro: 10000,
} as const;
