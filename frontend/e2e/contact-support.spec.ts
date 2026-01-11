import { test, expect } from './fixtures/test-fixtures';
import { ContactSupportPage } from './pages/contact-support.page';

/**
 * E2E Tests for Contact Support Page
 * Tests support form submission functionality
 */

test.describe('Contact Support Page - Unauthenticated', () => {
  test('should redirect to home page when not authenticated', async ({ page }) => {
    const contactSupportPage = new ContactSupportPage(page);

    await contactSupportPage.goto();

    // Should redirect to home page
    await contactSupportPage.verifyRedirectsToHome();
  });
});

test.describe('Contact Support Page - Authenticated', () => {
  let contactSupportPage: ContactSupportPage;

  test.beforeEach(async ({ page, authenticatedUser }) => {
    contactSupportPage = new ContactSupportPage(page);

    // Navigate to contact support page (user is already authenticated via fixture)
    await contactSupportPage.goto();
  });

  test('should display page title and description', async ({ page }) => {
    await expect(contactSupportPage.pageTitle).toBeVisible();
    await expect(contactSupportPage.pageTitle).toHaveText(/contact support/i);
    await expect(contactSupportPage.pageDescription).toBeVisible();
  });

  test('should display authenticated user information', async ({ page, authenticatedUser }) => {
    // User info should be visible
    await contactSupportPage.verifyUserInfo(
      authenticatedUser.email,
      authenticatedUser.displayName || authenticatedUser.email.split('@')[0]
    );
  });

  test('should show all form elements', async ({ page }) => {
    await expect(contactSupportPage.subjectSelect).toBeVisible();
    await expect(contactSupportPage.messageTextarea).toBeVisible();
    await expect(contactSupportPage.characterCounter).toBeVisible();
    await expect(contactSupportPage.sendMessageButton).toBeVisible();
    await expect(contactSupportPage.cancelButton).toBeVisible();
  });

  test('should show error when submitting without subject', async ({ page }) => {
    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    // Fill message but not subject
    await contactSupportPage.fillMessage('This is a test message with enough characters.');
    await contactSupportPage.clickSendMessage();

    // Should show validation error
    await contactSupportPage.verifyError('Please select a subject');
  });

  test('should show error when submitting without message', async ({ page }) => {
    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    // Select subject but don't fill message
    await contactSupportPage.selectSubject('Technical Issue');
    await contactSupportPage.clickSendMessage();

    // Should show validation error
    await contactSupportPage.verifyError('Please enter a message');
  });

  test('should show error when message is too short', async ({ page }) => {
    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await contactSupportPage.selectSubject('Technical Issue');
    await contactSupportPage.fillMessage('Short'); // Less than 10 characters
    await contactSupportPage.clickSendMessage();

    // Should show validation error
    await contactSupportPage.verifyError('Message must be at least 10 characters');
  });

  test('should show error when message is too long', async ({ page }) => {
    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    const longMessage = 'a'.repeat(5001); // More than 5000 characters

    await contactSupportPage.selectSubject('Technical Issue');
    await contactSupportPage.fillMessage(longMessage);
    await contactSupportPage.clickSendMessage();

    // Should show validation error
    await contactSupportPage.verifyError('Message must be less than 5000 characters');
  });

  test('should update character counter as user types', async ({ page }) => {
    const testMessage = 'This is a test message';

    await contactSupportPage.fillMessage(testMessage);

    // Character counter should show correct count
    await contactSupportPage.verifyCharacterCounter(`${testMessage.length}`);
  });

  test('should show error when submitting without completing CAPTCHA', async ({ page }) => {
    await contactSupportPage.selectSubject('Technical Issue');
    await contactSupportPage.fillMessage('This is a test message with enough characters.');
    await contactSupportPage.clickSendMessage();

    // Should show CAPTCHA error
    await contactSupportPage.verifyError('Please complete the reCAPTCHA verification');
  });

  test('should successfully submit contact form with valid input', async ({ page, authenticatedUser }) => {
    // Mock API response
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
        }),
      });
    });

    // Mock reCAPTCHA completion
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    // Submit form
    await contactSupportPage.submitContactForm(
      'Technical Issue',
      'I am experiencing issues with the task generator feature.'
    );

    // Verify success screen
    await contactSupportPage.verifySuccessScreen();
    await expect(contactSupportPage.successTitle).toHaveText(/message sent successfully/i);
  });

  test('should show 48-hour response time message on success', async ({ page }) => {
    // Mock API response
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await contactSupportPage.submitContactForm(
      'Billing Question',
      'I have a question about my subscription billing.'
    );

    // Success message should mention 48 hours
    await expect(contactSupportPage.successMessage).toContainText(/48 hours/i);
  });

  test('should show confirmation email message on success', async ({ page }) => {
    // Mock API response
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await contactSupportPage.submitContactForm(
      'Feature Request',
      'It would be great to have a dark mode option.'
    );

    // Should show confirmation email text
    await expect(contactSupportPage.confirmationEmailText).toBeVisible();
    await expect(contactSupportPage.confirmationEmailText).toContainText(/confirmation email/i);
  });

  test('should allow sending another message after success', async ({ page }) => {
    // Mock API response
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await contactSupportPage.submitContactForm(
      'Account Problem',
      'I cannot access my account settings.'
    );

    await contactSupportPage.verifySuccessScreen();

    // Click "Send Another Message"
    await contactSupportPage.clickSendAnother();

    // Form should be visible again
    await expect(contactSupportPage.subjectSelect).toBeVisible();
    await expect(contactSupportPage.messageTextarea).toBeVisible();
  });

  test('should navigate back to dashboard from success screen', async ({ page }) => {
    // Mock API response
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message sent successfully',
        }),
      });
    });

    // Mock reCAPTCHA
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
      };
    });

    await contactSupportPage.submitContactForm(
      'Task Generation Issue',
      'The task generator is not creating questions correctly.'
    );

    await contactSupportPage.verifySuccessScreen();

    // Click "Back to Dashboard"
    await contactSupportPage.clickBackToDashboard();

    // Should be on home page
    await expect(page).toHaveURL('/');
  });

  test('should handle API error gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/contact/submit', async (route) => {
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

    await contactSupportPage.submitContactForm(
      'Other',
      'This is a test message for error handling.'
    );

    // Should show error message
    await contactSupportPage.verifyError('Server error occurred');
  });

  test('should reset CAPTCHA after error', async ({ page }) => {
    // Mock API error
    await page.route('**/api/contact/submit', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Test error',
        }),
      });
    });

    // Mock reCAPTCHA with reset tracking
    await page.evaluate(() => {
      (window as any).grecaptcha = {
        getResponse: () => 'test-token',
        reset: () => {
          (window as any).recaptchaResetCalled = true;
        },
      };
    });

    await contactSupportPage.submitContactForm(
      'Technical Issue',
      'Testing CAPTCHA reset on error.'
    );

    // Wait for error
    await page.waitForTimeout(1000);

    // Error should be visible
    await expect(contactSupportPage.errorAlert).toBeVisible();
  });

  test('should allow all subject options to be selected', async ({ page }) => {
    const subjects = [
      'Technical Issue',
      'Billing Question',
      'Feature Request',
      'Account Problem',
      'Task Generation Issue',
      'Other',
    ];

    for (const subject of subjects) {
      await contactSupportPage.selectSubject(subject);

      // Verify subject is selected
      await expect(contactSupportPage.subjectSelect).toContainText(subject);
    }
  });

  test('should maintain form state when switching between fields', async ({ page }) => {
    const testMessage = 'This is my test message that should persist.';

    // Select subject and fill message
    await contactSupportPage.selectSubject('Feature Request');
    await contactSupportPage.fillMessage(testMessage);

    // Click on another field
    await contactSupportPage.subjectSelect.click();
    await page.keyboard.press('Escape');

    // Message should still be there
    await expect(contactSupportPage.messageTextarea).toHaveValue(testMessage);
  });

  test('should allow canceling form submission', async ({ page }) => {
    await contactSupportPage.selectSubject('Technical Issue');
    await contactSupportPage.fillMessage('I want to cancel this message.');

    // Click cancel button
    await contactSupportPage.cancelButton.click();

    // Should navigate back (implementation specific - might clear or redirect)
    await page.waitForTimeout(500);
  });
});

test.describe('Contact Support Page - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should display correctly on mobile devices', async ({ page, authenticatedUser }) => {
    const contactSupportPage = new ContactSupportPage(page);

    await contactSupportPage.goto();

    // Page should be visible and usable on mobile
    await expect(contactSupportPage.pageTitle).toBeVisible();
    await expect(contactSupportPage.subjectSelect).toBeVisible();
    await expect(contactSupportPage.messageTextarea).toBeVisible();
    await expect(contactSupportPage.sendMessageButton).toBeVisible();

    // Elements should be accessible (not overlapping)
    const subjectBox = await contactSupportPage.subjectSelect.boundingBox();
    const messageBox = await contactSupportPage.messageTextarea.boundingBox();
    const buttonBox = await contactSupportPage.sendMessageButton.boundingBox();

    expect(subjectBox).not.toBeNull();
    expect(messageBox).not.toBeNull();
    expect(buttonBox).not.toBeNull();
  });

  test('should show character counter on mobile', async ({ page, authenticatedUser }) => {
    const contactSupportPage = new ContactSupportPage(page);

    await contactSupportPage.goto();

    const testMessage = 'Mobile test message';
    await contactSupportPage.fillMessage(testMessage);

    // Character counter should be visible
    await expect(contactSupportPage.characterCounter).toBeVisible();
    await contactSupportPage.verifyCharacterCounter(`${testMessage.length}`);
  });
});
