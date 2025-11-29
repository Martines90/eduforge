import { test as base } from '@playwright/test';
import { RegistrationPage } from '../pages/registration.page';
import { ApiMocks } from './api-mocks';

/**
 * Extended test fixtures with Page Objects and API mocks
 */
type TestFixtures = {
  registrationPage: RegistrationPage;
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

  apiMocks: async ({ page }, use) => {
    const apiMocks = new ApiMocks(page);
    await use(apiMocks);
  },
});

export { expect } from '@playwright/test';
