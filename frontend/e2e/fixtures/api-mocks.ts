import { Page } from '@playwright/test';
import type { MockUserOptions } from '@eduforger/shared';

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
                subjects: ['mathematics'],
                educationalModel: 'secular',
                teacherRole: 'grade_9_12',
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
   * Mock getCurrentUser endpoint
   * Uses shared MockUserOptions type for consistency
   */
  async mockGetCurrentUser(options?: MockUserOptions) {
    await this.page.route('**/api/auth/me', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Unauthorized',
          }),
        });
      } else {
        const {
          name = 'Test Teacher',
          email = 'teacher@school.edu',
          identity = 'teacher',
          subjects = ['mathematics'],
          country = 'US',
        } = options || {};

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                email,
                name,
                role: identity === 'teacher' ? 'teacher' : 'general_user',
                country,
                subjects,
                educationalModel: 'secular',
                teacherRole: identity === 'teacher' ? 'grade_9_12' : undefined,
                subscription: {
                  tier: 'trial',
                  status: 'active',
                  startDate: new Date().toISOString(),
                  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                },
                taskCredits: 100,
              },
            },
          }),
        });
      }
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

  /**
   * Mock tree-map endpoint for curriculum tree data
   * Uses wildcard to catch all variations of country/subject/gradeLevel
   */
  async mockTreeMap(options?: {
    country?: string;
    subject?: string;
    gradeLevel?: string;
    shouldFail?: boolean;
    customData?: any;
    onRequest?: (url: string, method: string) => void;
  }) {
    const country = options?.country || 'HU';
    const subject = options?.subject || 'mathematics';
    const gradeLevel = options?.gradeLevel || 'grade_9_10';

    // Use wildcard pattern to catch all tree-map requests
    await this.page.route('**/api/tree-map/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const pathParts = url.pathname.split('/');
      const reqCountry = pathParts[pathParts.length - 3];
      const reqSubject = pathParts[pathParts.length - 2];
      const reqGradeLevel = pathParts[pathParts.length - 1];

      // Call callback to track request if provided
      if (options?.onRequest) {
        options.onRequest(request.url(), request.method());
      }

      if (options?.shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to load curriculum tree',
          }),
        });
      } else {
        const mockData = options?.customData || {
          success: true,
          data: {
            country: reqCountry,
            subject: reqSubject,
            gradeLevel: reqGradeLevel,
            totalNodes: 3,
            rootNodes: 1,
            tree: [
              {
                key: 'test_category',
                name: 'Test Category',
                level: 1,
                subTopics: [
                  {
                    key: 'test_subcategory',
                    name: 'Test Subcategory',
                    level: 2,
                    subTopics: [
                      {
                        key: 'test_leaf',
                        name: 'Test Leaf Node',
                        level: 3,
                        subTopics: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData),
        });
      }
    });
  }

  /**
   * Mock tasks by curriculum path endpoint
   */
  async mockTasksByCurriculumPath(options?: {
    curriculumPath?: string;
    shouldFail?: boolean;
    hasNoTasks?: boolean;
    customTasks?: any[];
  }) {
    await this.page.route('**/api/v2/tasks?curriculum_path=*', async (route) => {
      if (options?.shouldFail) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'Failed to load tasks',
          }),
        });
      } else if (options?.hasNoTasks) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tasks: [],
            total: 0,
            page: 1,
            limit: 20,
            hasMore: false,
          }),
        });
      } else {
        const mockTasks = options?.customTasks || [
          {
            id: 'task_test_123',
            title: 'Test Task - Pitagorasz-tétel',
            subject: 'mathematics',
            educationalModel: 'secular',
            ratingAverage: 4.5,
            ratingCount: 10,
            viewCount: 39,
            description: '<h1>Test Task</h1><p>This is a test task description.</p>',
            created_at: '2025-01-01T00:00:00.000Z',
            updated_at: '2025-01-01T00:00:00.000Z',
            gradeLevel: 'grade_9_10',
            country_code: 'HU',
            difficultyLevel: 'medium',
            isPublished: true,
            curriculum_path: 'mathematics:grade_9_10:Test Category:Test Subcategory:Test Leaf Node',
            creatorName: 'Test Teacher',
          },
        ];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            tasks: mockTasks,
            total: mockTasks.length,
            page: 1,
            limit: 20,
            hasMore: false,
          }),
        });
      }
    });
  }

  /**
   * Setup all mocks for tasks page
   * This must be called BEFORE navigating to the page
   */
  async setupTasksPageMocks(options?: {
    country?: string;
    subject?: string;
    gradeLevel?: string;
    treeData?: any;
    hasNoTasks?: boolean;
    customTasks?: any[];
  }) {
    // Set up all mocks before any navigation
    await this.mockFirebaseAuth();

    // Important: Set up tree-map mock first
    await this.mockTreeMap({
      country: options?.country,
      subject: options?.subject,
      gradeLevel: options?.gradeLevel,
      customData: options?.treeData,
    });

    // Then set up tasks mock
    await this.mockTasksByCurriculumPath({
      hasNoTasks: options?.hasNoTasks,
      customTasks: options?.customTasks,
    });

    // Small delay to ensure routes are registered
    await this.page.waitForTimeout(100);
  }
}
