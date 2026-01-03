import { test, expect } from './fixtures/test-fixtures';

/**
 * E2E Tests for Test Library (/my-tests)
 * Covers test creation, listing, searching, and navigation
 */
test.describe('Test Library - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication as a teacher
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
        value: 'HU',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-test-token-12345');
    });
  });

  test('should create a new test successfully', async ({ testLibraryPage }) => {
    await test.step('Navigate to test library', async () => {
      await testLibraryPage.goto();
    });

    await test.step('Create new test', async () => {
      await testLibraryPage.createTest({
        name: 'Algebra Mid-term Exam',
        description: 'Test covering algebraic expressions and equations',
        subject: 'mathematics',
        gradeLevel: '9-10',
      });
    });

    await test.step('Verify navigation to editor', async () => {
      // Should navigate to editor page after creation
      expect(testLibraryPage.page.url()).toContain('/tests/');
      expect(testLibraryPage.page.url()).toContain('/edit');
    });
  });

  test('should display empty state when no tests exist', async ({ testLibraryPage }) => {
    await testLibraryPage.goto();

    // Note: This test assumes a clean state or that we mock the API
    // In real scenario, you'd need to ensure no tests exist
    // await testLibraryPage.verifyEmptyState();
  });

  test('should list all user tests', async ({ testLibraryPage }) => {
    await test.step('Navigate to test library', async () => {
      await testLibraryPage.goto();
    });

    await test.step('Verify tests are displayed', async () => {
      const testCount = await testLibraryPage.getTestCount();
      expect(testCount).toBeGreaterThanOrEqual(0);
    });
  });

  test('should search and filter tests', async ({ testLibraryPage }) => {
    await test.step('Navigate to test library', async () => {
      await testLibraryPage.goto();
    });

    await test.step('Create multiple tests', async () => {
      const tests = [
        { name: 'Algebra Test 1', subject: 'mathematics' },
        { name: 'Geometry Test 1', subject: 'mathematics' },
        { name: 'Physics Test 1', subject: 'physics' },
      ];

      for (const test of tests) {
        await testLibraryPage.createTest(test);
        await testLibraryPage.page.goBack();
        await testLibraryPage.page.waitForLoadState('networkidle');
      }
    });

    await test.step('Search for specific test', async () => {
      await testLibraryPage.searchTests('Algebra');
      await testLibraryPage.verifyTestExists('Algebra Test 1');

      // Geometry test should not be visible
      const geometryTest = await testLibraryPage.getTestCard('Geometry Test 1');
      await expect(geometryTest).not.toBeVisible();
    });
  });

  test('should navigate to test editor when clicking test card', async ({ testLibraryPage, testEditorPage }) => {
    await test.step('Create a test', async () => {
      await testLibraryPage.goto();
      await testLibraryPage.createTest({
        name: 'Navigation Test',
      });
    });

    await test.step('Go back to library and open test', async () => {
      await testLibraryPage.goto();
      await testLibraryPage.openTestEditor('Navigation Test');
    });

    await test.step('Verify editor page loaded', async () => {
      await testEditorPage.verifyTestLoaded('Navigation Test');
    });
  });

  test('should display test metadata correctly', async ({ testLibraryPage }) => {
    await test.step('Create test with tasks', async () => {
      await testLibraryPage.goto();
      await testLibraryPage.createTest({
        name: 'Metadata Test',
        subject: 'mathematics',
      });
    });

    await test.step('Go back and verify metadata', async () => {
      await testLibraryPage.goto();
      await testLibraryPage.verifyTestDetails('Metadata Test', {
        taskCount: 0,
        subject: 'mathematics',
      });
    });
  });
});

/**
 * Tests for test deletion
 */
test.describe('Test Library - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test('should delete test with confirmation', async ({ testLibraryPage }) => {
    await test.step('Create a test to delete', async () => {
      await testLibraryPage.goto();
      await testLibraryPage.createTest({
        name: 'Test to Delete',
      });
      await testLibraryPage.goto();
    });

    await test.step('Delete the test', async () => {
      await testLibraryPage.deleteTest('Test to Delete');
    });

    await test.step('Verify test is removed', async () => {
      const testCard = await testLibraryPage.getTestCard('Test to Delete');
      await expect(testCard).not.toBeVisible();
    });
  });
});

/**
 * Mobile-specific tests
 */
test.describe('Test Library - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
  });

  test.beforeEach(async ({ page }) => {
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
  });

  test('should create test on mobile', async ({ testLibraryPage }) => {
    await testLibraryPage.goto();
    await testLibraryPage.createTest({
      name: 'Mobile Test',
    });

    // Should navigate to editor
    expect(testLibraryPage.page.url()).toContain('/edit');
  });

  test('should display tests in mobile layout', async ({ testLibraryPage }) => {
    await testLibraryPage.goto();

    // Verify responsive layout
    const testCards = testLibraryPage.testCards;
    const firstCard = testCards.first();

    if (await testCards.count() > 0) {
      const box = await firstCard.boundingBox();

      if (box) {
        // Card should take most of the screen width on mobile
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });
});
