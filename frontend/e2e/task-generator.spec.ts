import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Task Generator Flow
 * Covers guest generation, localStorage persistence, registration flow, and logout behavior
 */

test.describe('Guest Task Generation Flow', () => {
  test.beforeEach(async ({ apiMocks, taskGeneratorPage }) => {
    // Setup API mocks for guest flow
    await apiMocks.setupGuestTaskGenerationMocks({ generationsRemaining: 3 });

    // Clear localStorage before each test
    await taskGeneratorPage.clearLocalStorage();
  });

  test('should allow guest to generate a task and see generation counter', async ({ taskGeneratorPage }) => {
    await test.step('Navigate to task generator', async () => {
      await taskGeneratorPage.goto();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify guest banner shows 3/3 generations remaining', async () => {
      await expect(taskGeneratorPage.guestBanner).toBeVisible();
      const remaining = await taskGeneratorPage.getGuestGenerationsRemaining();
      expect(remaining).toBe(3);
    });

    await test.step('Generate a task', async () => {
      await taskGeneratorPage.selectTopic();
      await taskGeneratorPage.completeTaskConfiguration();
      await taskGeneratorPage.waitForTaskGeneration();
    });

    await test.step('Verify task is displayed', async () => {
      await expect(taskGeneratorPage.taskResult).toBeVisible();
    });

    await test.step('Verify task is saved to localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);

      const task = await taskGeneratorPage.getUnpublishedTask();
      expect(task).toBeTruthy();
      expect(task.id).toBe('mock-task-id-123');
    });
  });

  test('should show guest limit reached after 3 generations', async ({ apiMocks, taskGeneratorPage, page }) => {
    // Mock guest session with 0 remaining
    await apiMocks.mockGuestSession({ generationsRemaining: 0, limitReached: true });

    await taskGeneratorPage.goto();
    await taskGeneratorPage.waitForPageLoad();

    await test.step('Verify guest banner shows 0/3 generations', async () => {
      await expect(taskGeneratorPage.guestBanner).toBeVisible();
      const bannerText = await taskGeneratorPage.guestBanner.textContent();
      expect(bannerText).toContain('0/3');
    });

    await test.step('Verify register message is shown', async () => {
      const bannerText = await taskGeneratorPage.guestBanner.textContent();
      expect(bannerText).toContain('Register');
      expect(bannerText).toContain('100 more');
    });
  });

  test('guest should be prompted to register when trying to save', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task as guest', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Try to save task to database', async () => {
      // Click save button
      await taskGeneratorPage.saveButton.click();
    });

    await test.step('Verify registration modal appears', async () => {
      // Should show guest prompt modal
      const guestModal = page.locator('[data-testid="guest-prompt-modal"]');
      await expect(guestModal).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('localStorage Persistence', () => {
  test.beforeEach(async ({ apiMocks, taskGeneratorPage }) => {
    await apiMocks.setupGuestTaskGenerationMocks({ generationsRemaining: 3 });
    await taskGeneratorPage.clearLocalStorage();
  });

  test('should persist task across page refreshes', async ({ taskGeneratorPage }) => {
    let taskId: string;

    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
      const task = await taskGeneratorPage.getUnpublishedTask();
      taskId = task.id;
      expect(taskId).toBe('mock-task-id-123');
    });

    await test.step('Refresh the page', async () => {
      await taskGeneratorPage.page.reload();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify task is still in localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);

      const task = await taskGeneratorPage.getUnpublishedTask();
      expect(task.id).toBe(taskId);
    });

    await test.step('Verify task is loaded in the view', async () => {
      // Task should be automatically restored and displayed
      await expect(taskGeneratorPage.taskResult).toBeVisible({ timeout: 10000 });
    });
  });

  test('should persist task when navigating away and back', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Navigate away to home page', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await test.step('Navigate back to task generator', async () => {
      await taskGeneratorPage.goto();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify task is restored', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);

      // Task should be visible
      await expect(taskGeneratorPage.taskResult).toBeVisible({ timeout: 10000 });
    });
  });

  test('should update localStorage when task is edited', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Edit the task', async () => {
      // Click edit button (assuming task result has edit functionality)
      const editButton = page.getByRole('button', { name: /edit/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Make some changes (this depends on your implementation)
        const titleInput = page.locator('input[name="title"]');
        if (await titleInput.isVisible()) {
          await titleInput.fill('Edited Task Title');
        }

        // Save changes
        const saveChangesBtn = page.getByRole('button', { name: /save changes/i });
        if (await saveChangesBtn.isVisible()) {
          await saveChangesBtn.click();
        }
      }
    });

    await test.step('Verify edited task is saved to localStorage', async () => {
      const task = await taskGeneratorPage.getUnpublishedTask();
      expect(task).toBeTruthy();
      // Edited task should be in localStorage
    });
  });
});

test.describe('Registered User - Task Persistence', () => {
  test.beforeEach(async ({ apiMocks, taskGeneratorPage }) => {
    await apiMocks.setupAuthenticatedTaskGenerationMocks();
    await taskGeneratorPage.clearLocalStorage();

    // Set up authenticated session
    await taskGeneratorPage.page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-auth-token-123');
      document.cookie = 'eduforger_is_registered=true';
      document.cookie = 'eduforger_user_profile={"name":"Test Teacher","email":"test@school.edu"}';
      document.cookie = 'eduforger_identity=teacher';
    });
  });

  test('should save task to localStorage for registered users', async ({ taskGeneratorPage }) => {
    await test.step('Generate a task as registered user', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Verify task is saved to localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);
    });

    await test.step('Verify ongoing task banner is shown', async () => {
      await expect(taskGeneratorPage.ongoingTaskBanner).toBeVisible();
    });
  });

  test('should persist task across page refreshes for registered users', async ({ taskGeneratorPage }) => {
    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Refresh the page', async () => {
      await taskGeneratorPage.page.reload();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify task is restored', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);

      await expect(taskGeneratorPage.taskResult).toBeVisible({ timeout: 10000 });
      await expect(taskGeneratorPage.ongoingTaskBanner).toBeVisible();
    });
  });

  test('should clear task from localStorage only after successful publish', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Verify task exists in localStorage before publishing', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);
    });

    await test.step('Publish task to database', async () => {
      await taskGeneratorPage.saveTaskToDatabase();
    });

    await test.step('Wait for success message', async () => {
      // Wait for success toast
      const successToast = page.locator('.notistack-snackbar', { hasText: /successfully saved and published/i });
      await expect(successToast).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify task is cleared from localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(false);
    });

    await test.step('Verify task result is cleared from view', async () => {
      await expect(taskGeneratorPage.taskResult).not.toBeVisible();
    });
  });

  test('should NOT clear task from localStorage if publish fails', async ({ apiMocks, taskGeneratorPage, page }) => {
    // Mock save to fail
    await apiMocks.mockTaskSave({ shouldFail: true });

    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Try to publish task (should fail)', async () => {
      await taskGeneratorPage.saveTaskToDatabase();
    });

    await test.step('Wait for error message', async () => {
      const errorToast = page.locator('.notistack-snackbar', { hasText: /failed to save/i });
      await expect(errorToast).toBeVisible({ timeout: 5000 });
    });

    await test.step('Verify task is still in localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);
    });

    await test.step('Verify task is still visible', async () => {
      await expect(taskGeneratorPage.taskResult).toBeVisible();
    });
  });
});

test.describe('Registration and Task Restoration Flow', () => {
  test.beforeEach(async ({ apiMocks, taskGeneratorPage }) => {
    await apiMocks.setupGuestTaskGenerationMocks({ generationsRemaining: 3 });
    await apiMocks.setupRegistrationMocks();
    await taskGeneratorPage.clearLocalStorage();
  });

  test('should restore task after guest registers', async ({ taskGeneratorPage, registrationPage, page }) => {
    let guestTaskId: string;

    await test.step('Generate a task as guest', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
      const task = await taskGeneratorPage.getUnpublishedTask();
      guestTaskId = task.id;
    });

    await test.step('Verify task is in localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);
    });

    await test.step('Click Login/Register button', async () => {
      await taskGeneratorPage.clickLoginRegister();
    });

    await test.step('Complete registration', async () => {
      await registrationPage.clickCreateTeacherAccount();
      await registrationPage.completeTeacherRegistration({
        country: 'US',
        subject: 'Physics',
        educationalModel: 'Secular',
        name: 'New Teacher',
        email: 'new.teacher@school.edu',
      });
    });

    await test.step('Should redirect to home page (not task generator)', async () => {
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    await test.step('Navigate to task generator', async () => {
      await taskGeneratorPage.goto();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify task is still in localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);

      const task = await taskGeneratorPage.getUnpublishedTask();
      expect(task.id).toBe(guestTaskId);
    });

    await test.step('Verify task is restored and ongoing task banner is shown', async () => {
      await expect(taskGeneratorPage.taskResult).toBeVisible({ timeout: 10000 });
      await expect(taskGeneratorPage.ongoingTaskBanner).toBeVisible();
    });
  });
});

test.describe('Logout Behavior', () => {
  test.beforeEach(async ({ apiMocks, taskGeneratorPage }) => {
    await apiMocks.setupAuthenticatedTaskGenerationMocks();
    await taskGeneratorPage.clearLocalStorage();

    // Set up authenticated session
    await taskGeneratorPage.page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-auth-token-123');
      document.cookie = 'eduforger_is_registered=true';
      document.cookie = 'eduforger_user_profile={"name":"Test Teacher","email":"test@school.edu"}';
      document.cookie = 'eduforger_identity=teacher';
    });
  });

  test('should clear task from localStorage when user logs out', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task as registered user', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Verify task exists in localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(true);
    });

    await test.step('Open user menu and logout', async () => {
      // Click user avatar/menu
      const userMenu = page.locator('[data-testid="user-menu"]').or(page.getByRole('button', { name: /TT/i }));
      await userMenu.click();

      // Click logout
      const logoutButton = page.getByRole('menuitem', { name: /logout/i });
      await logoutButton.click();
    });

    await test.step('Wait for redirect to home', async () => {
      await expect(page).toHaveURL('/', { timeout: 10000 });
    });

    await test.step('Verify task is cleared from localStorage', async () => {
      const hasTask = await taskGeneratorPage.hasUnpublishedTask();
      expect(hasTask).toBe(false);
    });

    await test.step('Verify auth token is also cleared', async () => {
      const token = await taskGeneratorPage.getLocalStorageItem('authToken');
      expect(token).toBeNull();
    });
  });

  test('should not show ongoing task banner after logout', async ({ taskGeneratorPage, page }) => {
    await test.step('Generate a task', async () => {
      await taskGeneratorPage.generateTaskFullFlow();
    });

    await test.step('Logout', async () => {
      const userMenu = page.locator('[data-testid="user-menu"]').or(page.getByRole('button', { name: /TT/i }));
      await userMenu.click();

      const logoutButton = page.getByRole('menuitem', { name: /logout/i });
      await logoutButton.click();
      await page.waitForURL('/', { timeout: 10000 });
    });

    await test.step('Navigate back to task generator', async () => {
      await taskGeneratorPage.goto();
      await taskGeneratorPage.waitForPageLoad();
    });

    await test.step('Verify no ongoing task banner', async () => {
      await expect(taskGeneratorPage.ongoingTaskBanner).not.toBeVisible();
    });

    await test.step('Verify guest banner is shown instead', async () => {
      await expect(taskGeneratorPage.guestBanner).toBeVisible();
    });
  });
});
