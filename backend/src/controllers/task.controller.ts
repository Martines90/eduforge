import { Request, Response, NextFunction } from "express";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskStorageService } from "../services/task-storage.service";
import { TaskSelectionService } from "../services/task-selection.service";
import { ImageStorageService } from "../services/image-storage.service";
import { uploadTaskPDF } from "../services/pdf-storage.service";
import { TaskGeneratorRequest, TaskGeneratorResponse } from "../types";
import { getFirestore } from "../config/firebase.config";
import { AuthRequest } from "../middleware/auth.middleware";
import { GuestAuthRequest } from "../middleware/guest-auth.middleware";
import { deductTaskCredit } from "../services/auth.service";
import {
  incrementGuestGeneration,
  getRemainingGenerations,
} from "../services/guest-auth.service";
import { TRIAL_START_CREDITS } from "../constants/credits";
import { DEFAULT_NUMBER_OF_IMAGES } from "@eduforger/shared";
import { validateCharacterLength } from "@eduforger/shared/task-generation";

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
      console.log(`   Template: ${requestData.display_template}\n`);

      // Generate the task with comprehensive configuration
      const result = await this.taskGenerator.generateTask(requestData);

      // Store images permanently in Firebase Storage immediately after generation
      if (
        result.generatedTask.images &&
        result.generatedTask.images.length > 0
      ) {
        console.log(
          `📸 Storing ${result.generatedTask.images.length} image(s) permanently...`
        );

        try {
          const imageStorage = new ImageStorageService();

          // Extract URLs from TaskImage objects
          const temporaryUrls = result.generatedTask.images.map(
            (img) => img.url
          );

          // Download from BFL and upload to Firebase Storage
          const permanentUrls = await imageStorage.storeImagesPermanently(
            temporaryUrls,
            result.taskId
          );

          // Update the task images with permanent URLs
          result.generatedTask.images = result.generatedTask.images.map(
            (img, index) => ({
              ...img,
              url: permanentUrls[index],
            })
          );

          console.log(`✅ Images stored permanently in Firebase Storage`);
        } catch (imageError: any) {
          console.error(
            "⚠️ Failed to store images permanently:",
            imageError.message
          );
          console.warn(
            "⚠️ Continuing with temporary BFL URLs (may have CORS issues)"
          );
          // Continue with temporary URLs - user can still see the task
        }
      }

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
      const request: Pick<
        TaskGeneratorRequest,
        "country_code" | "curriculum_path"
      > = {
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
   * GET /get-3-random-locations
   * V2 API: Returns 3 unique random locations for the 3 task variations
   */
  get3RandomLocations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { generate3UniqueLocations } =
        await import("../utils/story-inspiration.helper");
      const locations = generate3UniqueLocations();

      console.log("📥 Request for 3 random locations");
      console.log(`   🌍 Generated locations: ${locations.join(", ")}`);

      res.status(200).json({
        success: true,
        locations,
      });
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
      const requestData: TaskGeneratorRequest & {
        variation_index?: number;
        assigned_location?: string;
      } = req.body;

      console.log("📥 Request to generate task text");
      console.log(`   Curriculum: ${requestData.curriculum_path}`);
      console.log(`   Variation: ${requestData.variation_index || 1}`);
      if (requestData.assigned_location) {
        console.log(
          `   🌍 Assigned location: ${requestData.assigned_location}`
        );
      }

      const taskData =
        await this.taskGenerator.generateTaskTextOnly(requestData);

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

      if (
        !task_variations ||
        !Array.isArray(task_variations) ||
        task_variations.length !== 3
      ) {
        res.status(400).json({
          success: false,
          message:
            "Expected exactly 3 task variations in task_variations array",
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
   * POST /refine-task-text
   * V2 API: Refines a selected task to ensure mathematical accuracy and narrative coherence
   */
  refineTaskText = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { task_text, curriculum_path, difficulty_level, educational_model, target_group, country_code } =
        req.body;

      if (!task_text || !task_text.title || !task_text.story_text || !task_text.questions) {
        res.status(400).json({
          success: false,
          message:
            "Missing required task_text object with title, story_text, and questions",
        });
        return;
      }

      console.log("📥 Request to refine task text");
      console.log(`   Task: ${task_text.title}`);

      // Build a minimal request object for refinement
      const request: TaskGeneratorRequest = {
        curriculum_path: curriculum_path || task_text.metadata?.curriculum_path || "math:general",
        difficulty_level: difficulty_level || task_text.metadata?.difficulty_level || "medium",
        educational_model: educational_model || task_text.metadata?.educational_model || "secular",
        target_group: target_group || task_text.metadata?.target_group || "mixed",
        country_code: country_code || task_text.metadata?.country_code || "US",
        display_template: "modern",
        precision_settings: {
          constant_precision: 2,
          intermediate_precision: 4,
          final_answer_precision: 2,
          use_exact_values: false,
        },
        custom_keywords: [],
        template_id: "",
      };

      const refinementData = await this.taskGenerator.refineTaskText(
        task_text,
        request
      );

      res.status(200).json({
        success: true,
        refinement_data: refinementData,
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
      const { task_text, precision_settings, educational_model, country_code } =
        req.body;

      if (!task_text || !task_text.title || !task_text.story_text) {
        res.status(400).json({
          success: false,
          message:
            "Missing required task_text object with title and story_text",
        });
        return;
      }

      console.log("📥 Request to generate solution");
      console.log(`   Task: ${task_text.title}`);
      console.log(
        `   Country: ${country_code || task_text.metadata?.country_code || "US"}`
      );

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
        country_code: country_code || task_text.metadata?.country_code || "US",
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
      const { task_text, visual_description } = req.body;

      if (!task_text || !task_text.title || !task_text.story_text) {
        res.status(400).json({
          success: false,
          message:
            "Missing required task_text object with title and story_text",
        });
        return;
      }

      console.log("📥 Request to generate images");
      console.log(`   Task: ${task_text.title}`);
      console.log(`   Images: ${DEFAULT_NUMBER_OF_IMAGES}`);
      if (visual_description) {
        console.log(
          `   Visual description provided: ${visual_description.substring(0, 100)}...`
        );
      }

      const images = await this.taskGenerator.generateImagesOnly(
        task_text,
        DEFAULT_NUMBER_OF_IMAGES,
        task_text.metadata?.display_template || "modern",
        task_text.metadata?.target_group || "mixed",
        visual_description // Pass the AI-generated visual description
      );

      // Store images permanently in Firebase Storage
      if (images && images.length > 0) {
        console.log(`📸 Storing ${images.length} image(s) permanently...`);

        try {
          const imageStorage = new ImageStorageService();

          // Generate a temporary task ID for image storage
          const tempTaskId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Extract URLs from TaskImage objects
          const temporaryUrls = images.map((img) => img.url);

          // Download from BFL and upload to Firebase Storage
          const permanentUrls = await imageStorage.storeImagesPermanently(
            temporaryUrls,
            tempTaskId
          );

          // Update the image URLs with permanent URLs
          images.forEach((img, index) => {
            img.url = permanentUrls[index];
          });

          console.log(`✅ Images stored permanently in Firebase Storage`);
        } catch (imageError: any) {
          console.error(
            "⚠️ Failed to store images permanently:",
            imageError.message
          );
          console.warn(
            "⚠️ Continuing with temporary BFL URLs (may have CORS issues)"
          );
          // Continue with temporary URLs - user can still use them
        }
      }

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
          message:
            "Missing required fields: task_id and task_data are required",
        });
        return;
      }

      // Validate task description character length using shared validation
      if (task_data.description) {
        const validation = validateCharacterLength(task_data.description, true); // Use edit mode limits

        if (!validation.isValid) {
          res.status(400).json({
            success: false,
            error: "INVALID_TASK_LENGTH",
            message: validation.isTooShort
              ? `Task description is too short. Minimum ${validation.min} characters required, but got ${validation.count}.`
              : `Task description is too long. Maximum ${validation.max} characters allowed, but got ${validation.count}.`,
            validation: {
              count: validation.count,
              min: validation.min,
              max: validation.max,
              isTooShort: validation.isTooShort,
              isTooLong: validation.isTooLong,
            },
          });
          return;
        }

        console.log(`✅ Task description validated: ${validation.count} characters (${validation.min}-${validation.max})`);
      }

      // Get authenticated user from request (added by auth middleware)
      const authReq = req as AuthRequest;
      const guestReq = req as GuestAuthRequest;
      const authenticatedUser = authReq.user;

      // EXPLICITLY BLOCK GUEST USERS FROM SAVING TASKS
      if (guestReq.isGuest) {
        res.status(403).json({
          success: false,
          error: "Forbidden",
          message: `Guest users cannot save tasks. Please register to save your tasks and get ${TRIAL_START_CREDITS} free task generation credits!`,
        });
        return;
      }

      if (!authenticatedUser) {
        res.status(401).json({
          success: false,
          message: "Authentication required to save tasks",
        });
        return;
      }

      // Get creator name from JWT token (no database lookup needed!)
      const creatorName =
        authenticatedUser.name || authenticatedUser.email || "Unknown Teacher";

      console.log(`📥 Request to save task: ${task_id}`);
      console.log(`   Curriculum path: ${curriculum_path}`);
      console.log(`   Created by: ${authenticatedUser.uid} (${creatorName})`);

      const db = getFirestore();

      // Parse curriculum path to extract fields for basic metadata
      // Format: "mathematics:grade_9_10:Topic1:Topic2:SubTopic"
      let subject = "mathematics";
      let gradeLevel = "grade_9_10";
      let subjectMappingPath = "";

      if (curriculum_path) {
        const parts = curriculum_path.split(":");
        if (parts.length >= 2) {
          subject = parts[0];
          gradeLevel = parts[1];
        }
        if (parts.length >= 3) {
          // Store the topic hierarchy for display purposes
          subjectMappingPath = parts.slice(2).join(" > ");
        }
      }

      console.log(`   Extracted - Subject: ${subject}, Grade: ${gradeLevel}`);

      // Validate teacher profile matches the task they're trying to save
      // Teachers can only save tasks for their assigned subjects and grade levels
      if (authenticatedUser.teacherRole && authenticatedUser.teacherRole !== gradeLevel) {
        res.status(403).json({
          success: false,
          error: "GRADE_LEVEL_MISMATCH",
          message: `You can only save tasks for your assigned grade level. Your profile: ${authenticatedUser.teacherRole}, Task grade: ${gradeLevel}`,
        });
        return;
      }

      if (authenticatedUser.subjects && authenticatedUser.subjects.length > 0) {
        if (!authenticatedUser.subjects.includes(subject)) {
          res.status(403).json({
            success: false,
            error: "SUBJECT_MISMATCH",
            message: `You can only save tasks for your assigned subjects. Your subjects: ${authenticatedUser.subjects.join(", ")}, Task subject: ${subject}`,
          });
          return;
        }
      }

      // Extract educational model from task_data metadata
      const educationalModel =
        task_data.metadata?.educational_model || "secular";

      // Store images permanently in Firebase Storage (if any exist)
      let permanentImages: string[] = [];
      if (task_data.images && task_data.images.length > 0) {
        console.log(
          `📸 Processing ${task_data.images.length} image(s) for permanent storage...`
        );

        try {
          const imageStorage = new ImageStorageService();

          // Extract URLs from images (handle both string and object formats)
          const temporaryUrls = task_data.images.map((img: any) =>
            typeof img === "string" ? img : img.url || img
          );

          // Download from BFL and upload to Firebase Storage
          permanentImages = await imageStorage.storeImagesPermanently(
            temporaryUrls,
            task_id
          );

          console.log(`✅ Images stored permanently in Firebase Storage`);
        } catch (imageError: any) {
          console.error(
            "⚠️ Failed to store images permanently:",
            imageError.message
          );
          console.warn("⚠️ Falling back to temporary BFL URLs");
          // Fallback to original URLs if storage fails
          permanentImages = task_data.images.map((img: any) =>
            typeof img === "string" ? img : img.url || img
          );
        }
      }

      // Create the task document with proper schema for getTasks query
      const taskDoc = {
        // Original fields from save request
        task_id,
        task_data,
        curriculum_path: curriculum_path || "unknown",

        // Extracted fields for metadata and display
        subject,
        gradeLevel,
        subjectMappingPath, // Human-readable path like "Halmazok > Halmazműveletek > Unió"

        // Task metadata
        title: task_data.description
          ? this.extractTitleFromHtml(task_data.description)
          : "Untitled Task",
        description: task_data.description || "",
        content: {
          description: task_data.description,
          solution: task_data.solution,
          images: permanentImages, // Use permanently stored Firebase Storage URLs
        },

        // User and location info
        country_code: country_code || "US",
        educationalModel: educationalModel,
        created_by: authenticatedUser.uid,
        creatorName: creatorName,

        // Publishing and metrics
        isPublished: true,
        publishedAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),

        // Task properties (from metadata or defaults)
        difficultyLevel: task_data.metadata?.difficulty_level || "medium",
        estimatedDurationMinutes:
          task_data.metadata?.estimated_time_minutes || 30,
        tags: task_data.metadata?.tags || [],

        // Statistics
        viewCount: 0,
        completionCount: 0,
        ratingAverage: 0,
        ratingCount: 0,
      };

      // Check if task already exists to determine if this is an update or new save
      const existingTaskDoc = await db.collection("tasks").doc(task_id).get();
      const isUpdate = existingTaskDoc.exists;

      if (isUpdate) {
        console.log(`📝 Updating existing task: ${task_id}`);
        // For updates, preserve certain fields and only update content
        await db
          .collection("tasks")
          .doc(task_id)
          .update({
            task_data,
            curriculum_path: curriculum_path || "unknown",
            subject,
            gradeLevel,
            subjectMappingPath,
            title: task_data.description
              ? this.extractTitleFromHtml(task_data.description)
              : "Untitled Task",
            description: task_data.description || "",
            content: {
              description: task_data.description,
              solution: task_data.solution,
              images: permanentImages,
            },
            updated_at: new Date().toISOString(),
            difficultyLevel: task_data.metadata?.difficulty_level || "medium",
            estimatedDurationMinutes:
              task_data.metadata?.estimated_time_minutes || 30,
            tags: task_data.metadata?.tags || [],
          });
        console.log(`✅ Task updated successfully: ${task_id}`);
      } else {
        console.log(`📝 Creating new task: ${task_id}`);
        // For new tasks, save the full document
        await db.collection("tasks").doc(task_id).set(taskDoc);
        console.log(`✅ Task created successfully: ${task_id}`);
      }

      // Deduct one task credit from the teacher (only for new tasks)
      let remainingCredits: number;
      if (!isUpdate) {
        try {
          remainingCredits = await deductTaskCredit(authenticatedUser.uid);
          console.log(
            `✅ Task credit deducted. Remaining credits: ${remainingCredits}`
          );
        } catch (creditError: any) {
          // If credit deduction fails, we should still return success since the task is saved
          // But log the error for monitoring
          console.error(
            "⚠️ Failed to deduct task credit:",
            creditError.message
          );
          remainingCredits = 0; // Default to 0 if we couldn't deduct
        }
      } else {
        // For updates, just fetch current credits without deducting
        try {
          const userDoc = await db
            .collection("teachers")
            .doc(authenticatedUser.uid)
            .get();
          remainingCredits = userDoc.data()?.taskCredits || 0;
        } catch (error: any) {
          console.error("⚠️ Failed to fetch task credits:", error.message);
          remainingCredits = 0;
        }
      }

      // Generate public share link using centralized config
      const { config } = await import("../config");
      const publicShareLink = `${config.frontendUrl}/tasks/${task_id}`;

      res.status(201).json({
        success: true,
        message: "Task saved successfully",
        task_id,
        public_share_link: publicShareLink,
        remaining_credits: remainingCredits,
      });
    } catch (error) {
      console.error("❌ Error saving task:", error);
      next(error);
    }
  };

  /**
   * POST /tasks/:taskId/upload-pdf
   * Uploads a generated PDF to Firebase Storage
   */
  uploadPDF = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { taskId } = req.params;

      // Check if PDF data is provided in request body
      if (!req.body.pdfData) {
        res.status(400).json({
          success: false,
          message: "Missing PDF data in request body",
        });
        return;
      }

      console.log(`📥 Request to upload PDF for task: ${taskId}`);

      // Extract task title from request body (optional)
      const taskTitle = req.body.taskTitle || req.body.title;

      // Convert base64 PDF data to buffer
      // Handle both formats: "data:application/pdf;base64,..." and "data:application/pdf;filename=...;base64,..."
      const pdfBase64 = req.body.pdfData.replace(
        /^data:application\/pdf;[^,]*,/,
        ""
      );
      const pdfBuffer = Buffer.from(pdfBase64, "base64");

      console.log(`📄 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
      console.log(
        `📄 Original data length: ${req.body.pdfData.length}, Base64 length: ${pdfBase64.length}`
      );
      if (taskTitle) {
        console.log(`📄 Task title: ${taskTitle}`);
      }

      // Upload to Firebase Storage with optional task title
      const result = await uploadTaskPDF(taskId, pdfBuffer, taskTitle);

      if (!result.success) {
        res.status(500).json({
          success: false,
          message: result.error || "Failed to upload PDF",
        });
        return;
      }

      console.log(`✅ PDF uploaded successfully: ${result.pdfUrl}`);

      res.status(200).json({
        success: true,
        message: "PDF uploaded successfully",
        pdfUrl: result.pdfUrl,
      });
    } catch (error) {
      console.error("❌ Error uploading PDF:", error);
      next(error);
    }
  };

  /**
   * POST /generate-task-guest
   * Generates a task for guest users (supports both authenticated and guest sessions)
   * Guest users are limited to 3 free generations
   * Does NOT save to database - tasks are temporary
   */
  generateTaskGuest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const requestData: TaskGeneratorRequest = req.body;
      const authReq = req as GuestAuthRequest;

      console.log("📥 Guest request to generate task");
      console.log(`   Curriculum: ${requestData.curriculum_path}`);
      console.log(`   Is Guest: ${authReq.isGuest}`);

      // Generate the task first to get the task ID
      const result = await this.taskGenerator.generateTask(requestData);

      // If this is a guest session, check and increment generation count AFTER generation
      if (authReq.isGuest && authReq.guest) {
        try {
          const session = await incrementGuestGeneration(
            authReq.guest.sessionId,
            result.taskId
          );
          const remaining = await getRemainingGenerations(
            authReq.guest.sessionId
          );

          console.log(
            `   Guest generations: ${session.generationsUsed}/${session.maxGenerations}`
          );
          console.log(`   Remaining: ${remaining}`);
        } catch (limitError: any) {
          // Guest has reached their limit
          res.status(403).json({
            success: false,
            error: "Generation limit reached",
            message: limitError.message,
            data: {
              generationsUsed: authReq.guest.generationsUsed,
              maxGenerations: authReq.guest.maxGenerations,
              limitReached: true,
            },
          });
          return;
        }
      }

      // Store images permanently in Firebase Storage
      if (
        result.generatedTask.images &&
        result.generatedTask.images.length > 0
      ) {
        console.log(
          `📸 Storing ${result.generatedTask.images.length} image(s) for guest...`
        );

        try {
          const imageStorage = new ImageStorageService();
          const temporaryUrls = result.generatedTask.images.map(
            (img) => img.url
          );
          const permanentUrls = await imageStorage.storeImagesPermanently(
            temporaryUrls,
            result.taskId
          );

          result.generatedTask.images = result.generatedTask.images.map(
            (img, index) => ({
              ...img,
              url: permanentUrls[index],
            })
          );

          console.log(`✅ Guest images stored permanently`);
        } catch (imageError: any) {
          console.error("⚠️ Failed to store guest images:", imageError.message);
        }
      }

      // Calculate remaining generations for response
      let generationsRemaining: number | null = null;
      if (authReq.isGuest && authReq.guest) {
        generationsRemaining = await getRemainingGenerations(
          authReq.guest.sessionId
        );
      }

      // Return task data with guest metadata
      const response: TaskGeneratorResponse & {
        guest_metadata?: {
          generationsUsed: number;
          maxGenerations: number;
          generationsRemaining: number;
        };
      } = {
        task_id: result.taskId,
        status: "generated",
        task_data: result.generatedTask,
      };

      if (authReq.isGuest && authReq.guest && generationsRemaining !== null) {
        response.guest_metadata = {
          generationsUsed: authReq.guest.generationsUsed + 1,
          maxGenerations: authReq.guest.maxGenerations,
          generationsRemaining,
        };
      }

      res.status(201).json(response);
    } catch (error) {
      console.error("❌ Error in guest task generation:", error);
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
      return h1Match[1].replace(/<[^>]*>/g, "").trim();
    }

    // Otherwise extract first 50 chars
    const textOnly = html.replace(/<[^>]*>/g, "").trim();
    return textOnly.substring(0, 50) + (textOnly.length > 50 ? "..." : "");
  }
}
