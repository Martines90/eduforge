import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Non-Teacher (General User) Registration Flow
 * Covers the complete happy path from account creation to tasks page
 */
test.describe('Non-Teacher Registration Flow', () => {
  test.beforeEach(async ({ apiMocks }) => {
    // Setup API mocks before each test
    await apiMocks.setupRegistrationMocks();
  });

  test('should complete registration and navigate to home page', async ({ registrationPage, page }) => {
    // Navigate to homepage
    await registrationPage.goto();

    // Verify login modal is visible
    await expect(registrationPage.createAccountNonTeacherButton).toBeVisible();

    // Click "Create Account" for non-teacher
    await registrationPage.clickCreateNonTeacherAccount();

    // Step 1: Select Country only (no subject for non-teachers)
    await test.step('Step 1: Select country', async () => {
      await registrationPage.selectCountry('US');

      // Verify Next button is enabled and click it
      await expect(registrationPage.nextButton).toBeEnabled();
      await registrationPage.clickNext();
    });

    // Step 2: Fill Personal Information
    await test.step('Step 2: Fill personal information', async () => {
      // Verify we're on step 2
      await expect(registrationPage.nameInput).toBeVisible();

      // Fill in personal info
      await registrationPage.fillPersonalInfo({
        name: 'John Student',
        email: 'john.student@example.com',
        password: 'SecurePass123',
      });

      // Verify Create Account button is enabled
      await expect(registrationPage.createAccountButton).toBeEnabled();

      // Submit the form
      await registrationPage.submitPersonalInfo();
    });

    // Step 3: Verify Email
    await test.step('Step 3: Enter verification code', async () => {
      // Verify we're on step 3 (verification)
      await expect(registrationPage.verificationCodeInputs.first()).toBeVisible();

      // Enter verification code
      await registrationPage.enterVerificationCode('123456');

      // Verify button is enabled
      await expect(registrationPage.verifyButton).toBeEnabled();

      // Click verify button
      await registrationPage.clickVerify();
    });

    // Step 4: Verify redirect to home page
    await test.step('Step 4: Verify navigation to home page', async () => {
      // Should be redirected to home page after successful verification
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Verify "Search Tasks" card is visible (non-teachers only see this)
      const searchTasksHeading = page.getByRole('heading', { name: /search tasks/i });
      await expect(searchTasksHeading).toBeVisible();

      // Verify "Create Task" card is NOT visible (only for teachers)
      const createTaskHeading = page.getByRole('heading', { name: /^create task$/i, exact: true });
      await expect(createTaskHeading).not.toBeVisible();
    });
  });

});

/**
 * Mobile-specific tests for non-teacher registration
 */
test.describe('Non-Teacher Registration Flow - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test.beforeEach(async ({ apiMocks }) => {
    await apiMocks.setupRegistrationMocks();
  });

  test('should complete registration on mobile device', async ({ registrationPage, page }) => {
    await registrationPage.goto();

    // Verify modal is fullscreen on mobile
    await test.step('Verify fullscreen modal on mobile', async () => {
      await registrationPage.clickCreateNonTeacherAccount();

      // Modal should be visible and take full screen
      await expect(registrationPage.countrySelect).toBeVisible();
    });

    // Complete step 1 - Country only
    await registrationPage.selectCountry('US');
    await registrationPage.clickNext();

    // Complete step 2 - Personal info
    await registrationPage.fillPersonalInfo({
      name: 'Mobile User',
      email: 'mobile@example.com',
      password: 'MobilePass123',
    });
    await registrationPage.submitPersonalInfo();

    // Complete step 3 - Verification
    await registrationPage.enterVerificationCode('123456');
    await registrationPage.clickVerify();

    // Verify navigation to home page after successful verification
    await expect(page).toHaveURL('/', { timeout: 10000 });

    // Verify only Search Tasks is visible on mobile
    const searchTasksHeading = page.getByRole('heading', { name: /search tasks/i });
    await expect(searchTasksHeading).toBeVisible();
  });

});
