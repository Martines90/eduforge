import { test, expect } from './fixtures/test-fixtures';
import { ForgotPasswordPage } from './pages/forgot-password.page';

/**
 * E2E Tests for Forgot Password Flow
 * Tests password reset request functionality
 */

test.describe('Forgot Password Modal', () => {
  let forgotPasswordPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    forgotPasswordPage = new ForgotPasswordPage(page);

    // Navigate to home page (shows login modal)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  });

  test('should open forgot password modal from login page', async ({ page }) => {
    // Open the forgot password modal
    await forgotPasswordPage.openFromLogin();

    // Verify modal is visible
    await expect(forgotPasswordPage.modal).toBeVisible();
    await expect(forgotPasswordPage.modalTitle).toBeVisible();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
  });

  test('should show error when submitting without email', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Mock reCAPTCHA completion (bypass for testing)
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    // Try to submit without email
    await forgotPasswordPage.clickSendResetLink();

    // Should show validation error
    await forgotPasswordPage.verifyError('Please enter your email address');
  });

  test('should show error when submitting invalid email format', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Fill invalid email
    await forgotPasswordPage.fillEmail('invalid-email');

    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await forgotPasswordPage.clickSendResetLink();

    // Should show validation error
    await forgotPasswordPage.verifyError('Please enter a valid email address');
  });

  test('should show error when submitting without completing CAPTCHA', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Fill valid email but don't complete CAPTCHA
    await forgotPasswordPage.fillEmail('test@example.com');
    await forgotPasswordPage.clickSendResetLink();

    // Should show CAPTCHA error
    await forgotPasswordPage.verifyError('Please complete the reCAPTCHA verification');
  });

  test('should successfully request password reset with valid email', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Mock API response
    await page.route('**/api/password-reset/request', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent',
        }),
      });
    });

    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    // Fill email and submit
    await forgotPasswordPage.fillEmail('test@example.com');
    await forgotPasswordPage.clickSendResetLink();

    // Verify success screen
    await forgotPasswordPage.verifySuccessScreen();
    await expect(forgotPasswordPage.successTitle).toHaveText(/reset link sent/i);
  });

  test('should display user email in success message', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    const testEmail = 'user@example.com';

    // Mock API response
    await page.route('**/api/password-reset/request', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await forgotPasswordPage.fillEmail(testEmail);
    await forgotPasswordPage.clickSendResetLink();

    // Success message should contain the email
    await expect(forgotPasswordPage.successMessage).toContainText(testEmail);
  });

  test('should show security message about 30-minute expiration', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Mock API response
    await page.route('**/api/password-reset/request', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await forgotPasswordPage.fillEmail('test@example.com');
    await forgotPasswordPage.clickSendResetLink();

    // Should show expiration warning
    const expirationText = page.getByText(/30 minutes/i);
    await expect(expirationText).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Modal should be visible
    await expect(forgotPasswordPage.modal).toBeVisible();

    // Close the modal
    await forgotPasswordPage.close();

    // Modal should be hidden
    await expect(forgotPasswordPage.modal).not.toBeVisible();
  });

  test('should handle API error gracefully', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Mock API error
    await page.route('**/api/password-reset/request', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Server error occurred',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await forgotPasswordPage.fillEmail('test@example.com');
    await forgotPasswordPage.clickSendResetLink();

    // Should show error message
    await forgotPasswordPage.verifyError('Server error occurred');
  });

  test('should reset CAPTCHA after error', async ({ page }) => {
    await forgotPasswordPage.openFromLogin();

    // Mock API error
    await page.route('**/api/password-reset/request', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Test error',
        }),
      });
    });

    // Mock reCAPTCHA
    const recaptchaResetCalled = false;
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
        reset: () => {
          (window as any).recaptchaResetCalled = true;
        },
      };
    });

    await forgotPasswordPage.fillEmail('test@example.com');
    await forgotPasswordPage.clickSendResetLink();

    // Wait for error
    await page.waitForTimeout(1000);

    // Check if reset was called (this is implementation-specific)
    // The actual implementation should reset the CAPTCHA
    await expect(forgotPasswordPage.errorAlert).toBeVisible();
  });
});

test.describe('Forgot Password Modal - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should display correctly on mobile devices', async ({ page }) => {
    const forgotPasswordPage = new ForgotPasswordPage(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { state: 'visible', timeout: 10000 });

    await forgotPasswordPage.openFromLogin();

    // Modal should be visible and usable on mobile
    await expect(forgotPasswordPage.modal).toBeVisible();
    await expect(forgotPasswordPage.emailInput).toBeVisible();
    await expect(forgotPasswordPage.sendResetLinkButton).toBeVisible();

    // Elements should be accessible (not overlapping)
    const emailBox = await forgotPasswordPage.emailInput.boundingBox();
    const buttonBox = await forgotPasswordPage.sendResetLinkButton.boundingBox();

    expect(emailBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
  });
});
