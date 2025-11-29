import { Page } from '@playwright/test';

/**
 * Mock API responses for registration flow
 */
export class ApiMocks {
  constructor(private page: Page) {}

  /**
   * Mock the registration endpoint
   */
  async mockRegisterUser(options?: { shouldFail?: boolean }) {
    await this.page.route('**/api/auth/register', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Registration failed',
          }),
        });
      } else {
        // Simulate successful registration
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Verification code sent',
            data: {
              email: 'test@school.edu',
            },
          }),
        });

        // Log verification code to console for testing
        console.log('[E2E Mock] Verification code: 123456');
      }
    });
  }

  /**
   * Mock the email verification endpoint
   */
  async mockVerifyEmail(options?: { shouldFail?: boolean }) {
    await this.page.route('**/api/auth/verify-email', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Invalid verification code',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Email verified successfully',
            data: {
              token: 'mock-jwt-token-123',
              user: {
                email: 'test@school.edu',
                name: 'Test Teacher',
                role: 'teacher',
                country: 'US',
                subject: 'mathematics',
              },
            },
          }),
        });
      }
    });
  }

  /**
   * Mock Firebase auth state
   */
  async mockFirebaseAuth() {
    await this.page.addInitScript(() => {
      // Mock Firebase to avoid real authentication
      (window as any).__FIREBASE_MOCKED__ = true;
    });
  }

  /**
   * Setup all mocks for registration flow
   */
  async setupRegistrationMocks() {
    await this.mockFirebaseAuth();
    await this.mockRegisterUser();
    await this.mockVerifyEmail();
  }
}
