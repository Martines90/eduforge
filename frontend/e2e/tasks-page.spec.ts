import { test, expect } from './fixtures/test-fixtures';
import { setupTeacher } from './fixtures/setup-helpers';

/**
 * Tasks Page - Happy Path Only
 * Tests that teachers can browse tasks
 */

test('Teacher can browse tasks page', async ({ page }) => {
  // Setup teacher
  await setupTeacher(page);

  // Navigate to tasks page
  await page.goto('/tasks');

  // Verify page loads
  await expect(page.getByRole('heading', { name: /educational tasks|tasks/i })).toBeVisible({ timeout: 10000 });

  // Happy path verified - teacher can access tasks page
});
