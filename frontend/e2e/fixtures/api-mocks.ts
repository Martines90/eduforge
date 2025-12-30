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
   * Mock guest session creation
   */
  async mockGuestSession(options?: { generationsRemaining?: number; limitReached?: boolean }) {
    await this.page.route('**/api/auth/guest-token', async (route) => {
      if (options?.limitReached) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Generation limit reached',
            data: { limitReached: true },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              token: 'mock-guest-token-123',
              sessionId: 'mock-session-id',
              generationsUsed: 3 - (options?.generationsRemaining ?? 3),
              maxGenerations: 3,
              generationsRemaining: options?.generationsRemaining ?? 3,
              canGenerate: (options?.generationsRemaining ?? 3) > 0,
            },
          }),
        });
      }
    });
  }

  /**
   * Mock task generation endpoints
   */
  async mockTaskGeneration(options?: { shouldFail?: boolean }) {
    // Mock curriculum data fetch
    await this.page.route('**/api/subject-mapping/curriculum-tree/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            grade_9_10: [
              {
                id: 'mechanics',
                title: 'Mechanics',
                children: [
                  {
                    id: 'kinematics',
                    title: 'Kinematics',
                    children: [],
                  },
                ],
              },
            ],
            grade_11_12: [],
          },
        }),
      });
    });

    // Mock task generation
    await this.page.route('**/api/tasks/generate', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Task generation failed',
          }),
        });
      } else {
        // Simulate multi-step generation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              taskId: 'mock-task-id-123',
              taskText: {
                title: 'Physics Problem: Projectile Motion',
                story_text: 'A ball is thrown at an angle...',
                questions: ['Calculate the maximum height', 'Find the range'],
              },
              solution: {
                solution_steps: [
                  {
                    step_number: 1,
                    title: 'Identify given values',
                    description: 'Initial velocity: 20 m/s, Angle: 45°',
                  },
                ],
                final_answer: 'Maximum height: 10.2 m, Range: 40.8 m',
              },
              images: { images: [] },
            },
          }),
        });
      }
    });
  }

  /**
   * Mock task save endpoint
   */
  async mockTaskSave(options?: { shouldFail?: boolean }) {
    await this.page.route('**/api/tasks/save', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to save task',
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Task saved successfully',
            data: {
              taskId: 'mock-task-id-123',
              publicShareLink: 'https://eduforger.com/task/mock-task-id-123',
            },
          }),
        });
      }
    });
  }

  /**
   * Mock logout endpoint
   */
  async mockLogout() {
    await this.page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully',
        }),
      });
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

  /**
   * Setup all mocks for guest task generation flow
   */
  async setupGuestTaskGenerationMocks(options?: { generationsRemaining?: number }) {
    await this.mockFirebaseAuth();
    await this.mockGuestSession(options);
    await this.mockTaskGeneration();
  }

  /**
   * Setup all mocks for authenticated task generation flow
   */
  async setupAuthenticatedTaskGenerationMocks() {
    await this.mockFirebaseAuth();
    await this.mockTaskGeneration();
    await this.mockTaskSave();
    await this.mockLogout();
  }
}
