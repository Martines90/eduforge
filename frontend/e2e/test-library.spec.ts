import { test, expect } from './fixtures/test-fixtures';
import { setupTeacher } from './fixtures/setup-helpers';

/**
 * Test Library (My Tests) - Happy Path Only
 * Tests that teachers can access their test library
 */

test('Teacher can access test library page', async ({ page }) => {
  // Setup teacher
  await setupTeacher(page);

  // Navigate to test library
  await page.goto('/my-tests');

  // Verify page loads
  await expect(
    page.getByRole('heading', { name: /my tests|test library/i }).or(
      page.getByText(/my tests|test library/i).first()
    )
  ).toBeVisible({ timeout: 10000 });

  // Happy path verified - teacher can access test library
});
