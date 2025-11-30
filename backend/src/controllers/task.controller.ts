import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";
import { TaskSelectionService } from "../services/task-selection.service";
import { TaskGeneratorRequest, TaskGeneratorResponse } from "../types";

export class TaskController {
  private taskGenerator: TaskGeneratorService;
  private taskStorage: TaskStorageService;
  private taskSelection: TaskSelectionService;

  constructor() {
    this.taskGenerator = new TaskGeneratorService();
    this.taskStorage = new TaskStorageService();
    this.taskSelection = new TaskSelectionService();
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

  /**
   * POST /generate-task-text
   * V2 API: Generates task text only (no solution, no images) with variation support
   */
  generateTaskText = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestData: TaskGeneratorRequest & { variation_index?: number } = req.body;

      console.log("📥 Request to generate task text");
      console.log(`   Curriculum: ${requestData.curriculum_path}`);
      console.log(`   Variation: ${requestData.variation_index || 1}`);

      const taskData = await this.taskGenerator.generateTaskTextOnly(requestData);

      res.status(200).json({
        success: true,
        task_data: taskData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /select-best-task
   * V2 API: AI selects the best task from 3 variations
   */
  selectBestTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { task_variations, criteria } = req.body;

      if (!task_variations || !Array.isArray(task_variations) || task_variations.length !== 3) {
        res.status(400).json({
          success: false,
          message: "Expected exactly 3 task variations in task_variations array",
        });
        return;
      }

      if (!criteria) {
        res.status(400).json({
          success: false,
          message: "Missing criteria object",
        });
        return;
      }

      console.log("📥 Request to select best task from 3 variations");

      const selection = await this.taskSelection.selectBestTask(
        task_variations,
        criteria
      );

      res.status(200).json({
        success: true,
        selection,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /generate-task-solution
   * V2 API: Generates solution only for given task text
   */
  generateTaskSolution = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { task_text, precision_settings, educational_model } = req.body;

      if (!task_text || !task_text.title || !task_text.story_text) {
        res.status(400).json({
          success: false,
          message: "Missing required task_text object with title and story_text",
        });
        return;
      }

      console.log("📥 Request to generate solution");
      console.log(`   Task: ${task_text.title}`);

      // Build a minimal request object for solution generation
      const request: any = {
        precision_settings: precision_settings || {
          constant_precision: 2,
          intermediate_precision: 4,
          final_answer_precision: 2,
          use_exact_values: false,
        },
        educational_model: educational_model || "constructive",
        curriculum_path: task_text.metadata?.curriculum_path || "math:general",
        difficulty_level: task_text.metadata?.difficulty_level || "medium",
        target_group: task_text.metadata?.target_group || "mixed",
        country_code: "HU",
      };

      const solutionData = await this.taskGenerator.generateSolutionOnly(
        task_text,
        request
      );

      res.status(200).json({
        success: true,
        solution_data: solutionData,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /generate-task-images
   * V2 API: Generates images only for given task text
   */
  generateTaskImages = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { task_text, number_of_images } = req.body;

      if (!task_text || !task_text.title || !task_text.story_text) {
        res.status(400).json({
          success: false,
          message: "Missing required task_text object with title and story_text",
        });
        return;
      }

      const numImages = number_of_images || 0;

      console.log("📥 Request to generate images");
      console.log(`   Task: ${task_text.title}`);
      console.log(`   Images: ${numImages}`);

      const images = await this.taskGenerator.generateImagesOnly(
        task_text,
        numImages,
        task_text.metadata?.display_template || "modern",
        task_text.metadata?.target_group || "mixed"
      );

      res.status(200).json({
        success: true,
        images,
      });
    } catch (error) {
      next(error);
    }
  };
}
