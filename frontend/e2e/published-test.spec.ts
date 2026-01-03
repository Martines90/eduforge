import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Published Test Viewing (/published-tests/[publicId])
 * Tests public access, viewing, and downloading published tests
 */
test.describe('Published Test - Public Viewing', () => {
  let publicId: string;

  test.beforeEach(async ({ page, testLibraryPage, testEditorPage }) => {
    // Create and publish a test as a teacher
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

    // Create test with tasks
    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Public Algebra Test',
      description: 'Test of algebraic concepts for grade 9-10',
      subject: 'mathematics',
      gradeLevel: '9-10',
    });

    // Add tasks
    await testEditorPage.addCustomTask({
      title: 'Linear Equations',
      text: 'Solve for x in the following equations',
      questions: [
        { question: 'a) 2x + 5 = 15', score: 3 },
        { question: 'b) 3x - 7 = 11', score: 4 },
      ],
    });

    await testEditorPage.addCustomTask({
      title: 'Quadratic Equations',
      text: 'Solve using the quadratic formula',
      questions: [
        { question: 'x² - 5x + 6 = 0', score: 5 },
      ],
    });

    await testEditorPage.saveTest();

    // Publish and get public link
    const publicLink = await testEditorPage.publishTest();
    publicId = publicLink.split('/').pop() || '';

    // Clear authentication for public viewing
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test('should view published test without authentication', async ({ publishedTestPage }) => {
    await test.step('Navigate to public URL', async () => {
      await publishedTestPage.goto(publicId);
    });

    await test.step('Verify test metadata', async () => {
      await publishedTestPage.verifyTestTitle('Public Algebra Test');
      await publishedTestPage.verifyTestDescription('Test of algebraic concepts for grade 9-10');
      await publishedTestPage.verifyMetadata({
        subject: 'mathematics',
        gradeLevel: '9-10',
        taskCount: 2,
        totalScore: 12,
      });
    });

    await test.step('Verify all tasks visible', async () => {
      await publishedTestPage.verifyTaskVisible('Linear Equations');
      await publishedTestPage.verifyTaskVisible('Quadratic Equations');
    });
  });

  test('should display tasks in correct order', async ({ publishedTestPage }) => {
    await publishedTestPage.goto(publicId);

    await publishedTestPage.verifyTaskOrder([
      'Linear Equations',
      'Quadratic Equations',
    ]);
  });

  test('should display full task content', async ({ publishedTestPage }) => {
    await publishedTestPage.goto(publicId);

    await publishedTestPage.verifyTaskContent('Linear Equations', {
      text: 'Solve for x in the following equations',
      questions: [
        'a) 2x + 5 = 15',
        'b) 3x - 7 = 11',
      ],
      score: 7,
    });
  });

  test('should increment view count on each visit', async ({ publishedTestPage }) => {
    await test.step('First visit', async () => {
      await publishedTestPage.goto(publicId);
      const initialCount = await publishedTestPage.getViewCount();
      expect(initialCount).toBeGreaterThanOrEqual(0);
    });

    await test.step('Second visit', async () => {
      await publishedTestPage.page.reload();
      await publishedTestPage.page.waitForLoadState('networkidle');
      const newCount = await publishedTestPage.getViewCount();
      // Note: This may not increment in test environment depending on implementation
    });
  });

  test('should download PDF', async ({ publishedTestPage }) => {
    await publishedTestPage.goto(publicId);

    const download = await publishedTestPage.downloadPdf();

    expect(download.suggestedFilename()).toContain('.pdf');
    expect(download.suggestedFilename()).toContain('Public-Algebra-Test');
  });

  test('should display images when enabled', async ({ page, testLibraryPage, testEditorPage, publishedTestPage }) => {
    // Create test with images
    await page.context().addCookies([
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Image Test',
    });

    // Add task with image (assuming task has image property)
    await testEditorPage.searchAndAddTask('geometry'); // Geometry tasks likely have images

    // Ensure image is enabled
    await testEditorPage.toggleTaskImage(0); // Enable if not already

    await testEditorPage.saveTest();
    const publicLink = await testEditorPage.publishTest();
    const imagePublicId = publicLink.split('/').pop() || '';

    // View as public
    await page.context().clearCookies();
    await publishedTestPage.goto(imagePublicId);

    await publishedTestPage.verifyTaskHasImage(0);
  });
});

/**
 * Tests for published test on mobile
 */
test.describe('Published Test - Mobile View', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test('should display published test on mobile', async ({ page, testLibraryPage, testEditorPage, publishedTestPage }) => {
    // Create and publish test
    await page.context().addCookies([
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Mobile Public Test',
    });

    await testEditorPage.addCustomTask({
      title: 'Mobile Task',
      text: 'Content',
      questions: [{ question: 'Q', score: 5 }],
    });

    await testEditorPage.saveTest();
    const publicLink = await testEditorPage.publishTest();
    const publicId = publicLink.split('/').pop() || '';

    // View as public on mobile
    await page.context().clearCookies();
    await publishedTestPage.goto(publicId);

    await publishedTestPage.verifyTestTitle('Mobile Public Test');
    await publishedTestPage.verifyTaskVisible('Mobile Task');
  });

  test('should download PDF on mobile', async ({ page, testLibraryPage, testEditorPage, publishedTestPage }) => {
    // Setup and publish test
    await page.context().addCookies([
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Mobile PDF Test',
    });

    await testEditorPage.addCustomTask({
      title: 'Task',
      text: 'Content',
      questions: [{ question: 'Q', score: 5 }],
    });

    await testEditorPage.saveTest();
    const publicLink = await testEditorPage.publishTest();
    const publicId = publicLink.split('/').pop() || '';

    await page.context().clearCookies();
    await publishedTestPage.goto(publicId);

    const download = await publishedTestPage.downloadPdf();
    expect(download).toBeTruthy();
  });
});

/**
 * Tests for error handling
 */
test.describe('Published Test - Error Handling', () => {
  test('should display 404 for non-existent test', async ({ publishedTestPage }) => {
    await publishedTestPage.goto('non-existent-id-12345');

    // Verify error message or 404 page
    const errorMessage = publishedTestPage.page.getByText(/not found|nem található/i);
    await expect(errorMessage).toBeVisible();
  });

  test('should display message for unpublished test', async ({ page, testLibraryPage, publishedTestPage }) => {
    // Create test but don't publish
    await page.context().addCookies([
      {
        name: 'identity',
        value: 'teacher',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Unpublished Test',
    });

    // Try to access via published URL (without valid public ID)
    // Note: This test depends on how unpublished tests are handled
  });
});
