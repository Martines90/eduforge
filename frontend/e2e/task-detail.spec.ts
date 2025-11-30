import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Task Detail Page
 * Covers viewing individual task details including LaTeX rendering
 *
 * Note: These tests require:
 * - Backend running on localhost:3000
 * - At least one published task in the database
 * - The task ID needs to be obtained dynamically or use a known test task
 */
test.describe('Task Detail Page - Task Viewing @integration', () => {
  // Helper to get a task ID from the tasks page
  async function getFirstTaskId(tasksPage: any): Promise<string> {
    await tasksPage.goto();
    await tasksPage.expandTreePath([
      'Halmazok',
      'Halmazműveletek',
      'Unió (egyesítés)'
    ]);

    await tasksPage.verifyTasksDisplayed(1);

    const taskTitles = await tasksPage.getVisibleTaskTitles();
    expect(taskTitles.length).toBeGreaterThan(0);

    const firstTaskTitle = taskTitles[0];
    const newPage = await tasksPage.clickTask(firstTaskTitle);

    // Extract task ID from URL
    const url = newPage.url();
    const taskId = url.split('/tasks/')[1];

    await newPage.close();
    return taskId;
  }

  test('should display task detail page with all information', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get a task ID from tasks page', async () => {
      taskId = await getFirstTaskId(tasksPage);
      expect(taskId).toBeTruthy();
    });

    await test.step('Navigate to task detail page', async () => {
      await taskDetailPage.goto(taskId);
    });

    await test.step('Verify page loaded successfully', async () => {
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Verify task metadata is displayed', async () => {
      await taskDetailPage.verifyTaskMetadata({
        hasGrade: true,
        hasSubject: true,
        hasDifficulty: true,
        hasCreator: true,
      });
    });

    await test.step('Verify task description is displayed', async () => {
      await taskDetailPage.verifyTaskDescription();
    });

    await test.step('Verify action buttons are present', async () => {
      await taskDetailPage.verifyActionButtons();
    });
  });

  test('should display solution in collapsible accordion', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get a task ID and navigate', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Verify solution is collapsed by default', async () => {
      await taskDetailPage.verifySolutionCollapsedByDefault();
    });

    await test.step('Expand solution and verify content', async () => {
      await taskDetailPage.expandSolution();
      await taskDetailPage.verifySolution();
    });
  });

  test('should render LaTeX formulas correctly', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get a task ID and navigate', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Verify LaTeX is rendered in solution', async () => {
      await taskDetailPage.verifyLatexRendered();
    });
  });

  test('should copy share link to clipboard', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get a task ID and navigate', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Click copy share link button', async () => {
      await taskDetailPage.copyShareLink();
    });

    await test.step('Verify success notification appears', async () => {
      // The copyShareLink method already verifies the success snackbar
      // This step is for documentation purposes
      expect(true).toBeTruthy();
    });
  });

  test('should complete full task viewing experience', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Navigate from tasks page to task detail', async () => {
      await tasksPage.goto();
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);

      const taskTitles = await tasksPage.getVisibleTaskTitles();
      const newPage = await tasksPage.clickTask(taskTitles[0]);

      taskId = newPage.url().split('/tasks/')[1];

      // Continue on the new page
      await newPage.waitForLoadState('networkidle');

      // Close original page context and work with new page
      await newPage.close();
    });

    await test.step('View complete task details', async () => {
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyCompleteTask({
        hasSolution: true,
        hasLatex: true,
      });
    });
  });
});

/**
 * Task Detail Page - Navigation Tests
 */
test.describe('Task Detail Page - Navigation @integration', () => {
  async function getFirstTaskId(tasksPage: any): Promise<string> {
    await tasksPage.goto();
    await tasksPage.expandTreePath([
      'Halmazok',
      'Halmazműveletek',
      'Unió (egyesítés)'
    ]);

    const taskTitles = await tasksPage.getVisibleTaskTitles();
    const newPage = await tasksPage.clickTask(taskTitles[0]);
    const taskId = newPage.url().split('/tasks/')[1];
    await newPage.close();
    return taskId;
  }

  test('should navigate back to tasks page', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Navigate to task detail', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Click back button', async () => {
      await taskDetailPage.goBack();
    });

    await test.step('Verify returned to tasks page', async () => {
      expect(taskDetailPage.page.url()).toContain('/tasks');
    });
  });
});

/**
 * Task Detail Page - Error Handling
 */
test.describe('Task Detail Page - Error Handling @integration', () => {
  test('should handle non-existent task gracefully', async ({ taskDetailPage }) => {
    await test.step('Navigate to non-existent task', async () => {
      await taskDetailPage.goto('non-existent-task-id-12345');
    });

    await test.step('Verify error message is displayed', async () => {
      // Wait for error state to appear
      await expect(taskDetailPage.errorAlert).toBeVisible({ timeout: 10000 });
    });
  });
});

/**
 * Task Detail Page - Mobile View
 */
test.describe('Task Detail Page - Mobile @integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  async function getFirstTaskId(tasksPage: any): Promise<string> {
    await tasksPage.goto();
    await tasksPage.expandTreePath([
      'Halmazok',
      'Halmazműveletek',
      'Unió (egyesítés)'
    ]);

    const taskTitles = await tasksPage.getVisibleTaskTitles();
    const newPage = await tasksPage.clickTask(taskTitles[0]);
    const taskId = newPage.url().split('/tasks/')[1];
    await newPage.close();
    return taskId;
  }

  test('should display task correctly on mobile', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get task ID and navigate', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
    });

    await test.step('Verify mobile layout', async () => {
      await taskDetailPage.verifyPageLoaded();
      await taskDetailPage.verifyTaskDescription();
      await taskDetailPage.verifyActionButtons();
    });

    await test.step('Verify solution accordion works on mobile', async () => {
      await taskDetailPage.verifySolutionCollapsedByDefault();
      await taskDetailPage.expandSolution();
      await taskDetailPage.verifySolution();
    });
  });

  test('should render LaTeX on mobile devices', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Navigate to task on mobile', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Verify LaTeX renders on mobile', async () => {
      await taskDetailPage.verifyLatexRendered();
    });
  });
});

/**
 * Task Detail Page - Performance
 */
test.describe('Task Detail Page - Performance @integration', () => {
  async function getFirstTaskId(tasksPage: any): Promise<string> {
    await tasksPage.goto();
    await tasksPage.expandTreePath([
      'Halmazok',
      'Halmazműveletek',
      'Unió (egyesítés)'
    ]);

    const taskTitles = await tasksPage.getVisibleTaskTitles();
    const newPage = await tasksPage.clickTask(taskTitles[0]);
    const taskId = newPage.url().split('/tasks/')[1];
    await newPage.close();
    return taskId;
  }

  test('should load task detail page within acceptable time', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Get task ID', async () => {
      taskId = await getFirstTaskId(tasksPage);
    });

    await test.step('Measure page load time', async () => {
      const startTime = Date.now();

      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();

      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test('should render LaTeX within acceptable time', async ({ tasksPage, taskDetailPage }) => {
    let taskId: string;

    await test.step('Navigate to task', async () => {
      taskId = await getFirstTaskId(tasksPage);
      await taskDetailPage.goto(taskId);
      await taskDetailPage.verifyPageLoaded();
    });

    await test.step('Measure LaTeX rendering time', async () => {
      const startTime = Date.now();

      await taskDetailPage.expandSolution();
      await taskDetailPage.verifyLatexRendered();

      const renderTime = Date.now() - startTime;

      // LaTeX should render within 3 seconds
      expect(renderTime).toBeLessThan(3000);
    });
  });
});
