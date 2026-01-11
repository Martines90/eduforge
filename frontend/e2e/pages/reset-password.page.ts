import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Reset Password Page
 */
export class ResetPasswordPage {
  // Loading state
  readonly loadingSpinner: Locator;
  readonly loadingText: Locator;

  // Invalid/Expired state
  readonly errorIcon: Locator;
  readonly expiredTitle: Locator;
  readonly expiredMessage: Locator;
  readonly backToLoginButton: Locator;

  // Valid token state - Form
  readonly pageTitle: Locator;
  readonly newPasswordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly resetPasswordButton: Locator;
  readonly cancelButton: Locator;

  // Success state
  readonly successIcon: Locator;
  readonly successTitle: Locator;
  readonly successMessage: Locator;
  readonly redirectMessage: Locator;

  // Error alert
  readonly errorAlert: Locator;

  constructor(private page: Page) {
    // Loading
    this.loadingSpinner = page.locator('[role="progressbar"]');
    this.loadingText = page.getByText(/validating reset link/i);

    // Invalid/Expired
    this.errorIcon = page.locator('[data-testid="ErrorOutlineIcon"]');
    this.expiredTitle = page.getByRole('heading', { name: /link expired or invalid/i });
    this.expiredMessage = page.getByText(/this password reset link has expired/i);
    this.backToLoginButton = page.getByRole('button', { name: /back to login/i });

    // Form
    this.pageTitle = page.getByRole('heading', { name: /reset your password/i });
    this.newPasswordInput = page.getByLabel(/new password/i, { exact: true });
    this.confirmPasswordInput = page.getByLabel(/confirm new password/i);
    this.resetPasswordButton = page.getByRole('button', { name: /reset password/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });

    // Success
    this.successIcon = page.locator('[data-testid="CheckCircleIcon"]');
    this.successTitle = page.getByRole('heading', { name: /password reset successful/i });
    this.successMessage = page.getByText(/your password has been reset successfully/i);
    this.redirectMessage = page.getByText(/redirecting to login/i);

    // Error
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Navigate to reset password page with token
   */
  async goto(token: string) {
    await this.page.goto(`/reset-password?token=${token}`, { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  }

  /**
   * Navigate without token (for error testing)
   */
  async gotoWithoutToken() {
    await this.page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  }

  /**
   * Fill new password fields
   */
  async fillPasswords(newPassword: string, confirmPassword?: string) {
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(confirmPassword || newPassword);
  }

  /**
   * Click reset password button
   */
  async clickResetPassword() {
    await this.resetPasswordButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Complete password reset flow
   */
  async resetPassword(newPassword: string) {
    await this.fillPasswords(newPassword);
    await this.clickResetPassword();
  }

  /**
   * Verify loading state
   */
  async verifyLoadingState() {
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.loadingText).toBeVisible();
  }

  /**
   * Verify expired/invalid token screen
   */
  async verifyExpiredScreen() {
    await expect(this.expiredTitle).toBeVisible({ timeout: 5000 });
    await expect(this.expiredMessage).toBeVisible();
  }

  /**
   * Verify form is shown (valid token)
   */
  async verifyFormVisible() {
    await expect(this.pageTitle).toBeVisible({ timeout: 5000 });
    await expect(this.newPasswordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  /**
   * Verify success screen
   */
  async verifySuccessScreen() {
    await expect(this.successTitle).toBeVisible({ timeout: 5000 });
    await expect(this.successMessage).toBeVisible();
    await expect(this.redirectMessage).toBeVisible();
  }

  /**
   * Verify error message
   */
  async verifyError(errorText: string) {
    await expect(this.errorAlert).toContainText(errorText, { timeout: 3000 });
  }

  /**
   * Wait for redirect (after successful reset)
   */
  async waitForRedirect() {
    await expect(this.page).toHaveURL('/', { timeout: 5000 });
  }
}
