import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";
import { TaskGeneratorRequest, TaskGeneratorResponse } from "../types";

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
    req: Request<Record<string, never>, unknown, TaskGeneratorRequest>,
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
   * GET /tasks/:taskId?country_code=XX&curriculum_path=...
   * Retrieves a specific task by ID
   * Requires country_code and curriculum_path query parameters to locate the task
   */
  getTaskById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { taskId } = req.params;
      const { country_code, curriculum_path } = req.query;

      // Validate required query parameters
      if (!country_code || typeof country_code !== "string") {
        res.status(400).json({
          error: "Missing required parameter",
          message: "Query parameter 'country_code' is required",
        });
        return;
      }

      if (!curriculum_path || typeof curriculum_path !== "string") {
        res.status(400).json({
          error: "Missing required parameter",
          message: "Query parameter 'curriculum_path' is required",
        });
        return;
      }

      console.log(`📥 Request to get task: ${taskId}`);
      console.log(`   Country: ${country_code}`);
      console.log(`   Curriculum: ${curriculum_path}`);

      // Create a minimal request object to locate the curriculum directory
      const request: Pick<TaskGeneratorRequest, "country_code" | "curriculum_path"> = {
        country_code: country_code as string,
        curriculum_path: curriculum_path as string,
      };

      // Retrieve the task
      const generatedTask = await this.taskStorage.getTask(
        request as TaskGeneratorRequest,
        taskId
      );

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
