import * as path from "path";
import * as fs from "fs";
import {
  TaskGenerationResult,
  TaskGeneratorRequest,
  GeneratedTask,
  SolutionStep,
  TaskImage,
  TaskMetadata,
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

    // Request structured response with title and solution steps
    prompt += `\n## OUTPUT FORMAT\n`;
    prompt += `Please provide the response in the following structure:\n`;
    prompt += `1. A clear, engaging title for the task\n`;
    prompt += `2. The main story/problem text in markdown format\n`;
    prompt += `3. Solution steps with descriptions, formulas (in LaTeX), and explanations\n`;

    return prompt;
  }

  /**
   * Parses the AI-generated text into structured solution steps
   */
  private parseSolutionSteps(text: string): SolutionStep[] {
    // Simple parsing - in production, you'd want more sophisticated parsing
    const steps: SolutionStep[] = [];
    const lines = text.split('\n');
    let stepNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.match(/^(Step|step|\d+\.)/i)) {
        steps.push({
          step_number: stepNumber++,
          description: line,
          explanation: lines[i + 1]?.trim() || undefined,
        });
      }
    }

    // If no steps found, create a single step with the full text
    if (steps.length === 0) {
      steps.push({
        step_number: 1,
        description: "Solution",
        explanation: text,
      });
    }

    return steps;
  }

  /**
   * Extracts title from generated text
   */
  private extractTitle(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2);
      }
    }
    return "Mathematical Task";
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

    // Extract title from generated text
    const title = this.extractTitle(description);

    // Parse solution steps from the description
    const solutionSteps = this.parseSolutionSteps(description);

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
          image_id: imageId,
          url: imageResult.url,
          type: i === 0 ? "main" : "secondary",
          aspect_ratio: "1:1",
          prompt_used: imagePrompt,
        });

        console.log(`✅ Generated image ${i + 1}: ${imageId}\n`);
      }
    } else {
      console.log(`📝 No images requested\n`);
    }

    // Create metadata
    const metadata: TaskMetadata = {
      curriculum_path: request.curriculum_path,
      target_group: request.target_group,
      difficulty_level: request.difficulty_level,
      educational_model: request.educational_model,
      country_code: request.country_code,
      tags: request.custom_keywords || [],
    };

    // Create the generated task object
    const generatedTask: GeneratedTask = {
      title,
      story_text: description,
      solution_steps: solutionSteps,
      images,
      metadata,
      is_editable: true,
      created_at: new Date().toISOString(),
    };

    // Save task to storage
    const storagePath = await this.taskStorage.saveTask(taskId, generatedTask);

    console.log("🎉 Task generation completed!\n");

    return {
      taskId,
      storagePath,
      generatedTask: {
        ...generatedTask,
        // Update image URLs to local storage paths
        images: generatedTask.images.map((img) => ({
          ...img,
          url: `/storage/tasks/${taskId}/images/${img.image_id}.png`,
        })),
      },
    };
  }
}
