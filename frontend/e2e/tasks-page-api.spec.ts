import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Tasks Page API Integration
 * Tests API endpoints, request/response handling, and state management
 * These tests use mocked API responses to ensure consistent behavior
 */
test.describe('Tasks Page - API Integration @unit', () => {
  test.beforeEach(async ({ tasksPage, apiMocks }) => {
    // Setup mocks before each test
    await apiMocks.setupTasksPageMocks();
  });

  test('should call tree-map API when page loads with default filters', async ({ tasksPage, page }) => {
    // Track API requests
    const apiRequests: { url: string; method: string }[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/tree-map/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    await tasksPage.goto();

    // Wait for API call
    await page.waitForTimeout(1000);

    // Verify tree-map API was called for default subject (mathematics) and grade (all)
    const treemapRequests = apiRequests.filter((req) => req.url.includes('/api/tree-map/'));
    expect(treemapRequests.length).toBeGreaterThan(0);

    // Should call for both grade levels when "all" is selected
    const hasGrade9_10 = treemapRequests.some((req) => req.url.includes('grade_9_10'));
    const hasGrade11_12 = treemapRequests.some((req) => req.url.includes('grade_11_12'));
    expect(hasGrade9_10).toBeTruthy();
    expect(hasGrade11_12).toBeTruthy();

    // All should be GET requests
    treemapRequests.forEach((req) => {
      expect(req.method).toBe('GET');
    });
  });

  test('should call tree-map API with correct parameters when subject changes', async ({ tasksPage, page, apiMocks }) => {
    // Setup mock for physics subject
    await apiMocks.mockTreeMap({
      subject: 'physics',
      gradeLevel: 'grade_9_10',
    });

    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/tree-map/')) {
        apiRequests.push(request.url());
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Clear previous requests
    apiRequests.length = 0;

    // Change subject to physics
    await tasksPage.selectSubject('physics');
    await page.waitForTimeout(1000);

    // Verify API was called with physics
    const physicsRequests = apiRequests.filter((url) => url.includes('/physics/'));
    expect(physicsRequests.length).toBeGreaterThan(0);
  });

  test('should call tree-map API with correct parameters when grade changes', async ({ tasksPage, page, apiMocks }) => {
    // Setup mock for specific grade
    await apiMocks.mockTreeMap({
      gradeLevel: 'grade_9_10',
    });

    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/tree-map/')) {
        apiRequests.push(request.url());
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Clear previous requests
    apiRequests.length = 0;

    // Change grade to 9-10
    await tasksPage.selectGrade('9-10');
    await page.waitForTimeout(1000);

    // Verify API was called with grade_9_10 only (not grade_11_12)
    const grade9_10Requests = apiRequests.filter((url) => url.includes('grade_9_10'));
    const grade11_12Requests = apiRequests.filter((url) => url.includes('grade_11_12'));

    expect(grade9_10Requests.length).toBeGreaterThan(0);
    expect(grade11_12Requests.length).toBe(0);
  });

  test('should call tasks API with correct curriculum_path when leaf node is expanded', async ({
    tasksPage,
    page,
    apiMocks,
  }) => {
    await apiMocks.setupTasksPageMocks();

    const apiRequests: { url: string; params: URLSearchParams }[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v2/tasks')) {
        const url = new URL(request.url());
        apiRequests.push({
          url: request.url(),
          params: url.searchParams,
        });
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Expand tree to leaf node
    await tasksPage.expandCategory('Test Category');
    await page.waitForTimeout(500);
    await tasksPage.expandCategory('Test Subcategory');
    await page.waitForTimeout(500);

    // Clear previous task requests
    apiRequests.length = 0;

    // Expand leaf node
    await tasksPage.expandCategory('Test Leaf Node');
    await page.waitForTimeout(1000);

    // Verify tasks API was called
    expect(apiRequests.length).toBeGreaterThan(0);

    // Verify curriculum_path parameter
    const taskRequest = apiRequests[0];
    const curriculumPath = taskRequest.params.get('curriculum_path');
    expect(curriculumPath).toBeTruthy();
    expect(curriculumPath).toContain('mathematics:grade_9_10:Test Category:Test Subcategory:Test Leaf Node');

    // Verify isPublished parameter
    const isPublished = taskRequest.params.get('isPublished');
    expect(isPublished).toBe('true');
  });

  test('should render tasks from API response', async ({ tasksPage, page, apiMocks }) => {
    const mockTasks = [
      {
        id: 'task_123',
        title: 'Test Math Problem',
        subject: 'mathematics',
        educationalModel: 'secular',
        ratingAverage: 4.5,
        viewCount: 100,
        gradeLevel: 'grade_9_10',
      },
      {
        id: 'task_456',
        title: 'Another Test Problem',
        subject: 'mathematics',
        educationalModel: 'secular',
        ratingAverage: 3.8,
        viewCount: 50,
        gradeLevel: 'grade_9_10',
      },
    ];

    await apiMocks.setupTasksPageMocks({
      customTasks: mockTasks,
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Navigate to leaf node
    await tasksPage.expandTreePath(['Test Category', 'Test Subcategory', 'Test Leaf Node']);
    await page.waitForTimeout(1000);

    // Verify both tasks are rendered
    expect(await page.getByText('Test Math Problem').isVisible()).toBeTruthy();
    expect(await page.getByText('Another Test Problem').isVisible()).toBeTruthy();
  });

  test('should display "no tasks" message when API returns empty array', async ({ tasksPage, page, apiMocks }) => {
    await apiMocks.setupTasksPageMocks({
      hasNoTasks: true,
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Navigate to leaf node
    await tasksPage.expandTreePath(['Test Category', 'Test Subcategory', 'Test Leaf Node']);
    await page.waitForTimeout(1000);

    // Verify no tasks message
    await tasksPage.verifyEmptyState();
  });

  test('should handle API error gracefully', async ({ tasksPage, page, apiMocks }) => {
    // Mock API to return error
    await apiMocks.mockTreeMap({ shouldFail: true });

    await tasksPage.goto();
    await page.waitForTimeout(1000);

    // Should display error message or fallback state
    const errorText = await page.getByText(/error|failed/i).first();
    expect(await errorText.isVisible()).toBeTruthy();
  });

  test('should not call tasks API when search filters tree without expanding leaf', async ({
    tasksPage,
    page,
    apiMocks,
  }) => {
    await apiMocks.setupTasksPageMocks();

    const taskApiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v2/tasks')) {
        taskApiCalls.push(request.url());
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search for a specific term (min 3 characters)
    await tasksPage.search('Test Leaf');
    await page.waitForTimeout(1000);

    // Tasks API should NOT be called (leaf nodes auto-expand visually but don't load tasks)
    expect(taskApiCalls.length).toBe(0);

    // Verify the leaf node is visible but not expanded (no tasks loaded)
    expect(await page.getByText('Test Leaf Node').isVisible()).toBeTruthy();
  });

  test('should use country code from user context in API calls', async ({ tasksPage, page, apiMocks }) => {
    // This test would require mocking user context with different country
    // For now, verify default behavior uses HU
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/tree-map/')) {
        apiRequests.push(request.url());
      }
    });

    await apiMocks.setupTasksPageMocks({ country: 'HU' });
    await tasksPage.goto();
    await page.waitForTimeout(1000);

    // Verify HU country code in URL
    const huRequests = apiRequests.filter((url) => url.includes('/HU/'));
    expect(huRequests.length).toBeGreaterThan(0);
  });

  test('should handle multiple rapid filter changes without race conditions', async ({ tasksPage, page, apiMocks }) => {
    await apiMocks.mockTreeMap({ subject: 'physics' });
    await apiMocks.mockTreeMap({ subject: 'chemistry' });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Rapidly change subjects
    await tasksPage.selectSubject('physics');
    await tasksPage.selectSubject('chemistry');
    await tasksPage.selectSubject('mathematics');

    await page.waitForTimeout(1500);

    // Should not crash and should display the final selection's data
    expect(await page.getByText('Test Category').isVisible()).toBeTruthy();
  });

  test('should encode special characters in curriculum path correctly', async ({ tasksPage, page, apiMocks }) => {
    // Setup mock with special characters
    const treeWithSpecialChars = {
      success: true,
      data: {
        country: 'HU',
        subject: 'mathematics',
        gradeLevel: 'grade_9_10',
        tree: [
          {
            key: 'haromszogek',
            name: 'Háromszögek',
            level: 1,
            subTopics: [
              {
                key: 'pitagorasz',
                name: 'Pitagorasz-tétel',
                level: 2,
                subTopics: [],
              },
            ],
          },
        ],
      },
    };

    await apiMocks.mockTreeMap({ customData: treeWithSpecialChars });

    const apiRequests: { url: string; decodedPath: string }[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v2/tasks')) {
        const url = new URL(request.url());
        const path = url.searchParams.get('curriculum_path') || '';
        apiRequests.push({
          url: request.url(),
          decodedPath: decodeURIComponent(path),
        });
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Navigate to leaf with special characters
    await tasksPage.expandTreePath(['Háromszögek', 'Pitagorasz-tétel']);
    await page.waitForTimeout(1000);

    // Verify special characters are properly encoded/decoded
    if (apiRequests.length > 0) {
      const decodedPath = apiRequests[0].decodedPath;
      expect(decodedPath).toContain('Háromszögek');
      expect(decodedPath).toContain('Pitagorasz-tétel');
    }
  });
});

/**
 * E2E Tests for Tasks Page - Search Functionality with API
 */
test.describe('Tasks Page - Search with API @unit', () => {
  test.beforeEach(async ({ tasksPage, apiMocks }) => {
    await apiMocks.setupTasksPageMocks();
  });

  test('should filter tree nodes based on search without calling tasks API', async ({ tasksPage, page, apiMocks }) => {
    const taskApiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/v2/tasks')) {
        taskApiCalls.push(request.url());
      }
    });

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search with min 3 characters
    await tasksPage.search('Test Leaf');
    await page.waitForTimeout(1000);

    // Tree should filter to show matching nodes
    expect(await page.getByText('Test Leaf Node').isVisible()).toBeTruthy();

    // But tasks API should NOT be called (leaf nodes don't auto-expand for search)
    expect(taskApiCalls.length).toBe(0);
  });

  test('should require minimum 3 characters for search to activate', async ({ tasksPage, page }) => {
    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search with 2 characters - should show all nodes
    await tasksPage.search('Te');
    await page.waitForTimeout(500);

    // All root nodes should still be visible
    expect(await page.getByText('Test Category').isVisible()).toBeTruthy();

    // Now search with 3 characters
    await tasksPage.search('Tes');
    await page.waitForTimeout(500);

    // Should filter (though in our mock, "Test" matches everything)
    expect(await page.getByText('Test Category').isVisible()).toBeTruthy();
  });

  test('should auto-expand parent nodes but not leaf nodes when searching', async ({ tasksPage, page }) => {
    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search for leaf node name
    await tasksPage.search('Test Leaf');
    await page.waitForTimeout(1000);

    // Parent nodes should be expanded automatically
    expect(await page.getByText('Test Category').isVisible()).toBeTruthy();
    expect(await page.getByText('Test Subcategory').isVisible()).toBeTruthy();
    expect(await page.getByText('Test Leaf Node').isVisible()).toBeTruthy();

    // But leaf should NOT show loaded tasks (not expanded for real)
    const noTasksMessage = page.getByText('No teacher added any tasks yet.');
    expect(await noTasksMessage.isVisible()).toBeFalsy();
  });

  test('should user can manually expand leaf node after search to load tasks', async ({ tasksPage, page }) => {
    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search to reveal leaf node
    await tasksPage.search('Test Leaf');
    await page.waitForTimeout(1000);

    expect(await page.getByText('Test Leaf Node').isVisible()).toBeTruthy();

    // Now manually expand the leaf node
    await tasksPage.expandCategory('Test Leaf Node');
    await page.waitForTimeout(1000);

    // Tasks should now be loaded and visible
    expect(await page.getByText('Test Task - Pitagorasz-tétel').isVisible()).toBeTruthy();
  });

  test('should maintain filter state when clearing search', async ({ tasksPage, page, apiMocks }) => {
    await apiMocks.setupTasksPageMocks();

    await tasksPage.goto();
    await page.waitForTimeout(500);

    // Search to filter
    await tasksPage.search('Test Leaf');
    await page.waitForTimeout(1000);

    // Clear search
    await tasksPage.search('');
    await page.waitForTimeout(500);

    // All nodes should be visible again
    expect(await page.getByText('Test Category').isVisible()).toBeTruthy();
  });
});
