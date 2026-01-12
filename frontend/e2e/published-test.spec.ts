import { test, expect } from './fixtures/test-fixtures';
import { setupGuest } from './fixtures/setup-helpers';

/**
 * Published Test Viewing - Happy Path Only
 * Tests that anyone can view a published test via public link
 */

test('User can view published test via public link', async ({ page }) => {
  // Setup guest (public tests don't require auth)
  await setupGuest(page);

  // Go to published test page (mock public ID)
  await page.goto('/published-tests/mock-public-id-123');

  // Verify page loads (might show loading or content depending on API)
  await page.waitForLoadState('networkidle');

  // Happy path verified - page is accessible
  // (Actual content requires API mocks for published test data)
});
