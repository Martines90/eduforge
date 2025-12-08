import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Task Detail Page
 * Handles viewing individual task details
 */
export class TaskDetailPage {
  // Header elements
  readonly backButton: Locator;
  readonly taskTitle: Locator;
  readonly gradeChip: Locator;
  readonly subjectChip: Locator;
  readonly difficultyChip: Locator;
  readonly educationalModelChip: Locator;
  readonly subjectMappingPath: Locator;
  readonly creatorInfo: Locator;

  // Action buttons
  readonly copyShareLinkButton: Locator;
  readonly downloadPDFButton: Locator;

  // Content sections
  readonly taskDescriptionSection: Locator;
  readonly taskDescription: Locator;
  readonly imagesSection: Locator;
  readonly taskImages: Locator;

  // Solution section (collapsible)
  readonly solutionAccordion: Locator;
  readonly solutionAccordionHeader: Locator;
  readonly solutionContent: Locator;

  // LaTeX elements
  readonly mathFormulas: Locator;

  // Success notification
  readonly copySuccessSnackbar: Locator;

  // Loading state
  readonly loadingSpinner: Locator;

  // Error state
  readonly errorAlert: Locator;

  constructor(private page: Page) {
    // Header
    this.backButton = page.getByRole('button', { name: /back to tasks/i });
    this.taskTitle = page.getByRole('heading', { level: 1 }).or(page.locator('h1'));
    this.gradeChip = page.locator('[class*="MuiChip"]').filter({ hasText: /grade/i }).first();
    this.subjectChip = page.locator('[class*="MuiChip"]').filter({ hasText: /mathematics|physics|chemistry/i }).first();
    this.difficultyChip = page.locator('[class*="MuiChip"]').filter({ hasText: /difficulty/i });
    this.educationalModelChip = page.locator('[class*="MuiChip"]').filter({ hasText: /secular|traditional|progressive|conservative/i });
    this.subjectMappingPath = page.locator('p').filter({ hasText: />/i }).first();
    this.creatorInfo = page.locator('text=/Created by/i');

    // Actions
    this.copyShareLinkButton = page.getByRole('button', { name: /copy share link/i });
    this.downloadPDFButton = page.getByRole('button', { name: /download pdf/i });

    // Content
    this.taskDescriptionSection = page.locator('section, div').filter({ has: page.getByText(/^Task$|^Feladat$/i) });
    this.taskDescription = page.locator('[dangerouslySetInnerHTML]').first().or(page.locator('div').filter({ hasText: /.{50,}/ }).first());
    this.imagesSection = page.locator('section, div').filter({ has: page.getByText(/images|képek/i) });
    this.taskImages = page.locator('img[alt*="Task image"]');

    // Solution
    this.solutionAccordion = page.locator('[class*="MuiAccordion"]').or(page.getByRole('button', { name: /solution|megoldás/i }).locator('..'));
    this.solutionAccordionHeader = page.getByRole('button', { name: /solution|megoldás/i });
    this.solutionContent = page.locator('[dangerouslySetInnerHTML]').last();

    // LaTeX
    this.mathFormulas = page.locator('.math, [class*="latex"], mjx-container').or(page.locator('span').filter({ hasText: /×|÷|∑|∫/ }));

    // Notifications
    this.copySuccessSnackbar = page.locator('[role="alert"]').filter({ hasText: /copied|link/i });

    // States
    this.loadingSpinner = page.locator('[role="progressbar"]').or(page.getByText(/loading/i));
    this.errorAlert = page.locator('[role="alert"]').filter({ hasText: /error|not found/i });
  }

  /**
   * Navigate to specific task detail page
   */
  async goto(taskId: string) {
    await this.page.goto(`/tasks/${taskId}`, { waitUntil: 'domcontentloaded' });
    // Wait for the main task content to be visible
    await this.page.waitForSelector('h1, h2, main', { state: 'visible', timeout: 10000 });
  }

  /**
   * Verify page loaded successfully
   */
  async verifyPageLoaded() {
    // Verify no error
    await expect(this.errorAlert).not.toBeVisible();

    // Verify main content is visible
    await expect(this.taskDescription).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify task metadata is displayed
   */
  async verifyTaskMetadata(expectedData: {
    hasGrade?: boolean;
    hasSubject?: boolean;
    hasDifficulty?: boolean;
    hasCreator?: boolean;
  }) {
    if (expectedData.hasGrade) {
      await expect(this.gradeChip).toBeVisible();
    }

    if (expectedData.hasSubject) {
      await expect(this.subjectChip).toBeVisible();
    }

    if (expectedData.hasDifficulty) {
      await expect(this.difficultyChip).toBeVisible();
    }

    if (expectedData.hasCreator) {
      await expect(this.creatorInfo).toBeVisible();
    }
  }

  /**
   * Verify task description is displayed and has content
   */
  async verifyTaskDescription() {
    await expect(this.taskDescription).toBeVisible();

    const descText = await this.taskDescription.textContent();
    expect(descText).toBeTruthy();
    expect(descText!.length).toBeGreaterThan(50);
  }

  /**
   * Expand solution accordion
   */
  async expandSolution() {
    // Check if accordion is collapsed
    const isExpanded = await this.solutionAccordion.getAttribute('aria-expanded');

    if (isExpanded === 'false' || !isExpanded) {
      await this.solutionAccordionHeader.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Verify solution is displayed and has content
   */
  async verifySolution() {
    await this.expandSolution();
    await expect(this.solutionContent).toBeVisible({ timeout: 5000 });

    const solutionText = await this.solutionContent.textContent();
    expect(solutionText).toBeTruthy();
    expect(solutionText!.length).toBeGreaterThan(50);
  }

  /**
   * Verify solution is collapsed by default
   */
  async verifySolutionCollapsedByDefault() {
    const isExpanded = await this.solutionAccordion.getAttribute('aria-expanded');
    expect(isExpanded).toBe('false');
  }

  /**
   * Verify LaTeX formulas are rendered
   */
  async verifyLatexRendered() {
    await this.expandSolution();

    // Wait a bit for LaTeX to process
    await this.page.waitForTimeout(2000);

    // Check if math formulas are present in the solution
    const solutionText = await this.solutionContent.textContent();

    // LaTeX should be processed (no raw $ symbols remaining)
    expect(solutionText).not.toContain('$\\[');
    expect(solutionText).not.toContain('\\]$');

    // Should contain math symbols (these get rendered)
    const hasMathContent = solutionText!.includes('×') ||
                           solutionText!.includes('=') ||
                           solutionText!.includes('+') ||
                           solutionText!.includes('−');

    expect(hasMathContent).toBeTruthy();
  }

  /**
   * Copy share link to clipboard
   */
  async copyShareLink() {
    await this.copyShareLinkButton.click();
    await expect(this.copySuccessSnackbar).toBeVisible({ timeout: 3000 });
  }

  /**
   * Verify action buttons are present
   */
  async verifyActionButtons() {
    await expect(this.copyShareLinkButton).toBeVisible();
    await expect(this.downloadPDFButton).toBeVisible();
  }

  /**
   * Go back to tasks page
   */
  async goBack() {
    await this.backButton.click();
    await this.page.waitForURL('**/tasks', { timeout: 5000 });
  }

  /**
   * Verify task images are displayed
   */
  async verifyImages(expectedCount: number) {
    if (expectedCount > 0) {
      await expect(this.imagesSection).toBeVisible();
      await expect(this.taskImages).toHaveCount(expectedCount);
    } else {
      await expect(this.imagesSection).not.toBeVisible();
    }
  }

  /**
   * Complete verification of task detail page
   */
  async verifyCompleteTask(options: {
    hasSolution?: boolean;
    hasImages?: boolean;
    hasLatex?: boolean;
  } = {}) {
    await this.verifyPageLoaded();
    await this.verifyTaskMetadata({
      hasGrade: true,
      hasSubject: true,
      hasDifficulty: true,
      hasCreator: true,
    });
    await this.verifyTaskDescription();
    await this.verifyActionButtons();

    if (options.hasSolution !== false) {
      await this.verifySolutionCollapsedByDefault();
      await this.verifySolution();
    }

    if (options.hasLatex) {
      await this.verifyLatexRendered();
    }
  }
}
