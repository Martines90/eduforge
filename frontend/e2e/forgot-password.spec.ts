import { test, expect } from './fixtures/test-fixtures';
import { setupGuest } from './fixtures/setup-helpers';

/**
 * Forgot Password - Happy Path Only
 * Tests that users can access the password reset page
 */

test('User can access password reset page', async ({ page }) => {
  // Setup guest (country selected)
  await setupGuest(page);

  // Go to reset password page
  await page.goto('/reset-password');

  // Verify page loaded with title or form
  await expect(
    page.getByRole('heading', { name: /reset.*password|forgot.*password/i }).or(
      page.getByText(/reset.*password|forgot.*password/i)
    )
  ).toBeVisible({ timeout: 10000 });

  // Happy path verified - page is accessible
});
