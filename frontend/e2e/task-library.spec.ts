import { test, expect } from './fixtures/test-fixtures';
import { setupTeacher } from './fixtures/setup-helpers';

/**
 * Task Library (Browse Tasks) - Happy Path Only
 * Tests viewing published tasks
 */

test('Teacher can browse task library', async ({ page }) => {
  // Setup teacher
  await setupTeacher(page);

  // Go to tasks page
  await page.goto('/tasks');

  // Verify page loads
  await expect(page.getByRole('heading', { name: /educational tasks/i })).toBeVisible();

  // Page should show task tree (or loading state if API not mocked)
  // Happy path: User can access the tasks page
});
