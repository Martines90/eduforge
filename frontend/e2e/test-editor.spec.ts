import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Test Editor (/tests/[id]/edit)
 * Covers adding tasks, drag-and-drop reordering, custom tasks, and publishing
 */
test.describe('Test Editor - Task Management', () => {
  let testId: string;

  test.beforeEach(async ({ page, testLibraryPage }) => {
    // Set up authentication
    await page.context().addCookies([
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

    // Create a test for each test case
    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Test Management Test',
      subject: 'mathematics',
    });

    // Extract test ID from URL
    const url = page.url();
    const match = url.match(/\/tests\/([^\/]+)\/edit/);
    testId = match ? match[1] : '';
  });

  test('should add existing task to test', async ({ testEditorPage }) => {
    await test.step('Verify editor loaded', async () => {
      await testEditorPage.verifyTestLoaded('Test Management Test');
      await testEditorPage.verifyEmptyState();
    });

    await test.step('Search and add task', async () => {
      await testEditorPage.searchAndAddTask('algebra', 'Algebraic expressions');
    });

    await test.step('Verify task added', async () => {
      const taskCount = await testEditorPage.getTaskCount();
      expect(taskCount).toBe(1);
    });

    await test.step('Save test', async () => {
      await testEditorPage.saveTest();
    });
  });

  test('should add custom task', async ({ testEditorPage }) => {
    await test.step('Add custom task', async () => {
      await testEditorPage.addCustomTask({
        title: 'Custom Algebra Problem',
        text: 'Solve the following equation for x',
        questions: [
          { question: 'a) 2x + 5 = 15', score: 3 },
          { question: 'b) 3x - 7 = 11', score: 4 },
        ],
      });
    });

    await test.step('Verify custom task added', async () => {
      await testEditorPage.verifyTaskAtIndex(0, 'Custom Algebra Problem');
      const totalScore = await testEditorPage.getTotalScore();
      expect(totalScore).toBe(7);
    });

    await test.step('Save test', async () => {
      await testEditorPage.saveTest();
    });
  });

  test('should add multiple tasks', async ({ testEditorPage }) => {
    const taskTitles = [
      'Task 1: Linear Equations',
      'Task 2: Quadratic Equations',
      'Task 3: Systems of Equations',
    ];

    await test.step('Add multiple tasks', async () => {
      for (const title of taskTitles) {
        await testEditorPage.searchAndAddTask('equation', title);
      }
    });

    await test.step('Verify all tasks added', async () => {
      const taskCount = await testEditorPage.getTaskCount();
      expect(taskCount).toBe(3);
    });

    await test.step('Verify task order', async () => {
      await testEditorPage.verifyTaskOrder(taskTitles);
    });
  });

  test('should remove task from test', async ({ testEditorPage }) => {
    await test.step('Add tasks', async () => {
      await testEditorPage.searchAndAddTask('algebra');
      await testEditorPage.searchAndAddTask('geometry');
    });

    await test.step('Remove first task', async () => {
      await testEditorPage.removeTask(0);
    });

    await test.step('Verify task removed', async () => {
      const taskCount = await testEditorPage.getTaskCount();
      expect(taskCount).toBe(1);
    });
  });
});

/**
 * Tests for drag-and-drop reordering
 */
test.describe('Test Editor - Drag and Drop Reordering', () => {
  test.beforeEach(async ({ page, testLibraryPage }) => {
    await page.context().addCookies([
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

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Reorder Test',
    });
  });

  test('should reorder tasks via drag and drop', async ({ testEditorPage }) => {
    const initialOrder = ['Task A', 'Task B', 'Task C'];

    await test.step('Add tasks in order', async () => {
      for (const title of initialOrder) {
        await testEditorPage.addCustomTask({
          title,
          text: `Content for ${title}`,
          questions: [{ question: 'Question 1', score: 5 }],
        });
      }

      await testEditorPage.verifyTaskOrder(initialOrder);
    });

    await test.step('Reorder: Move Task A to position 2', async () => {
      await testEditorPage.reorderTask(0, 2);
    });

    await test.step('Verify new order', async () => {
      const newOrder = ['Task B', 'Task C', 'Task A'];
      await testEditorPage.verifyTaskOrder(newOrder);
    });

    await test.step('Save and reload', async () => {
      await testEditorPage.saveTest();
      await testEditorPage.page.reload();
      await testEditorPage.page.waitForLoadState('networkidle');

      // Verify order persists
      const persistedOrder = ['Task B', 'Task C', 'Task A'];
      await testEditorPage.verifyTaskOrder(persistedOrder);
    });
  });

  test('should handle multiple reorders', async ({ testEditorPage }) => {
    await test.step('Add 5 tasks', async () => {
      for (let i = 1; i <= 5; i++) {
        await testEditorPage.addCustomTask({
          title: `Task ${i}`,
          text: `Content ${i}`,
          questions: [{ question: 'Q', score: 1 }],
        });
      }
    });

    await test.step('Perform multiple reorders', async () => {
      await testEditorPage.reorderTask(0, 4); // Task 1 to end
      await testEditorPage.reorderTask(3, 0); // Task 5 to start
    });

    await test.step('Save test', async () => {
      await testEditorPage.saveTest();
    });
  });
});

/**
 * Tests for task customization
 */
test.describe('Test Editor - Task Customization', () => {
  test.beforeEach(async ({ page, testLibraryPage }) => {
    await page.context().addCookies([
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

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Customization Test',
    });
  });

  test('should override task title and text', async ({ testEditorPage }) => {
    await test.step('Add task', async () => {
      await testEditorPage.searchAndAddTask('algebra');
    });

    await test.step('Override content', async () => {
      await testEditorPage.overrideTaskContent(0, {
        title: 'Modified Title',
        text: 'Modified text for this specific test',
      });
    });

    await test.step('Verify overrides', async () => {
      await testEditorPage.verifyTaskAtIndex(0, 'Modified Title');
    });

    await test.step('Save test', async () => {
      await testEditorPage.saveTest();
    });
  });

  test('should edit task scores', async ({ testEditorPage }) => {
    await test.step('Add custom task with default scores', async () => {
      await testEditorPage.addCustomTask({
        title: 'Score Test',
        text: 'Test content',
        questions: [
          { question: 'Q1', score: 5 },
          { question: 'Q2', score: 5 },
        ],
      });

      const initialScore = await testEditorPage.getTotalScore();
      expect(initialScore).toBe(10);
    });

    await test.step('Edit score', async () => {
      await testEditorPage.editTaskScore(0, 20);
    });

    await test.step('Verify new total score', async () => {
      const newScore = await testEditorPage.getTotalScore();
      expect(newScore).toBe(20);
    });
  });

  test('should toggle task image visibility', async ({ testEditorPage }) => {
    await test.step('Add task with image', async () => {
      await testEditorPage.searchAndAddTask('geometry'); // Assuming has image
    });

    await test.step('Toggle image off', async () => {
      await testEditorPage.toggleTaskImage(0);
    });

    await test.step('Save and verify', async () => {
      await testEditorPage.saveTest();
    });
  });
});

/**
 * Tests for test publishing
 */
test.describe('Test Editor - Publishing', () => {
  test.beforeEach(async ({ page, testLibraryPage }) => {
    await page.context().addCookies([
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

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Publishing Test',
      description: 'Test for publishing flow',
      subject: 'mathematics',
      gradeLevel: '9-10',
    });
  });

  test('should publish test and get public link', async ({ testEditorPage, publishedTestPage }) => {
    let publicLink: string;

    await test.step('Add tasks to test', async () => {
      await testEditorPage.addCustomTask({
        title: 'Task 1',
        text: 'Task content',
        questions: [{ question: 'Q1', score: 10 }],
      });
      await testEditorPage.saveTest();
    });

    await test.step('Publish test', async () => {
      publicLink = await testEditorPage.publishTest();
      expect(publicLink).toContain('/published-tests/');
    });

    await test.step('Visit public link', async () => {
      const publicId = publicLink.split('/').pop() || '';
      await publishedTestPage.goto(publicId);
    });

    await test.step('Verify published test content', async () => {
      await publishedTestPage.verifyTestTitle('Publishing Test');
      await publishedTestPage.verifyTestDescription('Test for publishing flow');
      await publishedTestPage.verifyMetadata({
        subject: 'mathematics',
        gradeLevel: '9-10',
        taskCount: 1,
        totalScore: 10,
      });
      await publishedTestPage.verifyTaskVisible('Task 1');
    });
  });

  test('should generate PDF', async ({ testEditorPage }) => {
    await test.step('Add tasks', async () => {
      await testEditorPage.addCustomTask({
        title: 'PDF Test Task',
        text: 'Content for PDF',
        questions: [{ question: 'Question', score: 5 }],
      });
      await testEditorPage.saveTest();
    });

    await test.step('Generate PDF', async () => {
      await testEditorPage.generatePdf();
    });

    // Note: Actual PDF download verification would need additional setup
  });

  test('should update published test', async ({ testEditorPage }) => {
    await test.step('Add task and publish', async () => {
      await testEditorPage.addCustomTask({
        title: 'Original Task',
        text: 'Original content',
        questions: [{ question: 'Q', score: 5 }],
      });
      await testEditorPage.saveTest();
      await testEditorPage.publishTest();
    });

    await test.step('Add another task', async () => {
      await testEditorPage.addCustomTask({
        title: 'Additional Task',
        text: 'New content',
        questions: [{ question: 'Q2', score: 5 }],
      });
      await testEditorPage.saveTest();
    });

    await test.step('Republish', async () => {
      await testEditorPage.publishTest();
    });

    await test.step('Verify task count updated', async () => {
      const taskCount = await testEditorPage.getTaskCount();
      expect(taskCount).toBe(2);
    });
  });
});

/**
 * Mobile-specific tests
 */
test.describe('Test Editor - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test.beforeEach(async ({ page, testLibraryPage }) => {
    await page.context().addCookies([
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

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Mobile Editor Test',
    });
  });

  test('should add tasks on mobile', async ({ testEditorPage }) => {
    await testEditorPage.addCustomTask({
      title: 'Mobile Task',
      text: 'Mobile content',
      questions: [{ question: 'Q', score: 5 }],
    });

    const taskCount = await testEditorPage.getTaskCount();
    expect(taskCount).toBe(1);
  });

  test('should save and publish on mobile', async ({ testEditorPage }) => {
    await testEditorPage.addCustomTask({
      title: 'Mobile Task',
      text: 'Content',
      questions: [{ question: 'Q', score: 5 }],
    });

    await testEditorPage.saveTest();
    const publicLink = await testEditorPage.publishTest();
    expect(publicLink).toContain('/published-tests/');
  });
});
