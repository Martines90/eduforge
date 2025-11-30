import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Tasks Page
 * Covers task browsing, tree navigation, and task selection
 *
 * Note: These tests require the backend to be running on localhost:3000
 * and have at least one published task in the database
 *
 * @integration - These tests require real tasks in the database
 */
test.describe('Tasks Page - Task Browsing @integration', () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
  });

  test('should display tasks tree and expand to view tasks', async ({ tasksPage }) => {
    await test.step('Navigate through tree structure', async () => {
      // Expand the tree to a leaf node with tasks
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Verify tasks are displayed', async () => {
      // Verify at least one task is visible after expanding
      await tasksPage.verifyTasksDisplayed(1);
    });

    await test.step('Verify task has required information', async () => {
      // Get visible tasks
      const taskTitles = await tasksPage.getVisibleTaskTitles();

      // Should have at least one task
      expect(taskTitles.length).toBeGreaterThan(0);

      // Task titles should not be empty
      taskTitles.forEach(title => {
        expect(title.length).toBeGreaterThan(0);
      });
    });
  });

  test('should filter tasks by subject', async ({ tasksPage }) => {
    await test.step('Select subject filter', async () => {
      await tasksPage.selectSubject('mathematics');
    });

    await test.step('Navigate to tasks', async () => {
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Verify filtered tasks displayed', async () => {
      await tasksPage.verifyTasksDisplayed(1);
    });
  });

  test('should filter tasks by grade level', async ({ tasksPage }) => {
    await test.step('Select grade filter', async () => {
      await tasksPage.selectGrade('9-10');
    });

    await test.step('Navigate to tasks', async () => {
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Verify filtered tasks displayed', async () => {
      await tasksPage.verifyTasksDisplayed(1);
    });
  });

  test('should open task in new tab when clicked', async ({ tasksPage, page, context }) => {
    await test.step('Navigate to tasks', async () => {
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
      await tasksPage.verifyTasksDisplayed(1);
    });

    await test.step('Click on task and verify new tab opens', async () => {
      // Get the first task title
      const taskTitles = await tasksPage.getVisibleTaskTitles();
      expect(taskTitles.length).toBeGreaterThan(0);

      const firstTaskTitle = taskTitles[0];

      // Click task and get the new page
      const newPage = await tasksPage.clickTask(firstTaskTitle);

      // Verify new tab opened with correct URL pattern
      expect(newPage.url()).toContain('/tasks/');

      // Verify the new page is different from the original
      expect(newPage).not.toBe(page);

      // Clean up - close the new tab
      await newPage.close();
    });
  });

  test('should complete full task browsing flow', async ({ tasksPage }) => {
    await test.step('Browse to tasks using helper method', async () => {
      await tasksPage.browseToTasksInCategory({
        subject: 'mathematics',
        grade: '9-10',
        path: [
          'Halmazok',
          'Halmazműveletek',
          'Unió (egyesítés)'
        ]
      });
    });

    await test.step('Verify tasks displayed', async () => {
      await tasksPage.verifyTasksDisplayed(1);

      const taskTitles = await tasksPage.getVisibleTaskTitles();
      expect(taskTitles.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Edge case tests for Tasks Page
 * @integration
 */
test.describe('Tasks Page - Edge Cases @integration', () => {
  test.beforeEach(async ({ tasksPage }) => {
    await tasksPage.goto();
  });

  test('should handle empty state gracefully', async ({ tasksPage }) => {
    // Note: This test assumes there's a way to trigger empty state
    // May need to be adjusted based on actual implementation

    await test.step('Select filters that return no results', async () => {
      await tasksPage.selectSubject('biology');
      await tasksPage.selectGrade('11-12');
    });

    // If no tasks available, should show empty state or no results
    // This is a placeholder - adjust based on your UI behavior
  });

  test('should maintain expanded state when navigating back', async ({ tasksPage }) => {
    await test.step('Expand tree structure', async () => {
      await tasksPage.expandCategory('Halmazok');
    });

    await test.step('Verify category remains expanded', async () => {
      // The category should still be visible with its children
      const halmazmuveletekVisible = await tasksPage.page
        .getByText('Halmazműveletek')
        .isVisible();

      expect(halmazmuveletekVisible).toBeTruthy();
    });
  });
});

/**
 * Mobile-specific tests for Tasks Page
 * @integration
 */
test.describe('Tasks Page - Mobile @integration', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should browse and select tasks on mobile', async ({ tasksPage }) => {
    await tasksPage.goto();

    await test.step('Navigate tree on mobile', async () => {
      await tasksPage.expandTreePath([
        'Halmazok',
        'Halmazműveletek',
        'Unió (egyesítés)'
      ]);
    });

    await test.step('Verify tasks displayed on mobile', async () => {
      await tasksPage.verifyTasksDisplayed(1);
    });

    await test.step('Verify task interaction works on mobile', async () => {
      const taskTitles = await tasksPage.getVisibleTaskTitles();
      expect(taskTitles.length).toBeGreaterThan(0);
    });
  });
});
