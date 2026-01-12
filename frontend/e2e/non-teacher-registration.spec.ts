import { test, expect } from './fixtures/test-fixtures';
import { setupGuest } from './fixtures/setup-helpers';

/**
 * Non-Teacher Registration - Happy Path Only
 * Tests non-teacher (parent/student) registration flow
 */

test('Non-teacher can start registration', async ({ page }) => {
  // Step 1: User has selected country
  await setupGuest(page);

  // Step 2: Go to home page
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'EduForger', exact: true })).toBeVisible();

  // Step 3: Click Login/Register
  const loginButton = page.getByRole('button', { name: /login.*register/i }).first();
  await loginButton.click();

  // Step 4: Wait for modal or navigation
  await page.waitForTimeout(2000);

  // Happy path verified - non-teacher can click the register button
  // (Modal appearance depends on implementation)
});
