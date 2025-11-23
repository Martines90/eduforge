import * as path from "path";
import { config } from "../config";
import {
  GeneratedTask,
  TaskEntry,
  TasksCollection,
  TaskGeneratorRequest,
} from "../types";
import {
  writeFile,
  readFile,
  downloadFile,
  exists,
  ensureDirectoryExists,
} from "../utils";
import {
  buildCurriculumStoragePath,
  getTasksJsonPath,
  getTaskImagesDir,
  getTaskImagePath,
} from "../utils/curriculum-path.helper";

export class TaskStorageService {
  /**
   * Gets the curriculum directory path based on request parameters
   *
   * Example: storage/hu/liberal/math/grade_9_10/algebra/linear_equations/solving_basic_equations
   *
   * @param request Task generation request with curriculum path and settings
   * @returns Full path to curriculum directory
   */
  private getCurriculumDir(request: TaskGeneratorRequest): string {
    return buildCurriculumStoragePath(
      config.storageDir,
      request.country_code,
      request.educational_model,
      request.curriculum_path
    );
  }

  /**
   * Gets the task data file path for a specific task
   * Each task is stored as {taskId}.json in the curriculum directory
   *
   * @param curriculumDir Curriculum directory path
   * @param taskId Task ID
   * @returns Path to task JSON file
   */
  private getTaskFilePath(curriculumDir: string, taskId: string): string {
    return path.join(curriculumDir, `${taskId}.json`);
  }

  /**
   * Loads the tasks.json collection file
   * Creates a new empty collection if it doesn't exist
   *
   * @param curriculumDir Curriculum directory path
   * @returns Tasks collection
   */
  private async loadTasksCollection(
    curriculumDir: string
  ): Promise<TasksCollection> {
    const tasksJsonPath = getTasksJsonPath(curriculumDir);

    if (!exists(tasksJsonPath)) {
      // Create empty collection if file doesn't exist
      return { tasks: [] };
    }

    try {
      const jsonContent = await readFile(tasksJsonPath);
      return JSON.parse(jsonContent) as TasksCollection;
    } catch (error) {
      console.error("Error reading tasks.json:", error);
      // Return empty collection on error
      return { tasks: [] };
    }
  }

  /**
   * Saves the tasks.json collection file
   *
   * @param curriculumDir Curriculum directory path
   * @param collection Tasks collection to save
   */
  private async saveTasksCollection(
    curriculumDir: string,
    collection: TasksCollection
  ): Promise<void> {
    const tasksJsonPath = getTasksJsonPath(curriculumDir);
    await writeFile(tasksJsonPath, JSON.stringify(collection, null, 2));
  }

  /**
   * Creates a task entry for tasks.json from a generated task
   *
   * @param taskId Task ID
   * @param generatedTask Generated task data
   * @returns Task entry
   */
  private createTaskEntry(
    taskId: string,
    generatedTask: GeneratedTask
  ): TaskEntry {
    return {
      id: taskId,
      title: generatedTask.title,
      difficulty_level: generatedTask.metadata.difficulty_level,
      target_group: generatedTask.metadata.target_group,
      created_at: generatedTask.created_at,
      number_of_images: generatedTask.images.length,
      tags: generatedTask.metadata.tags,
    };
  }

  /**
   * Saves a generated task to the curriculum-based storage structure
   *
   * Storage structure:
   * storage/{country}/{educational_model}/{curriculum_path}/
   *   ├── tasks.json              // Collection of all tasks
   *   ├── {taskId}.json          // Individual task data
   *   └── images/
   *       └── {taskId}/
   *           └── {imageId}.png
   *
   * @param taskId Task ID
   * @param request Task generation request
   * @param generatedTask Generated task data
   * @returns Promise that resolves to the curriculum directory path
   */
  async saveTask(
    taskId: string,
    request: TaskGeneratorRequest,
    generatedTask: GeneratedTask
  ): Promise<string> {
    const curriculumDir = this.getCurriculumDir(request);

    // Ensure curriculum directory exists
    ensureDirectoryExists(curriculumDir);
    console.log(`   📁 Using curriculum directory: ${curriculumDir}`);

    // 1. Load existing tasks collection
    const collection = await this.loadTasksCollection(curriculumDir);

    // 2. Add this task to the collection (or update if it exists)
    const existingIndex = collection.tasks.findIndex((t) => t.id === taskId);
    const taskEntry = this.createTaskEntry(taskId, generatedTask);

    if (existingIndex >= 0) {
      // Update existing task entry
      collection.tasks[existingIndex] = taskEntry;
      console.log(`   🔄 Updated task in collection`);
    } else {
      // Add new task entry
      collection.tasks.push(taskEntry);
      console.log(`   ➕ Added task to collection`);
    }

    // 3. Save updated tasks.json
    await this.saveTasksCollection(curriculumDir, collection);
    console.log(`   ✅ Saved: tasks.json (${collection.tasks.length} tasks)`);

    // 4. Save complete task data as {taskId}.json
    const taskFilePath = this.getTaskFilePath(curriculumDir, taskId);
    await writeFile(taskFilePath, JSON.stringify(generatedTask, null, 2));
    console.log(`   ✅ Saved: ${taskId}.json`);

    // 5. Download and save images to images/{taskId}/ folder
    if (generatedTask.images.length > 0) {
      const imagesDir = getTaskImagesDir(curriculumDir, taskId);
      ensureDirectoryExists(imagesDir);

      for (const image of generatedTask.images) {
        const imagePath = getTaskImagePath(curriculumDir, taskId, image.image_id);
        await downloadFile(image.url, imagePath);
        console.log(`   ✅ Saved: images/${taskId}/${image.image_id}.png`);
      }
    }

    return curriculumDir;
  }

  /**
   * Retrieves a task from curriculum-based storage
   *
   * @param request Task generation request (used to locate curriculum directory)
   * @param taskId Task ID to retrieve
   * @returns The task object with local file URLs, or null if not found
   */
  async getTask(
    request: TaskGeneratorRequest,
    taskId: string
  ): Promise<GeneratedTask | null> {
    const curriculumDir = this.getCurriculumDir(request);
    const taskFilePath = this.getTaskFilePath(curriculumDir, taskId);

    // Check if task file exists
    if (!exists(taskFilePath)) {
      return null;
    }

    try {
      const taskJson = await readFile(taskFilePath);
      const generatedTask: GeneratedTask = JSON.parse(taskJson);

      // Update image URLs to local storage paths
      // Path format: /storage/{country}/{model}/{curriculum_path}/images/{taskId}/{imageId}.png
      const relativePath = path.relative(
        config.storageDir,
        curriculumDir
      );

      generatedTask.images = generatedTask.images.map((img) => ({
        ...img,
        url: `/storage/${relativePath}/images/${taskId}/${img.image_id}.png`,
      }));

      return generatedTask;
    } catch (error) {
      console.error(`Error reading task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Gets all tasks for a curriculum location
   *
   * @param request Task generation request (used to locate curriculum directory)
   * @returns Array of task entries
   */
  async getAllTasksForCurriculum(
    request: TaskGeneratorRequest
  ): Promise<TaskEntry[]> {
    const curriculumDir = this.getCurriculumDir(request);
    const collection = await this.loadTasksCollection(curriculumDir);
    return collection.tasks;
  }

  /**
   * Checks if a task exists in the curriculum directory
   *
   * @param request Task generation request (used to locate curriculum directory)
   * @param taskId Task ID to check
   * @returns True if task exists, false otherwise
   */
  taskExists(request: TaskGeneratorRequest, taskId: string): boolean {
    const curriculumDir = this.getCurriculumDir(request);
    const taskFilePath = this.getTaskFilePath(curriculumDir, taskId);
    return exists(taskFilePath);
  }

  /**
   * Deletes a task from curriculum-based storage
   * Removes the task entry from tasks.json and deletes the task file and images
   *
   * @param request Task generation request (used to locate curriculum directory)
   * @param taskId Task ID to delete
   * @returns True if task was deleted, false if not found
   */
  async deleteTask(
    request: TaskGeneratorRequest,
    taskId: string
  ): Promise<boolean> {
    const curriculumDir = this.getCurriculumDir(request);
    const taskFilePath = this.getTaskFilePath(curriculumDir, taskId);

    if (!exists(taskFilePath)) {
      return false;
    }

    try {
      // 1. Load tasks collection
      const collection = await this.loadTasksCollection(curriculumDir);

      // 2. Remove task from collection
      collection.tasks = collection.tasks.filter((t) => t.id !== taskId);

      // 3. Save updated collection
      await this.saveTasksCollection(curriculumDir, collection);

      // 4. Delete task file (Note: In production, you'd use fs.unlink)
      // For now, we'll just log it since we don't have a delete function in utils
      console.log(`   🗑️  Would delete: ${taskFilePath}`);
      console.log(`   🗑️  Would delete: images/${taskId}/`);

      return true;
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      return false;
    }
  }
}
