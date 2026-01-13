import { Page } from '@playwright/test';
import { ApiMocks } from './api-mocks';
import type { CountryCode, Subject } from '@eduforger/shared';

/**
 * Common setup helpers for E2E tests
 * Handles repetitive setup like country selection
 */

/**
 * Set up guest user with country selected
 * This simulates the country selection modal being completed
 */
export async function setupGuest(page: Page, country: CountryCode = 'US') {
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
 * Uses shared types for type safety
 */
export async function setupTeacher(page: Page, options?: {
  name?: string;
  email?: string;
  subjects?: Subject[];
  country?: CountryCode;
}) {
  const {
    name = 'Test Teacher',
    email = 'teacher@school.edu',
    subjects = ['mathematics'],
    country = 'US',
  } = options || {};

  // Set up API mocks FIRST before any cookies/storage
  const apiMocks = new ApiMocks(page);
  await apiMocks.mockFirebaseAuth();
  await apiMocks.mockGetCurrentUser({
    name,
    email,
    identity: 'teacher',
    subjects,
    country,
  });

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
      name: 'eduforge_subjects',
      value: JSON.stringify(subjects),
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
 * Uses shared types for type safety
 */
export async function setupNonTeacher(page: Page, options?: {
  name?: string;
  email?: string;
  country?: CountryCode;
}) {
  const {
    name = 'Test User',
    email = 'user@example.com',
    country = 'US',
  } = options || {};

  // Set up API mocks FIRST before any cookies/storage
  const apiMocks = new ApiMocks(page);
  await apiMocks.mockFirebaseAuth();
  await apiMocks.mockGetCurrentUser({
    name,
    email,
    identity: 'non-teacher',
    subjects: [],
    country,
  });

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
