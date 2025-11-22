import * as path from "path";
import { config } from "../config";
import { GeneratedTask } from "../types";
import {
  writeFile,
  readFile,
  downloadFile,
  exists,
  ensureDirectoryExists,
} from "../utils";

export class TaskStorageService {
  /**
   * Gets the task directory path
   * @param taskId The task ID
   * @returns The full path to the task directory
   */
  private getTaskDir(taskId: string): string {
    return path.join(config.storageDir, "tasks", taskId);
  }

  /**
   * Gets the task data file path (JSON)
   * @param taskId The task ID
   * @returns The full path to the task.json file
   */
  private getTaskDataPath(taskId: string): string {
    return path.join(this.getTaskDir(taskId), "task.json");
  }

  /**
   * Gets the task description file path
   * @param taskId The task ID
   * @returns The full path to the description.md file
   */
  private getDescriptionPath(taskId: string): string {
    return path.join(this.getTaskDir(taskId), "description.md");
  }

  /**
   * Gets the images directory path for a task
   * @param taskId The task ID
   * @returns The full path to the images directory
   */
  private getImagesDir(taskId: string): string {
    return path.join(this.getTaskDir(taskId), "images");
  }

  /**
   * Gets the image file path
   * @param taskId The task ID
   * @param imageId The image ID
   * @returns The full path to the image file
   */
  private getImagePath(taskId: string, imageId: string): string {
    return path.join(this.getImagesDir(taskId), `${imageId}.png`);
  }

  /**
   * Saves a task to storage
   * @param taskId The task ID
   * @param generatedTask The generated task data to save
   * @returns Promise that resolves to the storage path
   */
  async saveTask(taskId: string, generatedTask: GeneratedTask): Promise<string> {
    const taskDir = this.getTaskDir(taskId);
    const imagesDir = this.getImagesDir(taskId);

    // Create directories
    ensureDirectoryExists(taskDir);
    ensureDirectoryExists(imagesDir);

    // Save complete task data as JSON
    const taskDataPath = this.getTaskDataPath(taskId);
    await writeFile(taskDataPath, JSON.stringify(generatedTask, null, 2));

    // Also save description as markdown for easy reading
    const descriptionPath = this.getDescriptionPath(taskId);
    await writeFile(descriptionPath, generatedTask.story_text);

    // Download and save images
    for (const image of generatedTask.images) {
      const imagePath = this.getImagePath(taskId, image.image_id);
      await downloadFile(image.url, imagePath);
      console.log(`✅ Saved image: ${image.image_id}`);
    }

    console.log(`✅ Task saved to: ${taskDir}`);
    return taskDir;
  }

  /**
   * Retrieves a task from storage
   * @param taskId The task ID to retrieve
   * @returns The task object with local file URLs
   */
  async getTask(taskId: string): Promise<GeneratedTask | null> {
    const taskDir = this.getTaskDir(taskId);

    // Check if task exists
    if (!exists(taskDir)) {
      return null;
    }

    // Try to read the complete task data JSON
    const taskDataPath = this.getTaskDataPath(taskId);
    if (exists(taskDataPath)) {
      try {
        const taskDataJson = await readFile(taskDataPath);
        const generatedTask: GeneratedTask = JSON.parse(taskDataJson);

        // Update image URLs to local storage paths
        generatedTask.images = generatedTask.images.map((img) => ({
          ...img,
          url: `/storage/tasks/${taskId}/images/${img.image_id}.png`,
        }));

        return generatedTask;
      } catch (error) {
        console.error("Error reading task.json:", error);
      }
    }

    // Fallback: if task.json doesn't exist, return null
    // (old tasks won't have this file)
    return null;
  }

  /**
   * Checks if a task exists
   * @param taskId The task ID to check
   * @returns True if the task exists, false otherwise
   */
  taskExists(taskId: string): boolean {
    return exists(this.getTaskDir(taskId));
  }
}
