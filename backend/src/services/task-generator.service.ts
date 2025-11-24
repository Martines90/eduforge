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
import {
  generateTaskId,
  generateImageId,
  generateStoryInspiration,
  getMeasurementSystem,
  getLanguageForCountry,
  buildSystemPrompt,
  buildUserMessage,
} from "../utils";
import { TextGeneratorService } from "./text-generator.service";
import { ImageGeneratorService } from "./image-generator.service";
import { TaskStorageService } from "./task-storage.service";

export class TaskGeneratorService {
  private textGenerator: TextGeneratorService;
  private imageGenerator: ImageGeneratorService;
  private taskStorage: TaskStorageService;

  constructor() {
    this.textGenerator = new TextGeneratorService();
    this.imageGenerator = new ImageGeneratorService();
    this.taskStorage = new TaskStorageService();
  }

  /**
   * Loads a prompt template from the prompts directory
   */
  private loadPromptTemplate(filename: string): string {
    const templatePath = path.join(__dirname, "../genai/prompts", filename);

    if (fs.existsSync(templatePath)) {
      return fs.readFileSync(templatePath, "utf-8");
    }

    console.warn(`⚠️  Prompt template not found: ${filename}`);
    return "";
  }

  /**
   * Builds a comprehensive prompt for task story generation using the new system prompt approach
   */
  private buildTaskPrompt(
    request: TaskGeneratorRequest
  ): { systemPrompt: string; userMessage: string } {
    // Build the enhanced system prompt with all context
    const systemPrompt = buildSystemPrompt(request);

    // Build the user message (JSON input)
    const userMessage = buildUserMessage(request);

    return { systemPrompt, userMessage };
  }

  /**
   * Builds a prompt for solution generation based on the task
   */
  private buildSolutionPrompt(
    taskStory: string,
    request: TaskGeneratorRequest
  ): string {
    // Load the appropriate template based on measurement system
    const measurementSystem = getMeasurementSystem(request.country_code);
    const templateName = `solution_generation_${measurementSystem}.md`;
    let prompt = this.loadPromptTemplate(templateName);

    // Get language for the country
    const language = getLanguageForCountry(request.country_code);

    // Add language instruction at the top
    prompt =
      `**CRITICAL: Generate the entire solution in ${language}. All step descriptions, explanations, formulas, and text must be in ${language}.**\n\n` +
      prompt;

    // Replace placeholders in the solution template
    prompt = prompt.replace("{TASK_STORY_TEXT}", taskStory);
    prompt = prompt.replace(
      "{CURRICULUM_TOPIC}",
      request.curriculum_path.split(":").pop() || "math"
    );
    prompt = prompt.replace(
      "{GRADE_LEVEL}",
      this.extractGradeLevel(request.curriculum_path)
    );
    prompt = prompt.replace("{DIFFICULTY_LEVEL}", request.difficulty_level);
    prompt = prompt.replace("{TARGET_GROUP}", request.target_group);
    prompt = prompt.replace(
      "{USE_EXACT_VALUES}",
      request.precision_settings.use_exact_values ? "true" : "false"
    );
    prompt = prompt.replace(
      "{CONSTANT_PRECISION}",
      request.precision_settings.constant_precision.toString()
    );
    prompt = prompt.replace(
      "{INTERMEDIATE_PRECISION}",
      request.precision_settings.intermediate_precision.toString()
    );
    prompt = prompt.replace(
      "{FINAL_ANSWER_PRECISION}",
      request.precision_settings.final_answer_precision.toString()
    );

    return prompt;
  }

  /**
   * Extracts grade level from curriculum path
   */
  private extractGradeLevel(curriculumPath: string): string {
    const match = curriculumPath.match(/grade_(\d+(?:_\d+)?)/);
    if (match) {
      return `Grade ${match[1].replace("_", "-")}`;
    }
    return "Middle School";
  }

  /**
   * Parses the AI-generated solution JSON into structured solution data
   */
  private parseSolutionResponse(solutionText: string): {
    solution_steps: SolutionStep[];
    final_answer?: string;
    verification?: string;
    common_mistakes?: string[];
    key_concepts?: string[];
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = solutionText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const solutionData = JSON.parse(jsonMatch[0]);
        if (
          solutionData.solution_steps &&
          Array.isArray(solutionData.solution_steps)
        ) {
          return {
            solution_steps: solutionData.solution_steps.map((step: any) => ({
              step_number: step.step_number,
              title: step.title,
              description: step.description,
              formula: step.formula,
              calculation: step.calculation,
              result: step.result,
              explanation: step.explanation,
            })),
            final_answer: solutionData.final_answer,
            verification: solutionData.verification,
            common_mistakes: solutionData.common_mistakes,
            key_concepts: solutionData.key_concepts,
          };
        }
      }
    } catch (_error) {
      console.warn("⚠️  Failed to parse solution JSON, using fallback parsing");
    }

    // Fallback: simple text parsing
    const steps: SolutionStep[] = [];
    const lines = solutionText.split("\n");
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
        explanation: solutionText,
      });
    }

    return { solution_steps: steps };
  }

  /**
   * Parses the AI-generated task JSON into structured task data
   */
  private parseTaskResponse(taskText: string): {
    title: string;
    story_chunks: string[];
    story_text: string;
    questions: string[];
    expected_answer_formats?: string[];
  } {
    try {
      // Try to extract JSON from the response
      const jsonMatch = taskText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const taskData = JSON.parse(jsonMatch[0]);

        // Support both old (question) and new (questions) formats
        let questions: string[] = [];
        if (taskData.questions && Array.isArray(taskData.questions)) {
          questions = taskData.questions;
        } else if (taskData.question) {
          // Backward compatibility: convert single question to array
          questions = [taskData.question];
        }

        let expected_answer_formats: string[] | undefined = undefined;
        if (
          taskData.expected_answer_formats &&
          Array.isArray(taskData.expected_answer_formats)
        ) {
          expected_answer_formats = taskData.expected_answer_formats;
        } else if (taskData.expected_answer_format) {
          // Backward compatibility: convert single format to array
          expected_answer_formats = [taskData.expected_answer_format];
        }

        if (taskData.title && taskData.story_chunks && questions.length > 0) {
          return {
            title: taskData.title,
            story_chunks: taskData.story_chunks,
            story_text: taskData.story_chunks.join("\n\n"), // Join chunks for backward compatibility
            questions,
            expected_answer_formats,
          };
        }
      }
    } catch (_error) {
      console.warn("⚠️  Failed to parse task JSON, using fallback parsing");
    }

    // Fallback: extract title and use full text as story
    const title = this.extractTitleFallback(taskText);
    return {
      title,
      story_chunks: [taskText],
      story_text: taskText,
      questions: ["Solve the problem presented above."],
    };
  }

  /**
   * Extracts title from generated text (fallback method)
   */
  private extractTitleFallback(text: string): string {
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return trimmed.substring(2);
      }
    }
    return "Mathematical Task";
  }

  /**
   * Creates a concise, complete image prompt from story without truncation
   */
  private createImagePromptFromStory(storyText: string, title: string): string {
    // Extract first 2 sentences or up to 250 characters, whichever comes first
    const sentences = storyText.match(/[^.!?]+[.!?]+/g) || [];
    let context = sentences.slice(0, 2).join(" ");

    // If still too long, trim at sentence boundary
    if (context.length > 250) {
      context = context.substring(0, 250);
      const lastPeriod = context.lastIndexOf(".");
      if (lastPeriod > 100) {
        context = context.substring(0, lastPeriod + 1);
      }
    }

    return `Scene: "${title}". ${context}`;
  }

  /**
   * Calculates estimated time to complete task based on difficulty and complexity
   */
  private calculateEstimatedTime(
    difficultyLevel: string,
    numberOfSteps: number,
    numberOfImages: number
  ): number {
    const baseTime = 5; // Base 5 minutes

    // Time per step based on difficulty
    const stepTime =
      difficultyLevel === "easy" ? 2 :
      difficultyLevel === "medium" ? 3 :
      5; // hard

    // Additional time for images (students need time to analyze them)
    const imageTime = numberOfImages * 2;

    return baseTime + (numberOfSteps * stepTime) + imageTime;
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

    const taskId = generateTaskId();

    // Step 1: Generate task story/description using the new system prompt template approach
    console.log("📝 Step 1: Generating task story with enhanced system prompt...");
    const { systemPrompt, userMessage } = this.buildTaskPrompt(request);
    const taskResult = await this.textGenerator.generateWithSystemPrompt(
      systemPrompt,
      userMessage,
      {
        temperature: 0.8,
        maxTokens: 2000,
      }
    );

    // Parse the task JSON response
    const taskData = this.parseTaskResponse(taskResult.text);
    console.log(`✅ Generated task story: "${taskData.title}" (${taskId})\n`);

    // Step 2: Generate solution separately using solution_generation.md prompt
    console.log("🧮 Step 2: Generating step-by-step solution...");
    const solutionPrompt = this.buildSolutionPrompt(
      taskData.story_text,
      request
    );
    const solutionResult = await this.textGenerator.generate(solutionPrompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });

    // Parse the solution JSON response
    const solutionData = this.parseSolutionResponse(solutionResult.text);
    console.log(
      `✅ Generated ${solutionData.solution_steps.length} solution steps\n`
    );

    // Step 3: Generate images based on the task description
    const images: TaskImage[] = [];
    const numImages = Math.min(request.number_of_images, 2); // Max 2 images

    if (numImages > 0) {
      console.log(`🎨 Step 3: Generating ${numImages} image(s)...`);

      // Extract key visual elements for smarter image prompts (avoid truncation)
      const storyPreview = this.createImagePromptFromStory(
        taskData.story_text,
        taskData.title
      );
      const imagePromptBase = `Educational illustration for a math problem, ${request.display_template} style, appropriate for ${request.target_group} students. ${storyPreview}`;

      for (let i = 0; i < numImages; i++) {
        console.log(`   🎨 Generating image ${i + 1}/${numImages}...`);

        const imagePrompt =
          numImages > 1
            ? `${imagePromptBase} (Perspective ${i + 1} of ${numImages})`
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

        console.log(`   ✅ Generated image ${i + 1}: ${imageId}`);
      }
      console.log();
    } else {
      console.log(`📝 Step 3: No images requested (skipping)\n`);
    }

    // Create metadata
    const estimatedTime = this.calculateEstimatedTime(
      request.difficulty_level,
      solutionData.solution_steps.length,
      images.length
    );

    const metadata: TaskMetadata = {
      curriculum_path: request.curriculum_path,
      target_group: request.target_group,
      difficulty_level: request.difficulty_level,
      educational_model: request.educational_model,
      country_code: request.country_code,
      estimated_time_minutes: estimatedTime,
      tags: request.custom_keywords || [],
    };

    // Create the generated task object
    const generatedTask: GeneratedTask = {
      title: taskData.title,
      story_chunks: taskData.story_chunks,
      story_text: taskData.story_text,
      questions: taskData.questions,
      expected_answer_formats: taskData.expected_answer_formats,
      solution_steps: solutionData.solution_steps,
      final_answer: solutionData.final_answer,
      verification: solutionData.verification,
      common_mistakes: solutionData.common_mistakes,
      key_concepts: solutionData.key_concepts,
      images,
      metadata,
      is_editable: true,
      created_at: new Date().toISOString(),
    };

    // Step 4: Save task to curriculum-based storage
    console.log("💾 Step 4: Saving task to curriculum-based storage...");
    const storagePath = await this.taskStorage.saveTask(
      taskId,
      request,
      generatedTask
    );
    console.log(`✅ Saved to: ${storagePath}\n`);

    console.log("🎉 Task generation completed!\n");

    // Get the task back from storage to get correct image URLs
    const savedTask = await this.taskStorage.getTask(request, taskId);

    return {
      taskId,
      storagePath,
      generatedTask: savedTask || generatedTask,
    };
  }
}
