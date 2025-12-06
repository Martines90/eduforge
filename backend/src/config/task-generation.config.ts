/**
 * Task Generation Configuration
 * Centralized settings for AI-powered task generation
 */

/**
 * Story character length constraints
 */
export const TASK_CHARACTER_LENGTH = {
  min: 900,
  max: 1100,
} as const;

/**
 * Other task generation settings can be added here
 */
export const TASK_GENERATION_CONFIG = {
  characterLength: TASK_CHARACTER_LENGTH,

  // Future settings can be added here:
  // maxQuestions: 3,
  // minQuestions: 1,
  // defaultLanguage: 'Hungarian',
  // etc.
} as const;
