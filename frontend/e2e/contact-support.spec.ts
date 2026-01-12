import { test, expect } from './fixtures/test-fixtures';
import { setupTeacher } from './fixtures/setup-helpers';

/**
 * Contact Support - Happy Path Only
 * Tests that authenticated users can access contact support page
 */

test('User can access contact support page', async ({ page }) => {
  // Setup authenticated teacher
  await setupTeacher(page);

  // Go to contact support
  await page.goto('/contact-support');

  // Verify page loaded
  await expect(page.getByRole('heading', { name: /contact support/i })).toBeVisible({ timeout: 10000 });

  // Verify form is present
  await expect(page.getByLabel(/subject/i)).toBeVisible();
  await expect(page.getByLabel(/message/i)).toBeVisible();

  // Happy path verified - user can access and see the form
});
