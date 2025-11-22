import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const router = Router();
const taskController = new TaskController();

/**
 * @swagger
 * /generate-task:
 *   post:
 *     summary: Generate a new educational math task
 *     description: Generates a new task with AI-powered description (using GPT-4o) and educational images (using DALL-E-3). The task is saved to storage with a unique ID.
 *     tags: [Tasks]
 *     requestBody:
 *       description: Optional parameters for task generation
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateTaskRequest'
 *           examples:
 *             default:
 *               summary: Generate task with defaults
 *               value: {}
 *             withTopic:
 *               summary: Generate task with specific topic
 *               value:
 *                 topic: "Ancient Roman architecture and engineering"
 *                 numImages: 2
 *             multipleImages:
 *               summary: Generate task with multiple images
 *               value:
 *                 topic: "Renaissance mathematics"
 *                 numImages: 3
 *     responses:
 *       201:
 *         description: Task successfully generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/generate-task", taskController.generateTask);

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
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/tasks/:taskId", taskController.getTaskById);

export default router;
