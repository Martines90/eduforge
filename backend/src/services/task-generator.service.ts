import * as path from "path";
import * as fs from "fs";
import {
  Task,
  TaskImage,
  TaskGenerationResult,
  TaskGeneratorRequest,
} from "../types";
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
   * Builds a comprehensive prompt based on the task generator request
   */
  private buildPrompt(request: TaskGeneratorRequest): string {
    let prompt = this.taskPromptTemplate;

    prompt += `\n\n## TASK CONFIGURATION\n`;
    prompt += `Curriculum Path: ${request.curriculum_path}\n`;
    prompt += `Country/Locale: ${request.country_code}\n`;
    prompt += `Target Audience: ${request.target_group}\n`;
    prompt += `Difficulty Level: ${request.difficulty_level}\n`;
    prompt += `Educational Model: ${request.educational_model}\n`;
    prompt += `Display Template: ${request.display_template}\n`;

    // Add precision settings
    prompt += `\n## MATHEMATICAL PRECISION\n`;
    prompt += `Constant Precision: ${request.precision_settings.constant_precision} decimal places\n`;
    prompt += `Intermediate Precision: ${request.precision_settings.intermediate_precision} decimal places\n`;
    prompt += `Final Answer Precision: ${request.precision_settings.final_answer_precision} decimal places\n`;
    if (request.precision_settings.use_exact_values) {
      prompt += `Use exact values (fractions, π symbol) where appropriate\n`;
    }

    // Add custom keywords if provided
    if (request.custom_keywords && request.custom_keywords.length > 0) {
      prompt += `\n## STORY INSPIRATION KEYWORDS\n`;
      prompt += `Incorporate these themes/keywords: ${request.custom_keywords.join(", ")}\n`;
    }

    // Add specific instructions based on configuration
    prompt += `\n## SPECIFIC INSTRUCTIONS\n`;
    prompt += `- Adapt language and cultural references for ${request.country_code}\n`;
    prompt += `- Create content appropriate for ${request.target_group}\n`;
    prompt += `- Follow ${request.educational_model} educational principles\n`;
    prompt += `- Design for ${request.display_template} display template\n`;

    return prompt;
  }

  /**
   * Generates a complete task with description and images based on comprehensive configuration
   * @param request TaskGeneratorRequest with all configuration parameters
   * @returns Promise that resolves to the generated task and storage path
   */
  async generateTask(
    request: TaskGeneratorRequest
  ): Promise<TaskGenerationResult> {
    console.log("🚀 Starting task generation...\n");

    // Build comprehensive prompt from request
    const prompt = this.buildPrompt(request);

    const textResult = await this.textGenerator.generate(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
    });

    const taskId = generateTaskId();
    const description = textResult.text;

    console.log(`📝 Generated task description (${taskId})\n`);

    // Generate images based on the task description
    const images: TaskImage[] = [];
    const numImages = request.number_of_images;

    if (numImages > 0) {
      const imagePromptBase = `Create an educational illustration in ${request.display_template} style for ${request.target_group}. Math task: ${description.substring(0, 500)}`;

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
    } else {
      console.log(`📝 No images requested\n`);
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
