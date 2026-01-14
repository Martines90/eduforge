/**
 * Unit tests for task generation configuration and validation
 */

import {
  TASK_CHARACTER_LENGTH,
  TASK_EDIT_CHARACTER_LENGTH,
  getCharacterCount,
  validateCharacterLength,
} from '../task-generation.config';

describe('Task Generation Config - Constants', () => {
  it('should have correct generation character limits', () => {
    expect(TASK_CHARACTER_LENGTH.min).toBe(900);
    expect(TASK_CHARACTER_LENGTH.max).toBe(1100);
  });

  it('should have correct edit mode character limits', () => {
    expect(TASK_EDIT_CHARACTER_LENGTH.min).toBe(600);
    expect(TASK_EDIT_CHARACTER_LENGTH.max).toBe(1500);
  });

  it('should have more lenient limits in edit mode', () => {
    expect(TASK_EDIT_CHARACTER_LENGTH.min).toBeLessThan(TASK_CHARACTER_LENGTH.min);
    expect(TASK_EDIT_CHARACTER_LENGTH.max).toBeGreaterThan(TASK_CHARACTER_LENGTH.max);
  });
});

describe('getCharacterCount', () => {
  it('should return 0 for empty string', () => {
    expect(getCharacterCount('')).toBe(0);
  });

  it('should count plain text correctly', () => {
    const text = 'This is a simple test';
    expect(getCharacterCount(text)).toBe(21);
  });

  it('should exclude HTML tags from count', () => {
    const html = '<p>This is <strong>bold</strong> text</p>';
    const expected = 'This is bold text'.length;
    expect(getCharacterCount(html)).toBe(expected);
  });

  it('should exclude image placeholders from count', () => {
    const html = '<p>This is a story [IMAGE_1] with an image</p>';
    const expected = 'This is a story  with an image'.length;
    expect(getCharacterCount(html)).toBe(expected);
  });

  it('should count only story div content when present', () => {
    const html = `
      <h1>Task Title</h1>
      <div class="story">This is the story content</div>
      <div class="questions">Question 1</div>
    `;
    const expected = 'This is the story content'.length;
    expect(getCharacterCount(html)).toBe(expected);
  });

  it('should handle story div with HTML tags and image placeholders', () => {
    const html = `
      <div class="story">
        <p>Once upon a time [IMAGE_1] there was a <strong>castle</strong>.</p>
      </div>
    `;
    const expected = 'Once upon a time  there was a castle.'.length;
    expect(getCharacterCount(html)).toBe(expected);
  });

  it('should handle multiple image placeholders', () => {
    const html = '<p>Image 1: [IMAGE_1] Image 2: [IMAGE_2] Image 3: [IMAGE_3]</p>';
    const expected = 'Image 1:  Image 2:  Image 3: '.length;
    expect(getCharacterCount(html)).toBe(expected);
  });

  it('should trim whitespace before counting', () => {
    const html = '<p>  Content with spaces  </p>';
    const expected = 'Content with spaces'.length;
    expect(getCharacterCount(html)).toBe(expected);
  });
});

describe('validateCharacterLength - Generation Mode', () => {
  it('should validate content within generation limits as valid', () => {
    const validHtml = '<p>' + 'a'.repeat(1000) + '</p>'; // 1000 chars
    const result = validateCharacterLength(validHtml, false);

    expect(result.isValid).toBe(true);
    expect(result.count).toBe(1000);
    expect(result.min).toBe(900);
    expect(result.max).toBe(1100);
    expect(result.isTooShort).toBe(false);
    expect(result.isTooLong).toBe(false);
  });

  it('should invalidate content that is too short', () => {
    const shortHtml = '<p>' + 'a'.repeat(500) + '</p>'; // 500 chars
    const result = validateCharacterLength(shortHtml, false);

    expect(result.isValid).toBe(false);
    expect(result.count).toBe(500);
    expect(result.isTooShort).toBe(true);
    expect(result.isTooLong).toBe(false);
  });

  it('should invalidate content that is too long', () => {
    const longHtml = '<p>' + 'a'.repeat(1200) + '</p>'; // 1200 chars
    const result = validateCharacterLength(longHtml, false);

    expect(result.isValid).toBe(false);
    expect(result.count).toBe(1200);
    expect(result.isTooShort).toBe(false);
    expect(result.isTooLong).toBe(true);
  });

  it('should validate at exact min boundary', () => {
    const minHtml = '<p>' + 'a'.repeat(900) + '</p>';
    const result = validateCharacterLength(minHtml, false);

    expect(result.isValid).toBe(true);
    expect(result.count).toBe(900);
  });

  it('should validate at exact max boundary', () => {
    const maxHtml = '<p>' + 'a'.repeat(1100) + '</p>';
    const result = validateCharacterLength(maxHtml, false);

    expect(result.isValid).toBe(true);
    expect(result.count).toBe(1100);
  });
});

describe('validateCharacterLength - Edit Mode', () => {
  it('should validate content within edit limits as valid', () => {
    const validHtml = '<p>' + 'a'.repeat(1000) + '</p>'; // 1000 chars
    const result = validateCharacterLength(validHtml, true);

    expect(result.isValid).toBe(true);
    expect(result.count).toBe(1000);
    expect(result.min).toBe(600);
    expect(result.max).toBe(1500);
  });

  it('should allow shorter content in edit mode', () => {
    const shortHtml = '<p>' + 'a'.repeat(700) + '</p>'; // 700 chars (invalid in generation, valid in edit)
    const resultGeneration = validateCharacterLength(shortHtml, false);
    const resultEdit = validateCharacterLength(shortHtml, true);

    expect(resultGeneration.isValid).toBe(false);
    expect(resultEdit.isValid).toBe(true);
  });

  it('should allow longer content in edit mode', () => {
    const longHtml = '<p>' + 'a'.repeat(1300) + '</p>'; // 1300 chars (invalid in generation, valid in edit)
    const resultGeneration = validateCharacterLength(longHtml, false);
    const resultEdit = validateCharacterLength(longHtml, true);

    expect(resultGeneration.isValid).toBe(false);
    expect(resultEdit.isValid).toBe(true);
  });

  it('should invalidate content below edit mode minimum', () => {
    const tooShortHtml = '<p>' + 'a'.repeat(500) + '</p>'; // 500 chars
    const result = validateCharacterLength(tooShortHtml, true);

    expect(result.isValid).toBe(false);
    expect(result.isTooShort).toBe(true);
  });

  it('should invalidate content above edit mode maximum', () => {
    const tooLongHtml = '<p>' + 'a'.repeat(1600) + '</p>'; // 1600 chars
    const result = validateCharacterLength(tooLongHtml, true);

    expect(result.isValid).toBe(false);
    expect(result.isTooLong).toBe(true);
  });
});

describe('validateCharacterLength - Edge Cases', () => {
  it('should handle empty string', () => {
    const result = validateCharacterLength('', false);

    expect(result.isValid).toBe(false);
    expect(result.count).toBe(0);
    expect(result.isTooShort).toBe(true);
  });

  it('should handle HTML with only whitespace', () => {
    const html = '<p>   </p>';
    const result = validateCharacterLength(html, false);

    expect(result.isValid).toBe(false);
    expect(result.count).toBe(0);
    expect(result.isTooShort).toBe(true);
  });

  it('should handle complex HTML structure', () => {
    const html = `
      <div class="story">
        <h2>Title</h2>
        <p>First paragraph [IMAGE_1] with <strong>bold</strong> text.</p>
        <p>Second paragraph with <em>italic</em> text.</p>
        <ul>
          <li>List item 1</li>
          <li>List item 2</li>
        </ul>
      </div>
    `;
    const result = validateCharacterLength(html, false);

    expect(result.count).toBeGreaterThan(0);
    // Should exclude the image placeholder and HTML tags
    expect(result.count).toBeLessThan(html.length);
  });
});
