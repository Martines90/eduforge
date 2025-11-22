import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";

export class TaskController {
  private taskGenerator: TaskGeneratorService;
  private taskStorage: TaskStorageService;

  constructor() {
    this.taskGenerator = new TaskGeneratorService();
    this.taskStorage = new TaskStorageService();
  }

  /**
   * POST /generate-task
   * Generates a new task with description and images
   */
  generateTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { topic, numImages } = req.body;

      // Validate numImages if provided
      const imageCount =
        numImages && !isNaN(parseInt(numImages))
          ? Math.min(Math.max(parseInt(numImages), 1), 5)
          : 2;

      console.log("📥 Request to generate task");
      if (topic) {
        console.log(`   Topic: ${topic}`);
      }
      console.log(`   Images: ${imageCount}\n`);

      // Generate the task
      const result = await this.taskGenerator.generateTask(topic, imageCount);

      // Return the task data
      res.status(201).json({
        id: result.task.id,
        description: result.task.description,
        images: result.task.images,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /tasks/:taskId
   * Retrieves a specific task by ID
   */
  getTaskById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { taskId } = req.params;

      console.log(`📥 Request to get task: ${taskId}`);

      // Retrieve the task
      const task = await this.taskStorage.getTask(taskId);

      if (!task) {
        res.status(404).json({
          error: "Task not found",
          message: `No task found with ID: ${taskId}`,
        });
        return;
      }

      // Return the task data
      res.status(200).json({
        id: task.id,
        description: task.description,
        images: task.images,
      });
    } catch (error) {
      next(error);
    }
  };
}
