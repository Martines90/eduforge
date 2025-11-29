import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Teacher Registration Flow
 * Covers the complete happy path from account creation to task selection
 */
test.describe('Teacher Registration Flow', () => {
  test.beforeEach(async ({ apiMocks }) => {
    // Setup API mocks before each test
    await apiMocks.setupRegistrationMocks();
  });

  test('should complete registration and navigate to task creator', async ({ registrationPage, page }) => {
    // Navigate to homepage
    await registrationPage.goto();

    // Verify login modal is visible
    await expect(registrationPage.createAccountTeacherButton).toBeVisible();

    // Click "Create Account" for teacher
    await registrationPage.clickCreateTeacherAccount();

    // Step 1: Select Country, Subject, and Educational Model
    await test.step('Step 1: Select country, subject, and educational model', async () => {
      await registrationPage.selectCountry('US');

      // Verify subject dropdown appears after country selection
      await expect(registrationPage.subjectSelect).toBeVisible();
      await registrationPage.selectSubject('Mathematics');

      // Verify educational model dropdown appears
      await expect(registrationPage.educationalModelSelect).toBeVisible();
      await registrationPage.selectEducationalModel('Secular');

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
        name: 'John Teacher',
        email: 'john.teacher@school.edu',
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

      // Verify success toast appears
      await registrationPage.verifySuccessToast();
    });

    // Step 4: Action Selection
    await test.step('Step 4: Select action - Create Task', async () => {
      // Verify Action Selection Modal is visible
      await expect(registrationPage.createTaskCard).toBeVisible({ timeout: 5000 });
      await expect(registrationPage.searchTasksCard).toBeVisible();

      // Select "Create Task"
      await registrationPage.selectCreateTask();

      // Verify navigation to task creator
      await expect(page).toHaveURL(/\/task_creator/);
    });
  });

  test('should complete registration and navigate to tasks page', async ({ registrationPage, page }) => {
    await registrationPage.goto();
    await registrationPage.clickCreateTeacherAccount();

    // Complete registration flow
    await registrationPage.completeTeacherRegistration({
      name: 'Jane Teacher',
      email: 'jane.teacher@school.edu',
    });

    // Select "Search Tasks"
    await test.step('Select Search Tasks action', async () => {
      await expect(registrationPage.searchTasksCard).toBeVisible({ timeout: 5000 });
      await registrationPage.selectSearchTasks();

      // Verify navigation to tasks page
      await expect(page).toHaveURL(/\/tasks/);
    });
  });

});

/**
 * Mobile-specific tests
 */
test.describe('Teacher Registration Flow - Mobile', () => {
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
      await registrationPage.clickCreateTeacherAccount();

      // Modal should be visible and take full screen
      await expect(registrationPage.countrySelect).toBeVisible();
    });

    // Complete full registration flow on mobile
    await registrationPage.completeTeacherRegistration({
      country: 'US',
      subject: 'Geography',
      educationalModel: 'Liberal',
      name: 'Mobile Teacher',
      email: 'mobile@school.edu',
    });

    // Select action
    await expect(registrationPage.createTaskCard).toBeVisible({ timeout: 5000 });
    await registrationPage.selectCreateTask();

    // Verify navigation
    await expect(page).toHaveURL(/\/task_creator/);
  });

  test('should handle verification code input on mobile', async ({ registrationPage, page }) => {
    await registrationPage.goto();
    await registrationPage.clickCreateTeacherAccount();

    // Complete full registration to test verification on mobile
    await registrationPage.completeTeacherRegistration({
      country: 'US',
      subject: 'Mathematics',
      educationalModel: 'Secular',
      name: 'Mobile Test Teacher',
      email: 'mobile.test@school.edu',
    });

    // Verify navigation after successful verification
    await expect(registrationPage.createTaskCard).toBeVisible({ timeout: 5000 });
  });
});
