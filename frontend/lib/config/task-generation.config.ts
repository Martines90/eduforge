/**
 * Task Generation Configuration
 * Centralized settings for task generation and validation
 *
 * This config is shared between:
 * - Backend prompt generation
 * - Frontend task editor validation
 */

/**
 * Story character length constraints
 * These limits apply to the task description HTML content
 */
export const TASK_CHARACTER_LENGTH = {
  min: 900,
  max: 1100,
} as const;

/**
 * Helper to get character count from HTML string
 */
export function getCharacterCount(html: string): number {
  return html.length;
}

/**
 * Helper to validate character length
 */
export function validateCharacterLength(html: string): {
  isValid: boolean;
  count: number;
  min: number;
  max: number;
  isTooShort: boolean;
  isTooLong: boolean;
} {
  const count = getCharacterCount(html);
  const isTooShort = count < TASK_CHARACTER_LENGTH.min;
  const isTooLong = count > TASK_CHARACTER_LENGTH.max;

  return {
    isValid: !isTooShort && !isTooLong,
    count,
    min: TASK_CHARACTER_LENGTH.min,
    max: TASK_CHARACTER_LENGTH.max,
    isTooShort,
    isTooLong,
  };
}
