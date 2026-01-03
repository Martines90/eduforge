import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Published Test page (/published-tests/[publicId])
 * Handles viewing and downloading published tests
 */
export class PublishedTestPage {
  readonly page: Page;
  readonly testTitle: Locator;
  readonly testDescription: Locator;
  readonly testMetadata: Locator;
  readonly taskList: Locator;
  readonly downloadPdfButton: Locator;
  readonly printButton: Locator;
  readonly viewCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.testTitle = page.locator('h1');
    this.testDescription = page.locator('[data-testid="test-description"]');
    this.testMetadata = page.locator('[data-testid="test-metadata"]');
    this.taskList = page.locator('[data-testid="task-list"]');
    this.downloadPdfButton = page.getByRole('button', { name: /download pdf|pdf letöltése/i });
    this.printButton = page.getByRole('button', { name: /print|nyomtatás/i });
    this.viewCount = page.locator('[data-testid="view-count"]');
  }

  async goto(publicId: string) {
    await this.page.goto(`/published-tests/${publicId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyTestTitle(expectedTitle: string) {
    await expect(this.testTitle).toHaveText(expectedTitle);
  }

  async verifyTestDescription(expectedDescription: string) {
    await expect(this.testDescription).toContainText(expectedDescription);
  }

  async verifyMetadata(metadata: {
    subject?: string;
    gradeLevel?: string;
    taskCount?: number;
    totalScore?: number;
  }) {
    if (metadata.subject) {
      await expect(this.testMetadata).toContainText(metadata.subject);
    }

    if (metadata.gradeLevel) {
      await expect(this.testMetadata).toContainText(metadata.gradeLevel);
    }

    if (metadata.taskCount !== undefined) {
      await expect(this.testMetadata).toContainText(`${metadata.taskCount} task`);
    }

    if (metadata.totalScore !== undefined) {
      await expect(this.testMetadata).toContainText(`${metadata.totalScore} point`);
    }
  }

  async verifyTaskVisible(taskTitle: string) {
    const task = this.page.locator('[data-testid^="task-"]', { hasText: taskTitle });
    await expect(task).toBeVisible();
  }

  async getTaskCount() {
    const tasks = this.page.locator('[data-testid^="task-"]');
    return await tasks.count();
  }

  async downloadPdf() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadPdfButton.click()
    ]);

    return download;
  }

  async print() {
    // Mock print dialog
    await this.page.evaluate(() => {
      window.print = () => console.log('Print dialog opened');
    });

    await this.printButton.click();
  }

  async getViewCount() {
    const text = await this.viewCount.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async verifyTaskOrder(expectedTitles: string[]) {
    const tasks = this.page.locator('[data-testid^="task-"]');
    const count = await tasks.count();
    expect(count).toBe(expectedTitles.length);

    for (let i = 0; i < expectedTitles.length; i++) {
      const task = tasks.nth(i);
      await expect(task).toContainText(expectedTitles[i]);
    }
  }

  async verifyTaskHasImage(taskIndex: number) {
    const task = this.page.locator('[data-testid^="task-"]').nth(taskIndex);
    const image = task.locator('img');
    await expect(image).toBeVisible();
  }

  async verifyTaskContent(taskTitle: string, content: {
    text?: string;
    questions?: string[];
    score?: number;
  }) {
    const task = this.page.locator('[data-testid^="task-"]', { hasText: taskTitle });

    if (content.text) {
      await expect(task).toContainText(content.text);
    }

    if (content.questions) {
      for (const question of content.questions) {
        await expect(task).toContainText(question);
      }
    }

    if (content.score) {
      await expect(task).toContainText(`${content.score} pont`);
    }
  }
}
