import { test, expect } from './fixtures/test-fixtures';
import { ResetPasswordPage } from './pages/reset-password.page';

/**
 * E2E Tests for Reset Password Page
 * Tests password reset functionality with token validation
 */

test.describe('Reset Password Page', () => {
  let resetPasswordPage: ResetPasswordPage;

  test.beforeEach(async ({ page }) => {
    resetPasswordPage = new ResetPasswordPage(page);
  });

  test('should show error when accessing without token', async ({ page }) => {
    await resetPasswordPage.gotoWithoutToken();

    // Should show expired/invalid screen
    await resetPasswordPage.verifyExpiredScreen();
    await expect(resetPasswordPage.expiredTitle).toHaveText(/link expired or invalid/i);
  });

  test('should show loading state while validating token', async ({ page }) => {
    // Delay API response to see loading state
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await page.waitForTimeout(500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('test-token-123');

    // Loading state should appear briefly
    await expect(resetPasswordPage.loadingText).toBeVisible();
  });

  test('should show error when token is invalid', async ({ page }) => {
    // Mock API response for invalid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid token',
        }),
      });
    });

    await resetPasswordPage.goto('invalid-token');

    // Should show expired/invalid screen
    await resetPasswordPage.verifyExpiredScreen();
  });

  test('should show error when token is expired', async ({ page }) => {
    // Mock API response for expired token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Token has expired',
        }),
      });
    });

    await resetPasswordPage.goto('expired-token');

    // Should show expired screen
    await resetPasswordPage.verifyExpiredScreen();
    await expect(resetPasswordPage.expiredMessage).toContainText(/expired/i);
  });

  test('should show form when token is valid', async ({ page }) => {
    // Mock API response for valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');

    // Should show password reset form
    await resetPasswordPage.verifyFormVisible();
    await expect(resetPasswordPage.newPasswordInput).toBeVisible();
    await expect(resetPasswordPage.confirmPasswordInput).toBeVisible();
  });

  test('should show error when submitting without passwords', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Try to submit without filling passwords
    await resetPasswordPage.clickResetPassword();

    // Should show validation error
    await resetPasswordPage.verifyError('Please enter a new password');
  });

  test('should show error when password is too short', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Fill short password
    await resetPasswordPage.fillPasswords('short');
    await resetPasswordPage.clickResetPassword();

    // Should show validation error
    await resetPasswordPage.verifyError('Password must be at least 8 characters');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Fill non-matching passwords
    await resetPasswordPage.fillPasswords('ValidPassword123', 'DifferentPassword456');
    await resetPasswordPage.clickResetPassword();

    // Should show validation error
    await resetPasswordPage.verifyError('Passwords do not match');
  });

  test('should successfully reset password with valid input', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    // Mock successful password reset
    await page.route('**/api/password-reset/reset', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset successfully',
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Fill valid matching passwords
    await resetPasswordPage.resetPassword('NewValidPassword123');

    // Should show success screen
    await resetPasswordPage.verifySuccessScreen();
    await expect(resetPasswordPage.successTitle).toHaveText(/password reset successful/i);
  });

  test('should show redirect message after successful reset', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    // Mock successful password reset
    await page.route('**/api/password-reset/reset', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset successfully',
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();
    await resetPasswordPage.resetPassword('NewValidPassword123');

    // Should show redirect message
    await expect(resetPasswordPage.redirectMessage).toBeVisible();
    await expect(resetPasswordPage.redirectMessage).toContainText(/redirecting to login/i);
  });

  test('should redirect to home page after successful reset', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    // Mock successful password reset
    await page.route('**/api/password-reset/reset', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset successfully',
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();
    await resetPasswordPage.resetPassword('NewValidPassword123');

    // Wait for redirect
    await resetPasswordPage.waitForRedirect();
    await expect(page).toHaveURL('/');
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    // Mock API error
    await page.route('**/api/password-reset/reset', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Server error occurred',
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();
    await resetPasswordPage.resetPassword('NewValidPassword123');

    // Should show error message
    await resetPasswordPage.verifyError('Server error occurred');
  });

  test('should handle token expiration during password reset', async ({ page }) => {
    // Mock valid token initially
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    // Mock token expired error when resetting
    await page.route('**/api/password-reset/reset', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Token has expired',
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();
    await resetPasswordPage.resetPassword('NewValidPassword123');

    // Should show expiration error
    await resetPasswordPage.verifyError('Token has expired');
  });

  test('should allow returning to login from expired screen', async ({ page }) => {
    // Mock expired token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Token has expired',
        }),
      });
    });

    await resetPasswordPage.goto('expired-token');
    await resetPasswordPage.verifyExpiredScreen();

    // Click back to login button
    await resetPasswordPage.backToLoginButton.click();

    // Should redirect to home (which shows login modal)
    await expect(page).toHaveURL('/', { timeout: 5000 });
  });

  test('should show security message about 30-minute expiration', async ({ page }) => {
    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Should show expiration warning in form
    const expirationText = page.getByText(/30 minutes/i);
    await expect(expirationText).toBeVisible();
  });
});

test.describe('Reset Password Page - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should display correctly on mobile devices', async ({ page }) => {
    const resetPasswordPage = new ResetPasswordPage(page);

    // Mock valid token
    await page.route('**/api/password-reset/verify/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { valid: true },
        }),
      });
    });

    await resetPasswordPage.goto('valid-token-123');
    await resetPasswordPage.verifyFormVisible();

    // Form should be visible and usable on mobile
    await expect(resetPasswordPage.newPasswordInput).toBeVisible();
    await expect(resetPasswordPage.confirmPasswordInput).toBeVisible();
    await expect(resetPasswordPage.resetPasswordButton).toBeVisible();

    // Elements should be accessible (not overlapping)
    const newPasswordBox = await resetPasswordPage.newPasswordInput.boundingBox();
    const confirmPasswordBox = await resetPasswordPage.confirmPasswordInput.boundingBox();
    const buttonBox = await resetPasswordPage.resetPasswordButton.boundingBox();

    expect(newPasswordBox).not.toBeNull();
    expect(confirmPasswordBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
  });
});
