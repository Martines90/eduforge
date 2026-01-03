import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Test Library page (/my-tests)
 * Handles test creation, listing, editing, and publishing
 */
export class TestLibraryPage {
  readonly page: Page;
  readonly createTestButton: Locator;
  readonly createTestModal: Locator;
  readonly testNameInput: Locator;
  readonly testDescriptionInput: Locator;
  readonly subjectSelect: Locator;
  readonly gradeLevelSelect: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;
  readonly testCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createTestButton = page.getByRole('button', { name: /create new test|új teszt létrehozása/i });
    this.createTestModal = page.getByRole('dialog');
    this.testNameInput = page.getByLabel(/test name|teszt neve/i);
    this.testDescriptionInput = page.getByLabel(/description|leírás/i);
    this.subjectSelect = page.getByLabel(/subject|tantárgy/i);
    this.gradeLevelSelect = page.getByLabel(/grade level|évfolyam/i);
    this.createButton = this.createTestModal.getByRole('button', { name: /create|létrehozás/i });
    this.cancelButton = this.createTestModal.getByRole('button', { name: /cancel|mégse/i });
    this.searchInput = page.getByPlaceholder(/search tests|keresés/i);
    this.testCards = page.locator('[data-testid^="test-card-"]');
    this.emptyState = page.getByText(/no tests yet|még nincs teszt/i);
  }

  async goto() {
    await this.page.goto('/my-tests');
    await this.page.waitForLoadState('networkidle');
  }

  async openCreateTestModal() {
    await this.createTestButton.click();
    await expect(this.createTestModal).toBeVisible();
  }

  async fillTestDetails(details: {
    name: string;
    description?: string;
    subject?: string;
    gradeLevel?: string;
  }) {
    await this.testNameInput.fill(details.name);

    if (details.description) {
      await this.testDescriptionInput.fill(details.description);
    }

    if (details.subject) {
      await this.subjectSelect.click();
      await this.page.getByRole('option', { name: details.subject }).click();
    }

    if (details.gradeLevel) {
      await this.gradeLevelSelect.click();
      await this.page.getByRole('option', { name: details.gradeLevel }).click();
    }
  }

  async createTest(details: {
    name: string;
    description?: string;
    subject?: string;
    gradeLevel?: string;
  }) {
    await this.openCreateTestModal();
    await this.fillTestDetails(details);
    await this.createButton.click();

    // Wait for modal to close and navigation to complete
    await expect(this.createTestModal).not.toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  async searchTests(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async getTestCard(testName: string) {
    return this.page.locator(`[data-testid^="test-card-"]`, {
      hasText: testName
    });
  }

  async openTestEditor(testName: string) {
    const testCard = await this.getTestCard(testName);
    await testCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteTest(testName: string) {
    const testCard = await this.getTestCard(testName);
    const deleteButton = testCard.getByRole('button', { name: /delete|törlés/i });
    await deleteButton.click();

    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirm|megerősítés/i });
    await confirmButton.click();

    // Wait for card to disappear
    await expect(testCard).not.toBeVisible();
  }

  async verifyTestExists(testName: string) {
    const testCard = await this.getTestCard(testName);
    await expect(testCard).toBeVisible();
  }

  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getTestCount() {
    return await this.testCards.count();
  }

  async verifyTestDetails(testName: string, details: {
    taskCount?: number;
    subject?: string;
    updatedAt?: string;
  }) {
    const testCard = await this.getTestCard(testName);

    if (details.taskCount !== undefined) {
      const taskCountText = testCard.locator('[data-testid="task-count"]');
      await expect(taskCountText).toContainText(`${details.taskCount}`);
    }

    if (details.subject) {
      await expect(testCard).toContainText(details.subject);
    }
  }
}
