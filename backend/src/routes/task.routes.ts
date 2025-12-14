import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { requireAuthenticatedTeacher } from "../middleware/auth.middleware";
import { requireTeacher, requireTaskCredits } from "../middleware/role.middleware";

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * /generate-task:
 *   post:
 *     summary: Generate a new educational math task
 *     description: |
 *       Generates a comprehensive educational math task with AI-powered description (using GPT-4o)
 *       and optional educational images (using DALL-E-3). The task is configured based on curriculum
 *       path, target audience, difficulty level, educational model, and precision settings.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Comprehensive configuration for task generation
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateTaskRequest'
 *           examples:
 *             basicAlgebra:
 *               summary: Basic algebra task for mixed group
 *               value:
 *                 curriculum_path: "math:grade_9_10:algebra:linear_equations:solving_basic_equations"
 *                 country_code: "US"
 *                 target_group: "mixed"
 *                 difficulty_level: "medium"
 *                 educational_model: "secular"
 *                 number_of_images: 2
 *                 display_template: "modern"
 *                 precision_settings:
 *                   constant_precision: 2
 *                   intermediate_precision: 4
 *                   final_answer_precision: 2
 *                   use_exact_values: false
 *                 custom_keywords: []
 *                 template_id: ""
 *             advancedGeometry:
 *               summary: Advanced geometry with custom keywords
 *               value:
 *                 curriculum_path: "math:grade_11_12:geometry:circles:arc_length"
 *                 country_code: "GB"
 *                 target_group: "boys"
 *                 difficulty_level: "hard"
 *                 educational_model: "traditional"
 *                 number_of_images: 1
 *                 display_template: "classic"
 *                 precision_settings:
 *                   constant_precision: 4
 *                   intermediate_precision: 6
 *                   final_answer_precision: 3
 *                   use_exact_values: true
 *                 custom_keywords: ["Renaissance", "architecture", "astronomy"]
 *                 template_id: ""
 *             noImages:
 *               summary: Text-only task
 *               value:
 *                 curriculum_path: "math:grade_7_8:statistics:mean_median_mode"
 *                 country_code: "HU"
 *                 target_group: "girls"
 *                 difficulty_level: "easy"
 *                 educational_model: "progressive"
 *                 number_of_images: 0
 *                 display_template: "minimal"
 *                 precision_settings:
 *                   constant_precision: 2
 *                   intermediate_precision: 3
 *                   final_answer_precision: 1
 *                   use_exact_values: false
 *                 custom_keywords: ["sports", "music"]
 *                 template_id: ""
 *     responses:
 *       201:
 *         description: Task successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskGeneratorResponse'
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Teacher role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/generate-task", requireAuthenticatedTeacher, taskController.generateTask);

/**
 * V2 API: Generate task text only (no solution, no images) with variation support
 * POST /generate-task-text
 */
router.post("/generate-task-text", requireAuthenticatedTeacher, taskController.generateTaskText);

/**
 * V2 API: AI selects the best task from 3 variations
 * POST /select-best-task
 */
router.post("/select-best-task", requireAuthenticatedTeacher, taskController.selectBestTask);

/**
 * V2 API: Generate solution only for given task text
 * POST /generate-task-solution
 */
router.post("/generate-task-solution", requireAuthenticatedTeacher, taskController.generateTaskSolution);

/**
 * V2 API: Generate images only for given task text
 * POST /generate-task-images
 */
router.post("/generate-task-images", requireAuthenticatedTeacher, taskController.generateTaskImages);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get a task by ID
 *     description: Retrieves a previously generated task by its unique identifier. Returns the task description and image URLs.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^task_[a-f0-9]{32}$'
 *         description: The unique task identifier (format task_[32_hex_chars])
 *         example: task_a1b2c3d4e5f6789012345678901234ab
 *     responses:
 *       200:
 *         description: Task found and returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskGeneratorResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/tasks/:taskId", taskController.getTaskById);

/**
 * POST /save-task
 * Saves a generated task to Firestore database
 * Requires authentication, teacher role, and available task credits
 */
router.post("/save-task", requireAuthenticatedTeacher, requireTaskCredits, taskController.saveTask);

export default router;
