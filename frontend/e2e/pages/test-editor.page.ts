import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Test Editor page (/tests/[id]/edit)
 * Handles adding tasks, reordering, custom tasks, and publishing
 */
export class TestEditorPage {
  readonly page: Page;
  readonly testTitle: Locator;
  readonly addTaskButton: Locator;
  readonly addCustomTaskButton: Locator;
  readonly searchTasksModal: Locator;
  readonly searchInput: Locator;
  readonly taskItems: Locator;
  readonly saveButton: Locator;
  readonly publishButton: Locator;
  readonly generatePdfButton: Locator;
  readonly backButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.testTitle = page.locator('h1');
    this.addTaskButton = page.getByRole('button', { name: /add task|feladat hozzáadása/i });
    this.addCustomTaskButton = page.getByRole('button', { name: /add custom task|egyéni feladat/i });
    this.searchTasksModal = page.getByRole('dialog', { name: /search tasks|feladatok keresése/i });
    this.searchInput = page.getByPlaceholder(/search tasks|keresés/i);
    this.taskItems = page.locator('[data-testid^="test-task-"]');
    this.saveButton = page.getByRole('button', { name: /save|mentés/i });
    this.publishButton = page.getByRole('button', { name: /publish|közzététel/i });
    this.generatePdfButton = page.getByRole('button', { name: /generate pdf|pdf készítés/i });
    this.backButton = page.getByRole('link', { name: /back|vissza/i });
    this.emptyState = page.getByText(/no tasks added|még nincs hozzáadott feladat/i);
  }

  async goto(testId: string) {
    await this.page.goto(`/tests/${testId}/edit`);
    await this.page.waitForLoadState('networkidle');
  }

  async verifyTestLoaded(testName: string) {
    await expect(this.testTitle).toContainText(testName);
  }

  async openAddTaskModal() {
    await this.addTaskButton.click();
    await expect(this.searchTasksModal).toBeVisible();
  }

  async searchAndAddTask(searchQuery: string, taskTitle?: string) {
    await this.openAddTaskModal();
    await this.searchInput.fill(searchQuery);
    await this.page.waitForTimeout(500); // Wait for search results

    // Click on the first task or specific task by title
    const taskToAdd = taskTitle
      ? this.searchTasksModal.locator('[data-testid^="search-task-"]', { hasText: taskTitle })
      : this.searchTasksModal.locator('[data-testid^="search-task-"]').first();

    await taskToAdd.click();
    await expect(this.searchTasksModal).not.toBeVisible();
  }

  async addCustomTask(customTaskData: {
    title: string;
    text: string;
    questions: Array<{ question: string; score?: number }>;
  }) {
    await this.addCustomTaskButton.click();

    // Fill custom task form
    const customTaskModal = this.page.getByRole('dialog', { name: /custom task|egyéni feladat/i });
    await expect(customTaskModal).toBeVisible();

    await this.page.getByLabel(/title|cím/i).fill(customTaskData.title);
    await this.page.getByLabel(/text|szöveg/i).fill(customTaskData.text);

    // Add questions
    for (let i = 0; i < customTaskData.questions.length; i++) {
      const question = customTaskData.questions[i];

      if (i > 0) {
        // Click add question button for additional questions
        await this.page.getByRole('button', { name: /add question|kérdés hozzáadása/i }).click();
      }

      const questionInput = this.page.locator(`[data-testid="question-${i}"]`);
      await questionInput.fill(question.question);

      if (question.score) {
        const scoreInput = this.page.locator(`[data-testid="score-${i}"]`);
        await scoreInput.fill(question.score.toString());
      }
    }

    // Save custom task
    await customTaskModal.getByRole('button', { name: /save|mentés/i }).click();
    await expect(customTaskModal).not.toBeVisible();
  }

  async reorderTask(taskIndex: number, newIndex: number) {
    const task = this.taskItems.nth(taskIndex);
    const dragHandle = task.locator('[data-testid="drag-handle"]');

    // Get bounding boxes
    const targetTask = this.taskItems.nth(newIndex);
    const sourceBox = await task.boundingBox();
    const targetBox = await targetTask.boundingBox();

    if (!sourceBox || !targetBox) {
      throw new Error('Could not get task positions for drag and drop');
    }

    // Perform drag and drop
    await dragHandle.hover();
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await this.page.mouse.up();

    // Wait for reorder animation
    await this.page.waitForTimeout(300);
  }

  async removeTask(taskIndex: number) {
    const task = this.taskItems.nth(taskIndex);
    const removeButton = task.getByRole('button', { name: /remove|eltávolítás/i });
    await removeButton.click();

    // Confirm if needed
    const confirmDialog = this.page.getByRole('dialog', { name: /confirm/i });
    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /confirm|megerősítés/i }).click();
    }
  }

  async editTaskScore(taskIndex: number, newScore: number) {
    const task = this.taskItems.nth(taskIndex);
    const editButton = task.getByRole('button', { name: /edit score|pontszám szerkesztése/i });
    await editButton.click();

    const scoreInput = this.page.getByLabel(/score|pontszám/i);
    await scoreInput.fill(newScore.toString());

    const saveButton = this.page.getByRole('button', { name: /save|mentés/i });
    await saveButton.click();
  }

  async overrideTaskContent(taskIndex: number, overrides: {
    title?: string;
    text?: string;
  }) {
    const task = this.taskItems.nth(taskIndex);
    const editButton = task.getByRole('button', { name: /edit|szerkesztés/i });
    await editButton.click();

    const editModal = this.page.getByRole('dialog', { name: /edit task|feladat szerkesztése/i });
    await expect(editModal).toBeVisible();

    if (overrides.title) {
      const titleInput = editModal.getByLabel(/override title|cím felülírása/i);
      await titleInput.fill(overrides.title);
    }

    if (overrides.text) {
      const textInput = editModal.getByLabel(/override text|szöveg felülírása/i);
      await textInput.fill(overrides.text);
    }

    await editModal.getByRole('button', { name: /save|mentés/i }).click();
    await expect(editModal).not.toBeVisible();
  }

  async toggleTaskImage(taskIndex: number) {
    const task = this.taskItems.nth(taskIndex);
    const imageToggle = task.getByRole('checkbox', { name: /show image|kép megjelenítése/i });
    await imageToggle.click();
  }

  async saveTest() {
    await this.saveButton.click();

    // Wait for save to complete
    await this.page.waitForResponse(response =>
      response.url().includes('/api/tests') && response.status() === 200
    );
  }

  async publishTest() {
    await this.publishButton.click();

    // Confirm publishing
    const confirmDialog = this.page.getByRole('dialog', { name: /confirm publish|közzététel megerősítése/i });
    await expect(confirmDialog).toBeVisible();

    await confirmDialog.getByRole('button', { name: /publish|közzététel/i }).click();

    // Wait for success message
    const successMessage = this.page.getByText(/published successfully|sikeresen közzétéve/i);
    await expect(successMessage).toBeVisible();

    // Get public link
    const publicLinkInput = this.page.getByLabel(/public link|nyilvános link/i);
    return await publicLinkInput.inputValue();
  }

  async generatePdf() {
    await this.generatePdfButton.click();

    // Wait for PDF generation
    await this.page.waitForResponse(response =>
      response.url().includes('/api/tests') &&
      response.url().includes('/generate-pdf') &&
      response.status() === 200,
      { timeout: 30000 }
    );

    // Wait for success message
    const successMessage = this.page.getByText(/pdf generated|pdf elkészült/i);
    await expect(successMessage).toBeVisible();
  }

  async getTaskCount() {
    return await this.taskItems.count();
  }

  async verifyTaskAtIndex(index: number, expectedTitle: string) {
    const task = this.taskItems.nth(index);
    await expect(task).toContainText(expectedTitle);
  }

  async verifyTaskOrder(expectedTitles: string[]) {
    const count = await this.getTaskCount();
    expect(count).toBe(expectedTitles.length);

    for (let i = 0; i < expectedTitles.length; i++) {
      await this.verifyTaskAtIndex(i, expectedTitles[i]);
    }
  }

  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async getTotalScore() {
    const scoreElement = this.page.locator('[data-testid="total-score"]');
    const text = await scoreElement.textContent();
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }
}
