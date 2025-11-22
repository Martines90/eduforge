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
   * Builds a comprehensive prompt for task story generation
   */
  private buildTaskPrompt(request: TaskGeneratorRequest): string {
    // Load the appropriate template based on measurement system
    const measurementSystem = getMeasurementSystem(request.country_code);
    const templateName = `task_generation_${measurementSystem}.md`;
    let prompt = this.loadPromptTemplate(templateName);

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
      prompt += `\n## CUSTOM KEYWORDS\n`;
      prompt += `User-provided themes/keywords: ${request.custom_keywords.join(", ")}\n`;
    }

    // Generate and add story inspiration elements using helper
    const inspiration = generateStoryInspiration(
      request.difficulty_level,
      request.target_group,
      request.custom_keywords
    );

    prompt += inspiration.promptAdditions;

    // Add specific instructions based on configuration
    prompt += `\n## SPECIFIC INSTRUCTIONS\n`;
    prompt += `- Adapt language and cultural references for ${request.country_code}\n`;
    prompt += `- Create content appropriate for ${request.target_group}\n`;
    prompt += `- Follow ${request.educational_model} educational principles\n`;
    prompt += `- Design for ${request.display_template} display template\n`;
    prompt += `- Generate ONLY the task story and question, NOT the solution\n`;
    prompt += `- Weave the story inspiration elements naturally into the narrative\n`;

    return prompt;
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
   * Generates a complete task with description and images based on comprehensive configuration
   * @param request TaskGeneratorRequest with all configuration parameters
   * @returns Promise that resolves to the generated task and storage path
   */
  async generateTask(
    request: TaskGeneratorRequest
  ): Promise<TaskGenerationResult> {
    console.log("🚀 Starting task generation...\n");

    const taskId = generateTaskId();

    // Step 1: Generate task story/description using task_generation.md prompt
    console.log("📝 Step 1: Generating task story...");
    const taskPrompt = this.buildTaskPrompt(request);
    const taskResult = await this.textGenerator.generate(taskPrompt, {
      temperature: 0.8,
      maxTokens: 2000,
    });

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

      const imagePromptBase = `Educational illustration for a math problem, ${request.display_template} style, appropriate for ${request.target_group} students. Story context: ${taskData.story_text.substring(0, 400)}`;

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

    // Step 4: Save task to storage (task_description.md + solution.json + images/)
    console.log("💾 Step 4: Saving task to storage...");
    const storagePath = await this.taskStorage.saveTask(taskId, generatedTask);
    console.log(`✅ Saved to: ${storagePath}\n`);

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
