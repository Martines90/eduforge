import { Page, Locator } from '@playwright/test';

/**
 * Page Object for Task Generator page
 * Handles interactions with the task generation flow
 */
export class TaskGeneratorPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly gradeTab910: Locator;
  readonly gradeTab1112: Locator;
  readonly guestBanner: Locator;
  readonly ongoingTaskBanner: Locator;
  readonly generateButton: Locator;
  readonly taskResult: Locator;
  readonly saveButton: Locator;
  readonly closeButton: Locator;
  readonly taskDescription: Locator;
  readonly taskSolution: Locator;
  readonly loginRegisterButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole('heading', { name: /task generator/i });
    this.gradeTab910 = page.getByRole('tab', { name: /grade 9-10/i });
    this.gradeTab1112 = page.getByRole('tab', { name: /grade 11-12/i });
    this.guestBanner = page.locator('div[role="alert"]').filter({ hasText: /free generations remaining/i });
    this.ongoingTaskBanner = page.locator('div[role="alert"]').filter({ hasText: /you have an ongoing task/i });
    this.generateButton = page.getByRole('button', { name: /generate/i });
    this.taskResult = page.locator('[data-testid="task-result"]');
    this.saveButton = page.getByRole('button', { name: /save.*database/i });
    this.closeButton = page.getByRole('button', { name: /close/i });
    this.taskDescription = page.locator('.task-description');
    this.taskSolution = page.locator('.task-solution');
    this.loginRegisterButton = page.getByRole('button', { name: /login.*register/i });
  }

  /**
   * Navigate to task generator page
   */
  async goto() {
    await this.page.goto('/task_generator');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to load
   */
  async waitForPageLoad() {
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  /**
   * Select grade level
   */
  async selectGrade(grade: '9-10' | '11-12') {
    if (grade === '9-10') {
      await this.gradeTab910.click();
    } else {
      await this.gradeTab1112.click();
    }
  }

  /**
   * Select a topic from the cascading selector
   * Simplified version - just clicks through the tree
   */
  async selectTopic() {
    // Wait for the cascading select to be visible
    await this.page.waitForSelector('[data-testid="cascading-select"]', { timeout: 10000 });

    // Click first level
    const firstLevel = this.page.locator('[data-testid="select-level-0"]').first();
    await firstLevel.waitFor({ state: 'visible' });
    await firstLevel.click();

    // Wait a bit for second level to appear
    await this.page.waitForTimeout(500);

    // Click second level if exists
    const secondLevel = this.page.locator('[data-testid="select-level-1"]').first();
    if (await secondLevel.count() > 0) {
      await secondLevel.click();
      await this.page.waitForTimeout(500);
    }

    // Click third level if exists
    const thirdLevel = this.page.locator('[data-testid="select-level-2"]').first();
    if (await thirdLevel.count() > 0) {
      await thirdLevel.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Complete the task configuration form
   */
  async completeTaskConfiguration() {
    // Wait for configuration form
    await this.page.waitForSelector('[data-testid="task-config-form"]', { timeout: 5000 });

    // Select difficulty
    const difficultySelect = this.page.locator('select[name="difficulty"]');
    if (await difficultySelect.count() > 0) {
      await difficultySelect.selectOption('medium');
    }

    // Select target group
    const targetGroupSelect = this.page.locator('select[name="targetGroup"]');
    if (await targetGroupSelect.count() > 0) {
      await targetGroupSelect.selectOption('mixed');
    }

    // Click generate button
    const generateBtn = this.page.getByRole('button', { name: /generate task/i });
    await generateBtn.click();
  }

  /**
   * Wait for task generation to complete
   */
  async waitForTaskGeneration(timeout = 60000) {
    // Wait for loading to disappear
    await this.page.waitForSelector('[data-testid="task-loading"]', { state: 'hidden', timeout });

    // Wait for task result to appear
    await this.taskResult.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get guest generations remaining count
   */
  async getGuestGenerationsRemaining(): Promise<number> {
    const bannerText = await this.guestBanner.textContent();
    const match = bannerText?.match(/(\d+)\/3/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * Check if ongoing task banner is visible
   */
  async hasOngoingTaskBanner(): Promise<boolean> {
    return await this.ongoingTaskBanner.isVisible();
  }

  /**
   * Save task to database
   */
  async saveTaskToDatabase() {
    await this.saveButton.click();
  }

  /**
   * Close task result
   */
  async closeTaskResult() {
    await this.closeButton.click();
  }

  /**
   * Get localStorage value
   */
  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate((k) => localStorage.getItem(k), key);
  }

  /**
   * Set localStorage value
   */
  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(
      ({ k, v }) => localStorage.setItem(k, v),
      { k: key, v: value }
    );
  }

  /**
   * Clear localStorage
   */
  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  /**
   * Check if task exists in localStorage
   */
  async hasUnpublishedTask(): Promise<boolean> {
    const task = await this.getLocalStorageItem('eduforge_last_unpublished_task');
    return task !== null;
  }

  /**
   * Get unpublished task from localStorage
   */
  async getUnpublishedTask(): Promise<any> {
    const taskJson = await this.getLocalStorageItem('eduforge_last_unpublished_task');
    return taskJson ? JSON.parse(taskJson) : null;
  }

  /**
   * Navigate to task generator and generate a task (full flow)
   */
  async generateTaskFullFlow() {
    await this.goto();
    await this.waitForPageLoad();
    await this.selectTopic();
    await this.completeTaskConfiguration();
    await this.waitForTaskGeneration();
  }

  /**
   * Click Login/Register button in header
   */
  async clickLoginRegister() {
    await this.loginRegisterButton.click();
  }
}
