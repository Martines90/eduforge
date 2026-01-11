import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Contact Support Page
 */
export class ContactSupportPage {
  // Page elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;

  // User info display
  readonly userEmail: Locator;
  readonly userName: Locator;

  // Form elements
  readonly subjectSelect: Locator;
  readonly messageTextarea: Locator;
  readonly characterCounter: Locator;
  readonly recaptcha: Locator;
  readonly sendMessageButton: Locator;
  readonly cancelButton: Locator;

  // Success screen
  readonly successIcon: Locator;
  readonly successTitle: Locator;
  readonly successMessage: Locator;
  readonly confirmationEmailText: Locator;
  readonly sendAnotherButton: Locator;
  readonly backToDashboardButton: Locator;

  // Error alert
  readonly errorAlert: Locator;

  constructor(private page: Page) {
    this.pageTitle = page.getByRole('heading', { name: /contact support/i });
    this.pageDescription = page.getByText(/need help.*send us a message/i);

    // User info
    this.userEmail = page.getByText(/your email:/i);
    this.userName = page.getByText(/your name:/i);

    // Form
    this.subjectSelect = page.getByLabel(/subject/i);
    this.messageTextarea = page.getByLabel(/message/i);
    this.characterCounter = page.getByText(/characters/i);
    this.recaptcha = page.locator('.g-recaptcha, iframe[src*="recaptcha"]');
    this.sendMessageButton = page.getByRole('button', { name: /send message/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });

    // Success
    this.successIcon = page.locator('[data-testid="CheckCircleIcon"]');
    this.successTitle = page.getByRole('heading', { name: /message sent successfully/i });
    this.successMessage = page.getByText(/we'll get back to you within 48 hours/i);
    this.confirmationEmailText = page.getByText(/you'll receive a confirmation email/i);
    this.sendAnotherButton = page.getByRole('button', { name: /send another message/i });
    this.backToDashboardButton = page.getByRole('button', { name: /back to dashboard/i });

    // Error
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Navigate to contact support page
   */
  async goto() {
    await this.page.goto('/contact-support', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('body', { state: 'visible', timeout: 10000 });
  }

  /**
   * Select subject from dropdown
   */
  async selectSubject(subject: string) {
    await this.subjectSelect.click();
    await this.page.getByRole('option', { name: new RegExp(subject, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Fill message
   */
  async fillMessage(message: string) {
    await this.messageTextarea.fill(message);
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
   * Click send message button
   */
  async clickSendMessage() {
    await this.sendMessageButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Complete full contact form flow
   */
  async submitContactForm(subject: string, message: string) {
    await this.selectSubject(subject);
    await this.fillMessage(message);
    await this.completeRecaptcha();
    await this.clickSendMessage();
  }

  /**
   * Verify user info is displayed
   */
  async verifyUserInfo(email: string, name: string) {
    await expect(this.userEmail).toContainText(email);
    await expect(this.userName).toContainText(name);
  }

  /**
   * Verify character counter updates
   */
  async verifyCharacterCounter(expectedCount: string) {
    await expect(this.characterCounter).toContainText(expectedCount);
  }

  /**
   * Verify success screen
   */
  async verifySuccessScreen() {
    await expect(this.successTitle).toBeVisible({ timeout: 5000 });
    await expect(this.successMessage).toBeVisible();
    await expect(this.confirmationEmailText).toBeVisible();
  }

  /**
   * Verify error message
   */
  async verifyError(errorText: string) {
    await expect(this.errorAlert).toContainText(errorText, { timeout: 3000 });
  }

  /**
   * Click "Send Another Message"
   */
  async clickSendAnother() {
    await this.sendAnotherButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click "Back to Dashboard"
   */
  async clickBackToDashboard() {
    await this.backToDashboardButton.click();
    await this.page.waitForURL('/', { timeout: 5000 });
  }

  /**
   * Verify page redirects to home if not authenticated
   */
  async verifyRedirectsToHome() {
    await expect(this.page).toHaveURL('/', { timeout: 5000 });
  }
}
