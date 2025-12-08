import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";
import { TaskSelectionService } from "../services/task-selection.service";
import { TaskGeneratorRequest, TaskGeneratorResponse } from "../types";
import { getFirestore } from "../config/firebase.config";
import { AuthRequest } from "../middleware/auth.middleware";

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

  /**
   * POST /save-task
   * Saves a generated task to Firestore database
   */
  saveTask = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { task_id, task_data, curriculum_path, country_code } = req.body;

      // Validate required fields
      if (!task_id || !task_data) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: task_id and task_data are required",
        });
        return;
      }

      // Get authenticated user from request (added by auth middleware)
      const authReq = req as AuthRequest;
      const authenticatedUser = authReq.user;

      if (!authenticatedUser) {
        res.status(401).json({
          success: false,
          message: "Authentication required to save tasks",
        });
        return;
      }

      // Get creator name from JWT token (no database lookup needed!)
      const creatorName = authenticatedUser.name || authenticatedUser.email || 'Unknown Teacher';

      console.log(`📥 Request to save task: ${task_id}`);
      console.log(`   Curriculum path: ${curriculum_path}`);
      console.log(`   Created by: ${authenticatedUser.uid} (${creatorName})`);

      const db = getFirestore();

      // Parse curriculum path to extract fields for basic metadata
      // Format: "mathematics:grade_9_10:Topic1:Topic2:SubTopic"
      let subject = 'mathematics';
      let gradeLevel = 'grade_9_10';
      let subjectMappingPath = '';

      if (curriculum_path) {
        const parts = curriculum_path.split(':');
        if (parts.length >= 2) {
          subject = parts[0];
          gradeLevel = parts[1];
        }
        if (parts.length >= 3) {
          // Store the topic hierarchy for display purposes
          subjectMappingPath = parts.slice(2).join(' > ');
        }
      }

      console.log(`   Extracted - Subject: ${subject}, Grade: ${gradeLevel}`);

      // Extract educational model from task_data metadata
      const educationalModel = task_data.metadata?.educational_model || 'secular';

      // Create the task document with proper schema for getTasks query
      const taskDoc = {
        // Original fields from save request
        task_id,
        task_data,
        curriculum_path: curriculum_path || 'unknown',

        // Extracted fields for metadata and display
        subject,
        gradeLevel,
        subjectMappingPath, // Human-readable path like "Halmazok > Halmazműveletek > Unió"

        // Task metadata
        title: task_data.description ? this.extractTitleFromHtml(task_data.description) : 'Untitled Task',
        description: task_data.description || '',
        content: {
          description: task_data.description,
          solution: task_data.solution,
          images: task_data.images || [],
        },

        // User and location info
        country_code: country_code || 'US',
        educationalModel: educationalModel,
        created_by: authenticatedUser.uid,
        creatorName: creatorName,

        // Publishing and metrics
        isPublished: true,
        publishedAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Task properties (from metadata or defaults)
        difficultyLevel: task_data.metadata?.difficulty_level || 'medium',
        estimatedDurationMinutes: task_data.metadata?.estimated_time_minutes || 30,
        tags: task_data.metadata?.tags || [],

        // Statistics
        viewCount: 0,
        completionCount: 0,
        ratingAverage: 0,
        ratingCount: 0,
      };

      // Save to Firestore
      await db.collection('tasks').doc(task_id).set(taskDoc);

      console.log(`✅ Task saved successfully: ${task_id}`);

      // Generate public share link
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const publicShareLink = `${baseUrl}/tasks/${task_id}`;

      res.status(201).json({
        success: true,
        message: "Task saved successfully",
        task_id,
        public_share_link: publicShareLink,
      });
    } catch (error) {
      console.error('❌ Error saving task:', error);
      next(error);
    }
  };

  /**
   * Helper method to extract title from HTML description
   */
  private extractTitleFromHtml(html: string): string {
    // Extract text from <h1> tag if present
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      return h1Match[1].replace(/<[^>]*>/g, '').trim();
    }

    // Otherwise extract first 50 chars
    const textOnly = html.replace(/<[^>]*>/g, '').trim();
    return textOnly.substring(0, 50) + (textOnly.length > 50 ? '...' : '');
  }
}
