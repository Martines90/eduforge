import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Home Page
 * Tests different views and navigation for teachers vs non-teachers
 */
test.describe('Home Page - Teacher View', () => {
  test.beforeEach(async ({ page }) => {
    // Mock teacher user state with proper cookies
    await page.context().addCookies([
      {
        name: 'eduforger_is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_user_profile',
        value: JSON.stringify({
          name: 'Test Teacher',
          email: 'test.teacher@school.edu',
          registeredAt: new Date().toISOString(),
          token: 'mock-token-123',
        }),
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_role',
        value: 'registered',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_subject',
        value: 'mathematics',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_country',
        value: 'US',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock authToken in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token-123');
    });

    // Navigate to home page
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
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });

    // Click "Go to Task Creator" button
    const createTaskButton = page.getByRole('link', { name: /Go to Task Creator/i });
    await expect(createTaskButton).toBeVisible();
    await createTaskButton.click();

    // Verify navigation to task creator page
    await expect(page).toHaveURL(/\/task_creator/, { timeout: 10000 });

    // Verify we're on the task creator page
    const taskCreatorHeading = page.getByRole('heading', { name: /Task Creator/i });
    await expect(taskCreatorHeading).toBeVisible();
  });

  test('should navigate to tasks page when clicking Browse Tasks button', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });

    // Click "Browse Tasks" button
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();
    await browseTasksButton.click();

    // Verify navigation to tasks page
    await expect(page).toHaveURL(/\/tasks/, { timeout: 10000 });

    // Verify we're on the tasks page
    const tasksHeading = page.getByRole('heading', { name: /Educational Tasks/i });
    await expect(tasksHeading).toBeVisible();
  });

});

test.describe('Home Page - Non-Teacher View', () => {
  test.beforeEach(async ({ page }) => {
    // Mock non-teacher user state with proper cookies
    await page.context().addCookies([
      {
        name: 'eduforger_is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_user_profile',
        value: JSON.stringify({
          name: 'Test User',
          email: 'test.user@example.com',
          registeredAt: new Date().toISOString(),
          token: 'mock-token-456',
        }),
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_role',
        value: 'registered',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_identity',
        value: 'non-teacher',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_country',
        value: 'US',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock authToken in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token-456');
    });

    // Navigate to home page
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
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });

    // Click "Browse Tasks" button
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();
    await browseTasksButton.click();

    // Verify navigation to tasks page
    await expect(page).toHaveURL(/\/tasks/, { timeout: 10000 });

    // Verify we're on the tasks page
    const tasksHeading = page.getByRole('heading', { name: /Educational Tasks/i });
    await expect(tasksHeading).toBeVisible();
  });

});

test.describe('Home Page - Mobile View', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should display cards stacked vertically for teachers on mobile', async ({ page }) => {
    // Mock teacher user state with proper cookies
    await page.context().addCookies([
      {
        name: 'eduforger_is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_user_profile',
        value: JSON.stringify({
          name: 'Mobile Teacher',
          email: 'mobile@school.edu',
          registeredAt: new Date().toISOString(),
          token: 'mock-token-789',
        }),
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_role',
        value: 'registered',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_subject',
        value: 'mathematics',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_country',
        value: 'US',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock authToken in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token-789');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });

    // Verify both cards are visible on mobile
    const createTaskHeading = page.getByRole('heading', { name: /^Create Task$/i });
    const searchTasksHeading = page.getByRole('heading', { name: /^Search Tasks$/i });

    await expect(createTaskHeading).toBeVisible();
    await expect(searchTasksHeading).toBeVisible();

    // On mobile, cards should be stacked (different Y positions)
    const createCard = createTaskHeading.locator('..');
    const searchCard = searchTasksHeading.locator('..');

    const createBox = await createCard.boundingBox();
    const searchBox = await searchCard.boundingBox();

    if (createBox && searchBox) {
      // Y positions should be different (more than 100px apart) indicating vertical stacking
      const yDiff = Math.abs(createBox.y - searchBox.y);
      expect(yDiff).toBeGreaterThan(100);
    }
  });

  test('should navigate correctly on mobile for non-teachers', async ({ page }) => {
    // Mock non-teacher user state with proper cookies
    await page.context().addCookies([
      {
        name: 'eduforger_is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_user_profile',
        value: JSON.stringify({
          name: 'Mobile User',
          email: 'mobile.user@example.com',
          registeredAt: new Date().toISOString(),
          token: 'mock-token-321',
        }),
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_role',
        value: 'registered',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_identity',
        value: 'non-teacher',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'eduforger_country',
        value: 'US',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Mock authToken in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-token-321');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, body', { state: 'visible', timeout: 10000 });

    // Verify only Search Tasks is visible
    const searchTasksHeading = page.getByRole('heading', { name: /^Search Tasks$/i });
    await expect(searchTasksHeading).toBeVisible();

    // Click and navigate
    const browseTasksButton = page.getByRole('link', { name: /Browse Tasks/i });
    await expect(browseTasksButton).toBeVisible();
    await browseTasksButton.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/tasks/, { timeout: 5000 });
  });
});
