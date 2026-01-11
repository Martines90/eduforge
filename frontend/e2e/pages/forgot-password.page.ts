import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Forgot Password Modal
 */
export class ForgotPasswordPage {
  // Modal elements
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly closeButton: Locator;

  // Form elements
  readonly emailInput: Locator;
  readonly recaptcha: Locator;
  readonly sendResetLinkButton: Locator;
  readonly cancelButton: Locator;

  // Success screen
  readonly successIcon: Locator;
  readonly successTitle: Locator;
  readonly successMessage: Locator;
  readonly closeSuccessButton: Locator;

  // Error/Alert
  readonly errorAlert: Locator;

  constructor(private page: Page) {
    this.modal = page.locator('[role="dialog"]', { hasText: /reset password/i });
    this.modalTitle = page.getByRole('heading', { name: /reset password/i });
    this.closeButton = this.modal.getByRole('button', { name: /close/i }).first();

    // Form
    this.emailInput = page.getByLabel(/email address/i);
    this.recaptcha = page.locator('.g-recaptcha, iframe[src*="recaptcha"]');
    this.sendResetLinkButton = page.getByRole('button', { name: /send reset link/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });

    // Success
    this.successIcon = page.locator('[data-testid="CheckCircleIcon"], svg').filter({ hasText: '' }).first();
    this.successTitle = page.getByRole('heading', { name: /reset link sent/i });
    this.successMessage = page.getByText(/if an account exists/i);
    this.closeSuccessButton = page.getByRole('button', { name: /close/i });

    // Error
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Open forgot password modal from login page
   */
  async openFromLogin() {
    const forgotLink = this.page.getByText(/forgot password/i);
    await forgotLink.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Fill email address
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Complete reCAPTCHA (for testing, we'll need to bypass or mock)
   */
  async completeRecaptcha() {
    // In real tests, you might need to mock the reCAPTCHA
    // or use a test key that auto-passes
    await this.page.waitForTimeout(500);
  }

  /**
   * Click send reset link button
   */
  async clickSendResetLink() {
    await this.sendResetLinkButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Complete full flow
   */
  async requestPasswordReset(email: string) {
    await this.fillEmail(email);
    await this.completeRecaptcha();
    await this.clickSendResetLink();
  }

  /**
   * Verify success screen is shown
   */
  async verifySuccessScreen() {
    await expect(this.successTitle).toBeVisible({ timeout: 5000 });
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Verify error is shown
   */
  async verifyError(errorText: string) {
    await expect(this.errorAlert).toContainText(errorText, { timeout: 3000 });
  }

  /**
   * Close the modal
   */
  async close() {
    await this.closeButton.click();
    await this.page.waitForTimeout(300);
  }
}
