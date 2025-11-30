import { test as base } from '@playwright/test';
import { RegistrationPage } from '../pages/registration.page';
import { TaskCreatorPage } from '../pages/task-creator.page';
import { TasksPage } from '../pages/tasks.page';
import { TaskDetailPage } from '../pages/task-detail.page';
import { ApiMocks } from './api-mocks';

/**
 * Extended test fixtures with Page Objects and API mocks
 */
type TestFixtures = {
  registrationPage: RegistrationPage;
  taskCreatorPage: TaskCreatorPage;
  tasksPage: TasksPage;
  taskDetailPage: TaskDetailPage;
  apiMocks: ApiMocks;
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
});

export { expect } from '@playwright/test';
