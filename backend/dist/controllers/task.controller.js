"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskController = void 0;
const task_generator_service_1 = require("../services/task-generator.service");
const task_storage_service_1 = require("../services/task-storage.service");
class TaskController {
    constructor() {
        /**
         * POST /generate-task
         * Generates a new task with description and images
         */
        this.generateTask = async (req, res, next) => {
            try {
                const { topic, numImages } = req.body;
                // Validate numImages if provided
                const imageCount = numImages && !isNaN(parseInt(numImages))
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
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * GET /tasks/:taskId
         * Retrieves a specific task by ID
         */
        this.getTaskById = async (req, res, next) => {
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
            }
            catch (error) {
                next(error);
            }
        };
        this.taskGenerator = new task_generator_service_1.TaskGeneratorService();
        this.taskStorage = new task_storage_service_1.TaskStorageService();
    }
}
exports.TaskController = TaskController;
