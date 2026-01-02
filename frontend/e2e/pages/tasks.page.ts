import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Tasks Page
 * Handles task browsing and selection
 */
export class TasksPage {
  // Filter controls
  readonly subjectFilter: Locator;
  readonly gradeFilter: Locator;
  readonly searchInput: Locator;

  // Tree view elements
  readonly treeTable: Locator;
  readonly expandButtons: Locator;
  readonly categoryRows: Locator;
  readonly taskRows: Locator;

  // Task item elements
  readonly taskTitles: Locator;
  readonly taskRatings: Locator;
  readonly taskViews: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly noTasksMessage: Locator;
  readonly createTaskButton: Locator;

  constructor(private page: Page) {
    // Filters - MUI Select can be found via their hidden input or by finding the combobox near the label
    this.subjectFilter = page.locator('label:has-text("Subject") + div [role="combobox"]').first();
    this.gradeFilter = page.locator('label:has-text("Grade") + div [role="combobox"]').first();
    this.searchInput = page.getByPlaceholder(/search/i);

    // Tree view
    this.treeTable = page.locator('table').or(page.getByRole('table'));
    this.expandButtons = page.locator('button').filter({ has: page.locator('svg[data-testid*="Arrow"]') });
    this.categoryRows = page.locator('tr').filter({ has: page.locator('button') });
    this.taskRows = page.locator('tr').filter({ has: page.getByRole('cell').filter({ hasText: /★|rating/i }) });

    // Task elements
    this.taskTitles = page.locator('tr').filter({ has: page.locator('[class*="taskRow"]') }).locator('td').first();
    this.taskRatings = page.locator('[role="img"][aria-label*="stars"]');
    this.taskViews = page.locator('td').filter({ has: page.locator('svg').filter({ hasText: /visibility/i }) });

    // Empty state
    this.emptyState = page.getByText(/no.*tasks|no teacher added/i);
    this.noTasksMessage = page.getByText(/no teacher added any tasks yet/i);
    this.createTaskButton = page.getByRole('button', { name: /go to task creator/i });
  }

  /**
   * Navigate to tasks page
   */
  async goto() {
    await this.page.goto('/tasks', { waitUntil: 'domcontentloaded' });
    // Wait for the main content to be visible
    await this.page.waitForSelector('h1, h2, [role="main"]', { state: 'visible', timeout: 10000 });
  }

  /**
   * Check if text is visible on the page
   */
  async isTextVisible(text: string): Promise<boolean> {
    return await this.page.getByText(text).isVisible();
  }

  /**
   * Select subject filter
   */
  async selectSubject(subject: 'mathematics' | 'physics' | 'chemistry' | 'biology' | 'geography') {
    await this.subjectFilter.click();
    await this.page.getByRole('option', { name: new RegExp(subject, 'i') }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select grade filter
   */
  async selectGrade(grade: '9-10' | '11-12') {
    await this.gradeFilter.click();
    await this.page.getByRole('option', { name: new RegExp(`grade ${grade}`, 'i') }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Search for tasks
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500);
  }

  /**
   * Expand a category by name
   */
  async expandCategory(categoryName: string) {
    // Find the row with the category name
    const categoryRow = this.page.locator('tr').filter({ hasText: categoryName }).first();
    await expect(categoryRow).toBeVisible({ timeout: 5000 });

    // Click the expand button in that row
    const expandButton = categoryRow.locator('button').first();
    await expandButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate through tree by path
   * Example path: ['Halmazok', 'Halmazműveletek', 'Unió (egyesítés)']
   */
  async expandTreePath(path: string[]) {
    for (const category of path) {
      await this.expandCategory(category);
    }
  }

  /**
   * Get all visible task titles
   */
  async getVisibleTaskTitles(): Promise<string[]> {
    const titleElements = await this.page.locator('tr').filter({
      has: this.page.locator('td').filter({ hasText: /.+/ })
    }).locator('td').first().all();

    const titles: string[] = [];
    for (const elem of titleElements) {
      const text = await elem.textContent();
      if (text && text.trim().length > 0 && !text.includes('-')) {
        titles.push(text.trim());
      }
    }
    return titles;
  }

  /**
   * Verify task list is displayed
   */
  async verifyTasksDisplayed(minCount: number = 1) {
    // Wait for at least one task to be visible
    await expect(this.page.locator('tr').filter({
      has: this.page.locator('td').first()
    })).toHaveCount(minCount, { timeout: 10000 });
  }

  /**
   * Verify specific task is visible by title
   */
  async verifyTaskVisible(title: string) {
    const taskRow = this.page.locator('tr').filter({ hasText: title });
    await expect(taskRow).toBeVisible({ timeout: 5000 });
  }

  /**
   * Click on a task by title
   * This should open the task in a new tab
   */
  async clickTask(title: string): Promise<Page> {
    const taskRow = this.page.locator('tr').filter({ hasText: title }).first();
    await expect(taskRow).toBeVisible({ timeout: 5000 });

    // Wait for new page to open
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      taskRow.click()
    ]);

    await newPage.waitForLoadState('domcontentloaded');
    // Wait for main content to be visible
    await newPage.waitForSelector('h1, h2, main', { state: 'visible', timeout: 10000 });
    return newPage;
  }

  /**
   * Verify empty state message is shown
   */
  async verifyEmptyState() {
    await expect(this.noTasksMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify "Go to Task Creator" button is shown (for teachers)
   */
  async verifyCreateTaskButtonVisible() {
    await expect(this.createTaskButton).toBeVisible();
  }

  /**
   * Complete flow: expand path and verify tasks
   */
  async browseToTasksInCategory(options: {
    subject?: 'mathematics' | 'physics';
    grade?: '9-10' | '11-12';
    path: string[];
  }) {
    if (options.subject) {
      await this.selectSubject(options.subject);
    }

    if (options.grade) {
      await this.selectGrade(options.grade);
    }

    await this.expandTreePath(options.path);
  }
}
