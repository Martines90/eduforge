import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Task Creator/Generator
 * Covers the complete happy path from topic selection to task generation
 *
 * Note: These tests require the backend to be running on localhost:3000
 * and have proper API mocking or test data available
 *
 * @integration - These tests require real backend services and actual task generation
 */
test.describe('Task Creator - Task Generation Flow @integration', () => {
  test.beforeEach(async ({ page, taskCreatorPage }) => {
    // Set up authentication cookies/localStorage to simulate logged-in teacher
    await page.context().addCookies([
      {
        name: 'is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'role',
        value: 'registered',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'country',
        value: 'US',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'subject',
        value: 'mathematics',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // Set localStorage auth token
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-test-token-12345');
    });

    await taskCreatorPage.goto();
  });

  test('should generate a task successfully (happy path)', async ({ taskCreatorPage }) => {
    await test.step('Select grade and navigate to topic', async () => {
      // Select Grade 9-10
      await taskCreatorPage.selectGrade('9-10');

      // Navigate through curriculum tree
      await taskCreatorPage.selectTopicByPath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Wait for task to generate automatically', async () => {
      // Task generation should start automatically after topic selection
      await taskCreatorPage.waitForTaskGeneration(120000); // 2 minute timeout
    });

    await test.step('Verify generated task content', async () => {
      // Verify task description is displayed
      await taskCreatorPage.verifyTaskDisplayed();

      // Verify solution is displayed
      await taskCreatorPage.verifySolutionDisplayed();
    });

    await test.step('Save task to database', async () => {
      // Click save button
      await taskCreatorPage.saveTask();

      // Verify success modal appears
      await taskCreatorPage.verifySuccessModal();

      // Verify share link is present
      const shareLink = await taskCreatorPage.getShareLink();
      expect(shareLink).toContain('/tasks/');
    });
  });

  test('should handle different grade levels', async ({ taskCreatorPage }) => {
    await test.step('Generate task for Grade 11-12', async () => {
      // Select Grade 11-12
      await taskCreatorPage.selectGrade('11-12');

      // Navigate to a topic (assuming similar structure)
      // Note: Adjust path based on actual Grade 11-12 curriculum
      await taskCreatorPage.selectTopicByPath([
        'Halmazok',
        'Halmazműveletek',
        'Metszet'
      ]);

      // Wait for task generation
      await taskCreatorPage.waitForTaskGeneration(120000);

      // Verify task is displayed
      await taskCreatorPage.verifyTaskDisplayed();
    });
  });

  test('should handle task configuration options', async ({ taskCreatorPage }) => {
    await test.step('Select topic', async () => {
      await taskCreatorPage.selectGrade('9-10');
      await taskCreatorPage.selectTopicByPath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Configure task settings before generation', async () => {
      // Note: Configuration might need to happen before automatic generation
      // This test may need adjustment based on actual UI behavior
      await taskCreatorPage.configureTask({
        difficulty: 'easy',
        targetGroup: 'mixed',
        numberOfImages: 0,
      });
    });

    await test.step('Wait for task generation', async () => {
      await taskCreatorPage.waitForTaskGeneration(120000);
      await taskCreatorPage.verifyTaskDisplayed();
    });
  });
});

/**
 * Mobile-specific tests for Task Creator
 * @integration
 */
test.describe('Task Creator - Mobile @integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should generate task on mobile device', async ({ page, taskCreatorPage }) => {
    // Set up authentication cookies/localStorage
    await page.context().addCookies([
      {
        name: 'is_registered',
        value: 'true',
        domain: 'localhost',
        path: '/',
      },
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-test-token-12345');
    });

    await taskCreatorPage.goto();

    await test.step('Navigate on mobile', async () => {
      await taskCreatorPage.selectGrade('9-10');

      // On mobile, cascading select should still work
      await taskCreatorPage.selectTopicByPath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Wait for generation and verify', async () => {
      await taskCreatorPage.waitForTaskGeneration(120000);
      await taskCreatorPage.verifyTaskDisplayed();
    });
  });
});
