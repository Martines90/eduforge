import { Page, Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Task Creator Page
 * Handles task generation flow
 * NOTE: This uses dynamic grade selection based on country context
 */
export class TaskCreatorPage {
  // Grade selector (uses dynamic dropdown, not tabs)
  readonly gradeSelect: Locator;

  // Cascading select elements
  readonly expandButtons: Locator;
  readonly subjectItems: Locator;

  // Task configuration inputs
  readonly difficultySelect: Locator;
  readonly targetGroupSelect: Locator;
  readonly educationalModelSelect: Locator;
  readonly generateButton: Locator;

  // Task result elements
  readonly taskResult: Locator;
  readonly taskDescription: Locator;
  readonly taskSolution: Locator;
  readonly solutionAccordion: Locator;
  readonly saveTaskButton: Locator;
  readonly closeButton: Locator;

  // Loading state
  readonly loadingSpinner: Locator;
  readonly loadingMessage: Locator;

  // Success modal
  readonly successModal: Locator;
  readonly publicShareLink: Locator;
  readonly copyLinkButton: Locator;

  constructor(private page: Page) {
    // Grade selector dropdown (country-aware)
    this.gradeSelect = page.getByLabel(/grade level/i);

    // Cascading select
    this.expandButtons = page
      .locator('button[aria-label*="expand"]')
      .or(page.getByRole("button").filter({ has: page.locator("svg") }));
    this.subjectItems = page.locator('[role="treeitem"]');

    // Task configuration
    this.difficultySelect = page.getByLabel(/difficulty/i);
    this.targetGroupSelect = page.getByLabel(/target group/i);
    this.educationalModelSelect = page.getByLabel(/educational model/i);
    this.generateButton = page.getByRole("button", { name: /generate.*task/i });

    // Task result
    this.taskResult = page
      .locator('[class*="TaskResult"]')
      .or(page.getByText(/generated task|generált feladat/i).locator(".."));
    this.taskDescription = page.locator('[class*="preview"]').first();
    this.taskSolution = page.locator('[class*="preview"]').last();
    this.solutionAccordion = page.getByRole("button", {
      name: /solution|megoldás/i,
    });
    this.saveTaskButton = page.getByRole("button", {
      name: /save.*task|feladat.*mentése/i,
    });
    this.closeButton = page.getByRole("button", { name: /close|bezárás/i });

    // Loading
    this.loadingSpinner = page.locator('[role="progressbar"]');
    this.loadingMessage = page.getByText(/generating|folyamatban/i);

    // Success modal
    this.successModal = page
      .getByRole("dialog")
      .filter({ hasText: /success|sikeres/i });
    this.publicShareLink = page
      .locator('input[value*="/tasks/"]')
      .or(page.getByText(/\/tasks\//));
    this.copyLinkButton = page.getByRole("button", { name: /copy/i });
  }

  /**
   * Navigate to task creator page
   */
  async goto() {
    await this.page.goto("/task_creator", { waitUntil: "domcontentloaded" });
    // Wait for the page title to be visible
    await this.page.waitForSelector("h1, h2", {
      state: "visible",
      timeout: 10000,
    });
  }

  /**
   * Select grade level by label (e.g., "Grade 9-10", "Elementary (K-5)", etc.)
   * Works with any country's grade system
   */
  async selectGradeByLabel(gradeLabel: string) {
    await this.gradeSelect.click();
    await this.page
      .getByRole("option", { name: new RegExp(gradeLabel, "i") })
      .click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Legacy method - selects grade by US/HU-style notation
   * @deprecated Use selectGradeByLabel for country-aware selection
   */
  async selectGrade(
    grade:
      | "9-10"
      | "11-12"
      | "K-5"
      | "6-8"
      | "1-4"
      | "5-8"
      | "3-6"
      | "7-9"
      | "10-12"
  ) {
    await this.gradeSelect.click();
    // Match any grade label that contains the grade range
    await this.page
      .getByRole("option", {
        name: new RegExp(grade.replace("-", "[\\-\\s]"), "i"),
      })
      .click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Navigate through cascading select by path
   * Example path: ['Halmazok', 'Halmazműveletek', 'Unió (egyesítés)']
   */
  async selectTopicByPath(path: string[]) {
    for (let i = 0; i < path.length; i++) {
      const topic = path[i];

      // Find the topic item
      const topicLocator = this.page.getByText(topic, { exact: false }).first();
      await expect(topicLocator).toBeVisible({ timeout: 5000 });

      // If not the last item, click expand button next to it
      if (i < path.length - 1) {
        // Click the expand arrow before the topic name
        const expandButton = topicLocator
          .locator("..")
          .locator("button")
          .first();
        await expandButton.click();
        await this.page.waitForTimeout(500);
      } else {
        // Last item: click to select it
        await topicLocator.click();
        await this.page.waitForTimeout(500);
      }
    }
  }

  /**
   * Configure task generation settings
   */
  async configureTask(options: {
    difficulty?: "easy" | "medium" | "hard";
    targetGroup?: "mixed" | "boys" | "girls";
    educationalModel?: "constructive" | "expository";
  }) {
    if (options.difficulty) {
      await this.difficultySelect.click();
      await this.page
        .getByRole("option", { name: new RegExp(options.difficulty, "i") })
        .click();
      await this.page.waitForTimeout(200);
    }

    if (options.targetGroup) {
      await this.targetGroupSelect.click();
      await this.page
        .getByRole("option", { name: new RegExp(options.targetGroup, "i") })
        .click();
      await this.page.waitForTimeout(200);
    }

    if (options.educationalModel) {
      await this.educationalModelSelect.click();
      await this.page
        .getByRole("option", {
          name: new RegExp(options.educationalModel, "i"),
        })
        .click();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Wait for task to generate
   */
  async waitForTaskGeneration(timeout: number = 60000) {
    // Wait for loading to appear
    await expect(this.loadingSpinner.or(this.loadingMessage)).toBeVisible({
      timeout: 5000,
    });

    // Wait for loading to disappear
    await expect(this.loadingSpinner).not.toBeVisible({ timeout });
  }

  /**
   * Verify task result is displayed
   */
  async verifyTaskDisplayed() {
    await expect(this.taskDescription).toBeVisible({ timeout: 5000 });

    // Verify description has content
    const descText = await this.taskDescription.textContent();
    expect(descText).toBeTruthy();
    expect(descText!.length).toBeGreaterThan(50);
  }

  /**
   * Expand solution accordion
   */
  async expandSolution() {
    if (await this.solutionAccordion.isVisible()) {
      await this.solutionAccordion.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Verify solution is displayed
   */
  async verifySolutionDisplayed() {
    await this.expandSolution();
    await expect(this.taskSolution).toBeVisible();

    const solutionText = await this.taskSolution.textContent();
    expect(solutionText).toBeTruthy();
    expect(solutionText!.length).toBeGreaterThan(50);
  }

  /**
   * Save task to database
   */
  async saveTask() {
    await this.saveTaskButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Verify success modal appears with share link
   */
  async verifySuccessModal() {
    await expect(this.successModal).toBeVisible({ timeout: 10000 });
    await expect(this.publicShareLink).toBeVisible();
  }

  /**
   * Get the public share link from success modal
   */
  async getShareLink(): Promise<string> {
    await this.verifySuccessModal();
    const linkText = await this.publicShareLink.textContent();
    return linkText || "";
  }

  /**
   * Complete full task generation flow
   * @param options.grade - Grade range (e.g., '9-10', 'K-5', '3-6') - country-aware
   */
  async generateTaskFullFlow(options: {
    grade:
      | "9-10"
      | "11-12"
      | "K-5"
      | "6-8"
      | "1-4"
      | "5-8"
      | "3-6"
      | "7-9"
      | "10-12";
    topicPath: string[];
    difficulty?: "easy" | "medium" | "hard";
    targetGroup?: "mixed" | "boys" | "girls";
  }) {
    await this.selectGrade(options.grade);
    await this.selectTopicByPath(options.topicPath);

    if (options.difficulty || options.targetGroup) {
      await this.configureTask({
        difficulty: options.difficulty,
        targetGroup: options.targetGroup,
      });
    }

    // Task generation starts automatically after topic selection
    await this.waitForTaskGeneration();
    await this.verifyTaskDisplayed();
  }
}
