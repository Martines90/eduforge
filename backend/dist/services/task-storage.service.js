"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStorageService = void 0;
const path = __importStar(require("path"));
const config_1 = require("../config");
const utils_1 = require("../utils");
class TaskStorageService {
    /**
     * Gets the task directory path
     * @param taskId The task ID
     * @returns The full path to the task directory
     */
    getTaskDir(taskId) {
        return path.join(config_1.config.storageDir, "tasks", taskId);
    }
    /**
     * Gets the task description file path
     * @param taskId The task ID
     * @returns The full path to the description.md file
     */
    getDescriptionPath(taskId) {
        return path.join(this.getTaskDir(taskId), "description.md");
    }
    /**
     * Gets the images directory path for a task
     * @param taskId The task ID
     * @returns The full path to the images directory
     */
    getImagesDir(taskId) {
        return path.join(this.getTaskDir(taskId), "images");
    }
    /**
     * Gets the image file path
     * @param taskId The task ID
     * @param imageId The image ID
     * @returns The full path to the image file
     */
    getImagePath(taskId, imageId) {
        return path.join(this.getImagesDir(taskId), `${imageId}.png`);
    }
    /**
     * Saves a task to storage
     * @param task The task to save
     * @returns Promise that resolves to the storage path
     */
    async saveTask(task) {
        const taskDir = this.getTaskDir(task.id);
        const imagesDir = this.getImagesDir(task.id);
        // Create directories
        (0, utils_1.ensureDirectoryExists)(taskDir);
        (0, utils_1.ensureDirectoryExists)(imagesDir);
        // Save description
        const descriptionPath = this.getDescriptionPath(task.id);
        await (0, utils_1.writeFile)(descriptionPath, task.description);
        // Download and save images
        for (const image of task.images) {
            const imagePath = this.getImagePath(task.id, image.id);
            await (0, utils_1.downloadFile)(image.url, imagePath);
            console.log(`✅ Saved image: ${image.id}`);
        }
        console.log(`✅ Task saved to: ${taskDir}`);
        return taskDir;
    }
    /**
     * Retrieves a task from storage
     * @param taskId The task ID to retrieve
     * @returns The task object with local file URLs
     */
    async getTask(taskId) {
        const taskDir = this.getTaskDir(taskId);
        // Check if task exists
        if (!(0, utils_1.exists)(taskDir)) {
            return null;
        }
        // Read description
        const descriptionPath = this.getDescriptionPath(taskId);
        if (!(0, utils_1.exists)(descriptionPath)) {
            return null;
        }
        const description = await (0, utils_1.readFile)(descriptionPath);
        // Find all image files in the images directory
        const imagesDir = this.getImagesDir(taskId);
        const images = [];
        if ((0, utils_1.exists)(imagesDir)) {
            const fs = await Promise.resolve().then(() => __importStar(require("fs")));
            const files = await fs.promises.readdir(imagesDir);
            for (const file of files) {
                if (file.endsWith(".png")) {
                    const imageId = file.replace(".png", "");
                    // Return relative URL path for the API
                    images.push({
                        id: imageId,
                        url: `/storage/tasks/${taskId}/images/${file}`,
                    });
                }
            }
        }
        return {
            id: taskId,
            description,
            images,
        };
    }
    /**
     * Checks if a task exists
     * @param taskId The task ID to check
     * @returns True if the task exists, false otherwise
     */
    taskExists(taskId) {
        return (0, utils_1.exists)(this.getTaskDir(taskId));
    }
}
exports.TaskStorageService = TaskStorageService;
