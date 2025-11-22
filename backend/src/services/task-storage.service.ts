import * as path from "path";
import { config } from "../config";
import { Task, TaskImage } from "../types";
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
   * @param task The task to save
   * @returns Promise that resolves to the storage path
   */
  async saveTask(task: Task): Promise<string> {
    const taskDir = this.getTaskDir(task.id);
    const imagesDir = this.getImagesDir(task.id);

    // Create directories
    ensureDirectoryExists(taskDir);
    ensureDirectoryExists(imagesDir);

    // Save description
    const descriptionPath = this.getDescriptionPath(task.id);
    await writeFile(descriptionPath, task.description);

    // Download and save images
    for (const image of task.images) {
      const imagePath = this.getImagePath(task.id, image.id);
      await downloadFile(image.url, imagePath);
      console.log(`✅ Saved image: ${image.id}`);
    }

    console.log(`✅ Task saved to: ${taskDir}`);
    return taskDir;
  }

  /**
   * Retrieves a task from storage
   * @param taskId The task ID to retrieve
   * @returns The task object with local file URLs
   */
  async getTask(taskId: string): Promise<Task | null> {
    const taskDir = this.getTaskDir(taskId);

    // Check if task exists
    if (!exists(taskDir)) {
      return null;
    }

    // Read description
    const descriptionPath = this.getDescriptionPath(taskId);
    if (!exists(descriptionPath)) {
      return null;
    }

    const description = await readFile(descriptionPath);

    // Find all image files in the images directory
    const imagesDir = this.getImagesDir(taskId);
    const images: TaskImage[] = [];

    if (exists(imagesDir)) {
      const fs = await import("fs");
      const files = await fs.promises.readdir(imagesDir);

      for (const file of files) {
        if (file.endsWith(".png")) {
          const imageId = file.replace(".png", "");
          // Return relative URL path for the API
          images.push({
            id: imageId,
            url: `/storage/tasks/${taskId}/images/${file}`,
          });
        }
      }
    }

    return {
      id: taskId,
      description,
      images,
    };
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
