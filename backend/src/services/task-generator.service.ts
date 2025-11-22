import * as path from "path";
import * as fs from "fs";
import { Task, TaskImage, TaskGenerationResult } from "../types";
import { generateTaskId, generateImageId } from "../utils";
import { TextGeneratorService } from "./text-generator.service";
import { ImageGeneratorService } from "./image-generator.service";
import { TaskStorageService } from "./task-storage.service";

export class TaskGeneratorService {
  private textGenerator: TextGeneratorService;
  private imageGenerator: ImageGeneratorService;
  private taskStorage: TaskStorageService;
  private taskPromptTemplate: string;

  constructor() {
    this.textGenerator = new TextGeneratorService();
    this.imageGenerator = new ImageGeneratorService();
    this.taskStorage = new TaskStorageService();
    this.taskPromptTemplate = this.loadTaskPromptTemplate();
  }

  /**
   * Loads the task generation prompt template
   */
  private loadTaskPromptTemplate(): string {
    const templatePath = path.join(
      __dirname,
      "../genai/prompts/task_generation.md"
    );

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
  async generateTask(
    topic?: string,
    numImages: number = 2
  ): Promise<TaskGenerationResult> {
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

    const taskId = generateTaskId();
    const description = textResult.text;

    console.log(`📝 Generated task description (${taskId})\n`);

    // Generate images based on the task description
    const images: TaskImage[] = [];
    const imagePromptBase = `Create an educational, period-appropriate illustration for this math task: ${description.substring(0, 500)}`;

    for (let i = 0; i < numImages; i++) {
      console.log(`🎨 Generating image ${i + 1}/${numImages}...`);

      const imagePrompt =
        numImages > 1
          ? `${imagePromptBase} (Image ${i + 1} of ${numImages}, show different perspective)`
          : imagePromptBase;

      const imageResult = await this.imageGenerator.generate(imagePrompt, {
        size: "1024x1024",
        quality: "standard",
        style: "vivid",
      });

      const imageId = generateImageId();
      images.push({
        id: imageId,
        url: imageResult.url,
      });

      console.log(`✅ Generated image ${i + 1}: ${imageId}\n`);
    }

    // Create task object
    const task: Task = {
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
