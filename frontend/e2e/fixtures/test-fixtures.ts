import { test as base } from '@playwright/test';
import { RegistrationPage } from '../pages/registration.page';
import { TaskCreatorPage } from '../pages/task-creator.page';
import { TaskGeneratorPage } from '../pages/task-generator.page';
import { TasksPage } from '../pages/tasks.page';
import { TaskDetailPage } from '../pages/task-detail.page';
import { TestLibraryPage } from '../pages/test-library.page';
import { TestEditorPage } from '../pages/test-editor.page';
import { PublishedTestPage } from '../pages/published-test.page';
import { ApiMocks } from './api-mocks';

/**
 * Authenticated user type for e2e tests
 */
export type AuthenticatedUser = {
  uid: string;
  email: string;
  displayName?: string;
  token: string;
};

/**
 * Extended test fixtures with Page Objects and API mocks
 */
type TestFixtures = {
  registrationPage: RegistrationPage;
  taskCreatorPage: TaskCreatorPage;
  taskGeneratorPage: TaskGeneratorPage;
  tasksPage: TasksPage;
  taskDetailPage: TaskDetailPage;
  testLibraryPage: TestLibraryPage;
  testEditorPage: TestEditorPage;
  publishedTestPage: PublishedTestPage;
  apiMocks: ApiMocks;
  authenticatedUser: AuthenticatedUser;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  registrationPage: async ({ page }, use) => {
    const registrationPage = new RegistrationPage(page);
    await use(registrationPage);
  },

  taskCreatorPage: async ({ page }, use) => {
    const taskCreatorPage = new TaskCreatorPage(page);
    await use(taskCreatorPage);
  },

  taskGeneratorPage: async ({ page }, use) => {
    const taskGeneratorPage = new TaskGeneratorPage(page);
    await use(taskGeneratorPage);
  },

  tasksPage: async ({ page }, use) => {
    const tasksPage = new TasksPage(page);
    await use(tasksPage);
  },

  taskDetailPage: async ({ page }, use) => {
    const taskDetailPage = new TaskDetailPage(page);
    await use(taskDetailPage);
  },

  apiMocks: async ({ page }, use) => {
    const apiMocks = new ApiMocks(page);
    await use(apiMocks);
  },

  testLibraryPage: async ({ page }, use) => {
    const testLibraryPage = new TestLibraryPage(page);
    await use(testLibraryPage);
  },

  testEditorPage: async ({ page }, use) => {
    const testEditorPage = new TestEditorPage(page);
    await use(testEditorPage);
  },

  publishedTestPage: async ({ page }, use) => {
    const publishedTestPage = new PublishedTestPage(page);
    await use(publishedTestPage);
  },

  authenticatedUser: async ({ page }, use) => {
    // Create a mock authenticated user
    const mockUser: AuthenticatedUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      token: 'mock-jwt-token-for-testing',
    };

    // Set up authentication in localStorage
    await page.addInitScript((user) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', user.token);
    }, mockUser);

    await use(mockUser);

    // Cleanup: Remove auth data after test
    await page.evaluate(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    });
  },
});

export { expect } from '@playwright/test';
