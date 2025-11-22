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
exports.TaskGeneratorService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const utils_1 = require("../utils");
const text_generator_service_1 = require("./text-generator.service");
const image_generator_service_1 = require("./image-generator.service");
const task_storage_service_1 = require("./task-storage.service");
class TaskGeneratorService {
    constructor() {
        this.textGenerator = new text_generator_service_1.TextGeneratorService();
        this.imageGenerator = new image_generator_service_1.ImageGeneratorService();
        this.taskStorage = new task_storage_service_1.TaskStorageService();
        this.taskPromptTemplate = this.loadTaskPromptTemplate();
    }
    /**
     * Loads the task generation prompt template
     */
    loadTaskPromptTemplate() {
        const templatePath = path.join(__dirname, "../genai/prompts/task_generation.md");
        if (fs.existsSync(templatePath)) {
            return fs.readFileSync(templatePath, "utf-8");
        }
        // Fallback to a basic prompt if template doesn't exist
        return `Generate an engaging educational math task following these guidelines:
- Create an immersive narrative with real-world context
- Include specific roles and scenarios
- Present concrete data and challenges
- Make the problem professionally relevant
- Ensure the task is solvable and educational`;
    }
    /**
     * Generates a complete task with description and images
     * @param topic Optional topic or theme for the task
     * @param numImages Number of images to generate (default: 2)
     * @returns Promise that resolves to the generated task and storage path
     */
    async generateTask(topic, numImages = 2) {
        console.log("🚀 Starting task generation...\n");
        // Generate task description
        let prompt = this.taskPromptTemplate;
        if (topic) {
            prompt += `\n\nGenerate a task related to: ${topic}`;
        }
        const textResult = await this.textGenerator.generate(prompt, {
            temperature: 0.8,
            maxTokens: 2000,
        });
        const taskId = (0, utils_1.generateTaskId)();
        const description = textResult.text;
        console.log(`📝 Generated task description (${taskId})\n`);
        // Generate images based on the task description
        const images = [];
        const imagePromptBase = `Create an educational, period-appropriate illustration for this math task: ${description.substring(0, 500)}`;
        for (let i = 0; i < numImages; i++) {
            console.log(`🎨 Generating image ${i + 1}/${numImages}...`);
            const imagePrompt = numImages > 1
                ? `${imagePromptBase} (Image ${i + 1} of ${numImages}, show different perspective)`
                : imagePromptBase;
            const imageResult = await this.imageGenerator.generate(imagePrompt, {
                size: "1024x1024",
                quality: "standard",
                style: "vivid",
            });
            const imageId = (0, utils_1.generateImageId)();
            images.push({
                id: imageId,
                url: imageResult.url,
            });
            console.log(`✅ Generated image ${i + 1}: ${imageId}\n`);
        }
        // Create task object
        const task = {
            id: taskId,
            description,
            images,
        };
        // Save task to storage
        const storagePath = await this.taskStorage.saveTask(task);
        console.log("🎉 Task generation completed!\n");
        return {
            task: {
                ...task,
                // Update image URLs to local storage paths
                images: task.images.map((img) => ({
                    ...img,
                    url: `/storage/tasks/${taskId}/images/${img.id}.png`,
                })),
            },
            storagePath,
        };
    }
}
exports.TaskGeneratorService = TaskGeneratorService;
