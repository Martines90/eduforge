import { test, expect } from './fixtures/test-fixtures';
import { setupTeacher, setupNonTeacher } from './fixtures/setup-helpers';

/**
 * Home Page - Happy Path Tests
 * Tests navigation and view for teachers vs non-teachers
 */
test.describe('Home Page - Teacher View', () => {
  test.beforeEach(async ({ page }) => {
    await setupTeacher(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });
  });

  test('should display both Create Task and Search Tasks cards for teachers', async ({ page }) => {
    // Verify page title
    const pageTitle = page.getByRole('heading', { name: /EduForger/i, level: 1 });
    await expect(pageTitle).toBeVisible();

    // Verify subtitle (rendered as Typography, not heading)
    const subtitle = page.getByText(/Educational Task Platform/i);
    await expect(subtitle).toBeVisible();

    // Verify "Create Task" card is visible
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i });
    await expect(createTaskHeading).toBeVisible();

    const createTaskDescription = page.getByText(/Create educational tasks based on curriculum topics/i);
    await expect(createTaskDescription).toBeVisible();

    // Verify "Search Tasks" card is visible
    const searchTasksHeading = page.getByRole('heading', { name: /^Search Tasks$/i });
    await expect(searchTasksHeading).toBeVisible();

    const searchTasksDescription = page.getByText(/Browse and discover educational tasks created by teachers/i);
    await expect(searchTasksDescription).toBeVisible();

    // Verify both buttons are present
    const createTaskButton = page.getByRole('link', { name: /Go to Task Creator/i });
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });

    await expect(createTaskButton).toBeVisible();
    await expect(browseTasksButton).toBeVisible();
  });

  test('should navigate to task creator when clicking Create Task button', async ({ page }) => {
    // Wait for teacher view to be fully rendered (Create Task card only shows for teachers)
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i });
    await expect(createTaskHeading).toBeVisible({ timeout: 10000 });

    // Click "Go to Task Creator" button
    const createTaskButton = page.getByRole('link', { name: /Go to Task Creator/i });
    await expect(createTaskButton).toBeVisible();

    // Click and wait for navigation
    await createTaskButton.click();
    await page.waitForURL(/\/task_creator/, { timeout: 10000 });
  });

  test('should navigate to tasks page when clicking Browse Tasks button', async ({ page }) => {
    // Wait for teacher view to be fully rendered (Create Task card only shows for teachers)
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i });
    await expect(createTaskHeading).toBeVisible({ timeout: 10000 });

    // Click "Browse Tasks" button
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();

    // Click and wait for navigation
    await browseTasksButton.click();
    await page.waitForURL(/\/tasks/, { timeout: 10000 });

    // Verify we're on the tasks page
    const tasksHeading = page.getByRole('heading', { name: /Educational Tasks/i });
    await expect(tasksHeading).toBeVisible();
  });

});

test.describe('Home Page - Non-Teacher View', () => {
  test.beforeEach(async ({ page }) => {
    await setupNonTeacher(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });
  });

  test('should display only Search Tasks card for non-teachers', async ({ page }) => {
    // Verify page title
    const pageTitle = page.getByRole('heading', { name: /EduForger/i, level: 1 });
    await expect(pageTitle).toBeVisible();

    // Verify subtitle (rendered as Typography, not heading)
    const subtitle = page.getByText(/Educational Task Platform/i);
    await expect(subtitle).toBeVisible();

    // Verify "Search Tasks" card IS visible
    const searchTasksHeading = page.getByRole('heading', { name: /^Search Tasks$/i });
    await expect(searchTasksHeading).toBeVisible();

    const searchTasksDescription = page.getByText(/Browse and discover educational tasks created by teachers/i);
    await expect(searchTasksDescription).toBeVisible();

    // Verify "Browse Tasks" button is present
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();

    // Verify "Create Task" card is NOT visible
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i, exact: true });
    await expect(createTaskHeading).not.toBeVisible();

    // Verify "Go to Task Creator" button is NOT present
    const createTaskButton = page.getByRole('link', { name: /Go to Task Creator/i });
    await expect(createTaskButton).not.toBeVisible();
  });

  test('should navigate to tasks page when clicking Browse Tasks button', async ({ page }) => {
    // Wait for non-teacher view to be fully rendered (Create Task should NOT be visible)
    const searchTasksHeading = page.getByRole('heading', { name: /^Search Tasks$/i });
    await expect(searchTasksHeading).toBeVisible({ timeout: 10000 });

    // Verify Create Task is NOT visible (confirms non-teacher view loaded)
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i, exact: true });
    await expect(createTaskHeading).not.toBeVisible();

    // Click "Browse Tasks" button
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();

    // Click and wait for navigation
    await browseTasksButton.click();
    await page.waitForURL(/\/tasks/, { timeout: 10000 });

    // Verify we're on the tasks page
    const tasksHeading = page.getByRole('heading', { name: /Educational Tasks/i });
    await expect(tasksHeading).toBeVisible();
  });

});
