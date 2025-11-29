import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Registration Flow
 * Handles teacher and non-teacher registration
 */
export class RegistrationPage {
  // Login Modal
  readonly createAccountTeacherButton: Locator;
  readonly createAccountNonTeacherButton: Locator;

  // Step 1: Country & Subject Selection
  readonly countrySelect: Locator;
  readonly subjectSelect: Locator;
  readonly educationalModelSelect: Locator;
  readonly nextButton: Locator;

  // Step 2: Personal Info
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly createAccountButton: Locator;

  // Step 3: Verification
  readonly verificationCodeInputs: Locator;
  readonly verifyButton: Locator;

  // Common elements
  readonly backButton: Locator;
  readonly successToast: Locator;
  readonly errorAlert: Locator;

  // Action Selection Modal (for teachers)
  readonly createTaskCard: Locator;
  readonly searchTasksCard: Locator;
  readonly continueButton: Locator;

  constructor(private page: Page) {
    // Login Modal
    this.createAccountTeacherButton = page.getByRole('button', { name: /create teacher account/i });
    this.createAccountNonTeacherButton = page.getByRole('button', { name: /^create account$/i });

    // Step 1 - Using test IDs for MUI Select components
    this.countrySelect = page.getByTestId('country-select');
    this.subjectSelect = page.getByTestId('subject-select');
    this.educationalModelSelect = page.getByTestId('educational-model-select');
    this.nextButton = page.getByRole('button', { name: /next/i });

    // Step 2
    this.nameInput = page.getByLabel(/full name/i);
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel(/confirm password/i);
    this.createAccountButton = page.getByRole('button', { name: /create account/i });

    // Step 3
    this.verificationCodeInputs = page.locator('input[id^="code-input-"]');
    this.verifyButton = page.getByRole('button', { name: /verify.*create account/i });

    // Common
    this.backButton = page.getByRole('button', { name: /back/i }).first();
    this.successToast = page.locator('[role="alert"]', { hasText: /registration successful/i });
    this.errorAlert = page.locator('[role="alert"]', { hasText: /error|failed/i });

    // Action Selection
    this.createTaskCard = page.locator('text=Create a new').locator('..');
    this.searchTasksCard = page.locator('text=Search for existing').locator('..');
    this.continueButton = page.getByRole('button', { name: /continue/i });
  }

  /**
   * Navigate to homepage (which shows login/registration modal)
   */
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click "Create Account" as teacher
   */
  async clickCreateTeacherAccount() {
    await this.createAccountTeacherButton.click();
    await this.page.waitForTimeout(500); // Wait for modal animation
  }

  /**
   * Click "Create Account" as non-teacher
   */
  async clickCreateNonTeacherAccount() {
    await this.createAccountNonTeacherButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Step 1: Select country
   */
  async selectCountry(country: 'US' | 'HU') {
    await this.countrySelect.click();
    await this.page.getByRole('option', { name: country === 'US' ? 'United States' : 'Hungary' }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Step 1: Select subject (for teachers)
   */
  async selectSubject(subject: string) {
    await this.subjectSelect.click();
    await this.page.getByRole('option', { name: new RegExp(subject, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Step 1: Select educational model (for teachers)
   */
  async selectEducationalModel(model: string) {
    await this.educationalModelSelect.click();
    await this.page.getByRole('option', { name: new RegExp(model, 'i') }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Step 1: Click Next button
   */
  async clickNext() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Step 2: Fill personal information
   */
  async fillPersonalInfo(data: {
    name: string;
    email: string;
    password: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.password);
  }

  /**
   * Step 2: Submit personal info (sends verification code)
   */
  async submitPersonalInfo() {
    await this.createAccountButton.click();
    await this.page.waitForTimeout(1000); // Wait for API call
  }

  /**
   * Step 3: Enter verification code
   */
  async enterVerificationCode(code: string) {
    const digits = code.split('');
    const inputs = await this.verificationCodeInputs.all();

    for (let i = 0; i < Math.min(digits.length, inputs.length); i++) {
      await inputs[i].fill(digits[i]);
      await this.page.waitForTimeout(100);
    }
  }

  /**
   * Step 3: Click verify button
   */
  async clickVerify() {
    await this.verifyButton.click();
    await this.page.waitForTimeout(2000); // Wait for verification and success toast
  }

  /**
   * Action Selection: Select "Create Task"
   */
  async selectCreateTask() {
    await this.createTaskCard.click();
    await this.continueButton.click();
    await this.page.waitForURL('**/task_creator');
  }

  /**
   * Action Selection: Select "Search Tasks"
   */
  async selectSearchTasks() {
    await this.searchTasksCard.click();
    await this.continueButton.click();
    await this.page.waitForURL('**/tasks');
  }

  /**
   * Verify success toast is visible
   */
  async verifySuccessToast() {
    await expect(this.successToast).toBeVisible({ timeout: 3000 });
  }

  /**
   * Verify we're on a specific page
   */
  async verifyUrl(urlPattern: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPattern));
  }

  /**
   * Complete teacher registration flow (happy path)
   */
  async completeTeacherRegistration(data: {
    country?: 'US' | 'HU';
    subject?: string;
    educationalModel?: string;
    name?: string;
    email?: string;
    password?: string;
    verificationCode?: string;
  }) {
    const defaults = {
      country: 'US' as const,
      subject: 'Mathematics',
      educationalModel: 'Secular',
      name: 'Test Teacher',
      email: 'test.teacher@school.edu',
      password: 'TestPassword123',
      verificationCode: '123456',
    };

    const config = { ...defaults, ...data };

    // Step 1: Country & Subject
    await this.selectCountry(config.country);
    await this.selectSubject(config.subject);
    await this.selectEducationalModel(config.educationalModel);
    await this.clickNext();

    // Step 2: Personal Info
    await this.fillPersonalInfo({
      name: config.name,
      email: config.email,
      password: config.password,
    });
    await this.submitPersonalInfo();

    // Step 3: Verification
    await this.enterVerificationCode(config.verificationCode);
    await this.clickVerify();
  }
}
