/**
 * Task Generation Configuration
 * Centralized settings for task generation and validation
 *
 * This config is shared between:
 * - Backend prompt generation
 * - Backend task save endpoint validation
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
 * Story character length constraints for EDITING mode
 * More lenient limits to allow teachers to expand tasks when editing
 */
export const TASK_EDIT_CHARACTER_LENGTH = {
  min: 600,    // Minimum 600 characters when editing
  max: 1500,   // Allow up to 1500 characters when editing
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
 * @param html - HTML content to validate
 * @param isEditMode - Whether to use lenient edit mode limits (default: false)
 */
export function validateCharacterLength(html: string, isEditMode = false): {
  isValid: boolean;
  count: number;
  min: number;
  max: number;
  isTooShort: boolean;
  isTooLong: boolean;
} {
  const count = getCharacterCount(html);
  const limits = isEditMode ? TASK_EDIT_CHARACTER_LENGTH : TASK_CHARACTER_LENGTH;
  const isTooShort = count < limits.min;
  const isTooLong = count > limits.max;

  return {
    isValid: !isTooShort && !isTooLong,
    count,
    min: limits.min,
    max: limits.max,
    isTooShort,
    isTooLong,
  };
}

/**
 * Task generation configuration object
 * Can be extended with additional settings in the future
 */
export const TASK_GENERATION_CONFIG = {
  characterLength: TASK_CHARACTER_LENGTH,
  editCharacterLength: TASK_EDIT_CHARACTER_LENGTH,

  // Future settings can be added here:
  // maxQuestions: 3,
  // minQuestions: 1,
  // defaultLanguage: 'Hungarian',
  // etc.
} as const;
