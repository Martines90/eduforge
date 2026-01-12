import { Page } from '@playwright/test';

/**
 * Common setup helpers for E2E tests
 * Handles repetitive setup like country selection
 */

/**
 * Set up guest user with country selected
 * This simulates the country selection modal being completed
 */
export async function setupGuest(page: Page, country: 'US' | 'HU' | 'MX' = 'US') {
  await page.context().addCookies([
    {
      name: 'eduforge_country',
      value: country,
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Set up authenticated teacher with all required cookies
 */
export async function setupTeacher(page: Page, options?: {
  name?: string;
  email?: string;
  subject?: 'mathematics' | 'physics' | 'chemistry' | 'biology';
  country?: 'US' | 'HU' | 'MX';
}) {
  const {
    name = 'Test Teacher',
    email = 'teacher@school.edu',
    subject = 'mathematics',
    country = 'US',
  } = options || {};

  await page.context().addCookies([
    {
      name: 'eduforge_is_registered',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_user_profile',
      value: JSON.stringify({
        name,
        email,
        registeredAt: new Date().toISOString(),
        token: 'mock-token-123',
      }),
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_role',
      value: 'registered',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_identity',
      value: 'teacher',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_subject',
      value: subject,
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_country',
      value: country,
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'mock-token-123');
  });
}

/**
 * Set up authenticated non-teacher
 */
export async function setupNonTeacher(page: Page, options?: {
  name?: string;
  email?: string;
  country?: 'US' | 'HU' | 'MX';
}) {
  const {
    name = 'Test User',
    email = 'user@example.com',
    country = 'US',
  } = options || {};

  await page.context().addCookies([
    {
      name: 'eduforge_is_registered',
      value: 'true',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_user_profile',
      value: JSON.stringify({
        name,
        email,
        registeredAt: new Date().toISOString(),
        token: 'mock-token-456',
      }),
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_role',
      value: 'registered',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_identity',
      value: 'non-teacher',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'eduforge_country',
      value: country,
      domain: 'localhost',
      path: '/',
    },
  ]);

  await page.addInitScript(() => {
    localStorage.setItem('authToken', 'mock-token-456');
  });
}
