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
 * Only counts characters in the story section, excluding:
 * - HTML tags
 * - Image placeholders ([IMAGE_1], etc.)
 * - Questions section
 * - Title
 */
export function getCharacterCount(html: string): number {
  if (!html) return 0;

  // Extract only the story div content
  const storyMatch = html.match(/<div class="story">([\s\S]*?)<\/div>/);
  if (!storyMatch) {
    // If no story div, count all text content (strip HTML tags)
    const textOnly = html.replace(/<[^>]*>/g, '').replace(/\[IMAGE_\d+\]/g, '');
    return textOnly.trim().length;
  }

  let storyContent = storyMatch[1];

  // Remove image placeholders
  storyContent = storyContent.replace(/\[IMAGE_\d+\]/g, '');

  // Remove HTML tags to get plain text
  storyContent = storyContent.replace(/<[^>]*>/g, '');

  // Trim and count
  return storyContent.trim().length;
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
