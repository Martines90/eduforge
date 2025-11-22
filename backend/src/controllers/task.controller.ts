import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";
import {
  TaskGeneratorRequest,
  TaskGeneratorResponse,
} from "../types";

export class TaskController {
  private taskGenerator: TaskGeneratorService;
  private taskStorage: TaskStorageService;

  constructor() {
    this.taskGenerator = new TaskGeneratorService();
    this.taskStorage = new TaskStorageService();
  }

  /**
   * POST /generate-task
   * Generates a new task with description and images based on comprehensive configuration
   */
  generateTask = async (
    req: Request<{}, {}, TaskGeneratorRequest>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestData: TaskGeneratorRequest = req.body;

      console.log("📥 Request to generate task");
      console.log(`   Curriculum: ${requestData.curriculum_path}`);
      console.log(`   Country: ${requestData.country_code}`);
      console.log(`   Target Group: ${requestData.target_group}`);
      console.log(`   Difficulty: ${requestData.difficulty_level}`);
      console.log(`   Model: ${requestData.educational_model}`);
      console.log(`   Images: ${requestData.number_of_images}`);
      console.log(`   Template: ${requestData.display_template}\n`);

      // Generate the task with comprehensive configuration
      const result = await this.taskGenerator.generateTask(requestData);

      // Return the task data in new response format
      const response: TaskGeneratorResponse = {
        task_id: result.taskId,
        status: "generated",
        task_data: result.generatedTask,
      };

      res.status(201).json(response);
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
      const generatedTask = await this.taskStorage.getTask(taskId);

      if (!generatedTask) {
        res.status(404).json({
          error: "Task not found",
          message: `No task found with ID: ${taskId}`,
        });
        return;
      }

      // Return the task data in response format
      const response: TaskGeneratorResponse = {
        task_id: taskId,
        status: "generated",
        task_data: generatedTask,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
