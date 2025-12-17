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
      // Remove markdown code blocks if present
      let cleanedText = taskText.trim();
      cleanedText = cleanedText.replace(/^```json\s*/i, '');
      cleanedText = cleanedText.replace(/^```\s*/i, '');
      cleanedText = cleanedText.replace(/\s*```$/i, '');
      cleanedText = cleanedText.trim();

      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const taskData = JSON.parse(jsonMatch[0]);

        // Support both new format (description) and old format (story_chunks)
        let description = taskData.description || "";
        let story_text = description;
        let story_chunks = [description];

        // If old format with story_chunks, use that
        if (taskData.story_chunks && Array.isArray(taskData.story_chunks)) {
          story_chunks = taskData.story_chunks;
          story_text = taskData.story_chunks.join("\n\n");
        }

        // Handle questions
        let questions: string[] = [];
        if (taskData.questions && Array.isArray(taskData.questions)) {
          questions = taskData.questions;
        } else if (taskData.question) {
          questions = [taskData.question];
        }

        // Handle expected answer formats
        let expected_answer_formats: string[] | undefined = undefined;
        if (
          taskData.expected_answer_formats &&
          Array.isArray(taskData.expected_answer_formats)
        ) {
          expected_answer_formats = taskData.expected_answer_formats;
        } else if (taskData.expected_answer_format) {
          expected_answer_formats = [taskData.expected_answer_format];
        }

        if (taskData.title && (description || story_chunks.length > 0) && questions.length > 0) {
          return {
            title: taskData.title,
            story_chunks,
            story_text,
            questions,
            expected_answer_formats,
          };
        }
      }
    } catch (error) {
      console.warn("⚠️  Failed to parse task JSON:", error);
      console.warn("⚠️  Raw response:", taskText.substring(0, 200));
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
   * Creates a clean comic book style image prompt without text or formulas
   */
  private createImagePromptFromStory(storyText: string, title: string): string {
    // Extract key visual elements from the story without including dialogue or math
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

    // Remove any text in quotes to avoid triggering text generation
    context = context.replace(/"[^"]*"/g, '');

    // Strip HTML tags
    context = context.replace(/<[^>]+>/g, '');

    return `Comic book style illustration showing: ${context}. NO TEXT, NO WORDS, NO NUMBERS, NO FORMULAS - visual scene only.`;
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
    const disableImageGeneration = process.env.DISABLE_IMAGE_GENERATION === 'true';
    const numImages = Math.min(request.number_of_images, 2); // Max 2 images

    if (disableImageGeneration) {
      console.log(`🚫 Step 3: Image generation disabled via DISABLE_IMAGE_GENERATION env variable\n`);
    } else if (numImages > 0) {
      console.log(`🎨 Step 3: Generating ${numImages} image(s)...`);

      // Extract key visual elements for smarter image prompts (avoid truncation)
      const storyPreview = this.createImagePromptFromStory(
        taskData.story_text,
        taskData.title
      );
      const imagePromptBase = `${storyPreview} Clean, vibrant ${request.display_template} illustration style suitable for ${request.target_group}. Focus on the scene and characters, NOT educational diagrams.`;

      for (let i = 0; i < numImages; i++) {
        console.log(`   🎨 Generating image ${i + 1}/${numImages}...`);

        const imagePrompt =
          numImages > 1
            ? `${imagePromptBase} Angle ${i + 1}: different perspective of the same scene.`
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

  /**
   * V2 API: Generates task text only (no solution, no images) with variation support
   * Used for generating 3 variations in parallel
   */
  async generateTaskTextOnly(
    request: TaskGeneratorRequest & { variation_index?: number }
  ): Promise<{
    title: string;
    story_text: string;
    questions: string[];
    metadata: any;
  }> {
    console.log(`📝 Generating task text variation ${request.variation_index || 1}...`);

    // Build task prompt with variation context
    const { systemPrompt, userMessage } = this.buildTaskPrompt(request);

    // Add variation instruction to system prompt if variation_index is provided
    let enhancedSystemPrompt = systemPrompt;
    if (request.variation_index) {
      const variationStrategy =
        request.variation_index === 1 ?
          `**WARFARE & STRATEGY** or **ENGINEERING & CONSTRUCTION** context from the scenario library. Choose from: ancient battles, medieval sieges, bridge/dam construction, military logistics, fortification design, siege weapons, naval engineering. Draw from historical conflicts or monumental construction projects where mathematics determined victory or prevented catastrophic failure.` :
        request.variation_index === 2 ?
          `**DISCOVERY & EXPLORATION** or **CATASTROPHE & DISASTER** context from the scenario library. Choose from: space exploration, deep sea missions, polar expeditions, natural disasters, industrial accidents, nuclear incidents, transportation disasters. Focus on moments where scientific calculation meant survival or understanding catastrophe.` :
          `**INVENTION & INNOVATION** or **CRIME & JUSTICE** context from the scenario library. Choose from: breakthrough inventions, scientific revolutions, famous heists, forensic analysis, accident reconstruction, security system design, technological breakthroughs. Focus on moments where mathematical precision enabled innovation or solved mysteries.`;

      enhancedSystemPrompt += `\n\n**CRITICAL VARIATION REQUIREMENT FOR VARIATION #${request.variation_index}**:\n\n${variationStrategy}\n\n**SCENARIO SELECTION CRITERIA**:\n\nYou are an immortal teacher drawing from thousands of years of experience. Select ONE specific moment from your life that fits this variation's context. The scenario MUST meet ALL of these criteria:\n\n✅ **Historical/Global Significance**: A moment that shaped history, advanced civilization, or had consequences beyond individual lives\n✅ **Real Stakes**: Lives depended on the calculation, OR massive resources/infrastructure was at risk, OR a breakthrough discovery hinged on understanding the math\n✅ **Professional/Expert Context**: You were acting as an engineer, scientist, military strategist, detective, explorer, inventor, or expert - NOT as a civilian in daily life\n✅ **Memorable Event**: Something worthy of being recorded in history books, technical journals, or disaster reports\n\n**Scale & Scope Requirements**:\n- If construction: Major infrastructure (bridges, dams, skyscrapers, monuments)\n- If warfare: Battles/sieges that shaped nations, not personal combat\n- If disaster: Events with regional/global impact (tsunamis, nuclear incidents, major accidents)\n- If crime: Famous heists, major investigations, breakthrough forensics\n- If invention: Technologies that changed industries or saved lives\n- If exploration: Missions to unexplored territories (space, poles, deep sea, uncharted lands)\n\n**Remember**: You're telling your students about a time when YOU personally applied mathematics in a way that mattered to human civilization. This isn't about solving convenient problems - it's about understanding forces that built and destroyed empires, saved and cost lives, advanced and threatened humanity.`;
    }

    // Log the prompts being sent to AI
    console.log(`\n📤 [AI Prompt] System Prompt (${enhancedSystemPrompt.length} chars):`);
    console.log(`${enhancedSystemPrompt}...`);
    console.log(`\n📤 [AI Prompt] User Message (${userMessage.length} chars):`);
    console.log(`${userMessage}\n`);

    const taskResult = await this.textGenerator.generateWithSystemPrompt(
      enhancedSystemPrompt,
      userMessage,
      {
        temperature: 0.85, // Slightly higher for more variation
        maxTokens: 2000,
      }
    );

    // Parse the task JSON response
    const taskData = this.parseTaskResponse(taskResult.text);
    console.log(`✅ Generated task text variation: "${taskData.title}"`);

    // Calculate estimated time
    const estimatedTime = this.calculateEstimatedTime(
      request.difficulty_level,
      5, // Estimated number of steps
      request.number_of_images
    );

    return {
      title: taskData.title,
      story_text: taskData.story_text,
      questions: taskData.questions,
      metadata: {
        curriculum_path: request.curriculum_path,
        difficulty_level: request.difficulty_level,
        educational_model: request.educational_model,
        target_group: request.target_group,
        estimated_time_minutes: estimatedTime,
        variation_index: request.variation_index,
      },
    };
  }

  /**
   * V2 API: Generates solution only for given task text
   */
  async generateSolutionOnly(
    taskText: {
      title: string;
      story_text: string;
      questions: string[];
    },
    request: TaskGeneratorRequest
  ): Promise<{
    solution_steps: SolutionStep[];
    final_answer?: string;
    verification?: string;
    common_mistakes?: string[];
  }> {
    console.log(`🧮 Generating solution for: "${taskText.title}"...`);

    const solutionPrompt = this.buildSolutionPrompt(
      taskText.story_text,
      request
    );

    const solutionResult = await this.textGenerator.generate(solutionPrompt, {
      temperature: 0.7,
      maxTokens: 2500,
    });

    const solutionData = this.parseSolutionResponse(solutionResult.text);
    console.log(`✅ Generated ${solutionData.solution_steps.length} solution steps`);

    return solutionData;
  }

  /**
   * V2 API: Generates images only for given task text
   */
  async generateImagesOnly(
    taskText: {
      title: string;
      story_text: string;
    },
    numberOfImages: number,
    displayTemplate: string,
    targetGroup: string
  ): Promise<TaskImage[]> {
    const images: TaskImage[] = [];
    const disableImageGeneration = process.env.DISABLE_IMAGE_GENERATION === 'true';
    const numImages = Math.min(numberOfImages, 2);

    if (disableImageGeneration) {
      console.log(`🚫 Image generation disabled via DISABLE_IMAGE_GENERATION env variable`);
      return images;
    }

    if (numImages === 0) {
      console.log(`📝 No images requested (skipping)`);
      return images;
    }

    console.log(`🎨 Generating ${numImages} image(s) for: "${taskText.title}"...`);

    const storyPreview = this.createImagePromptFromStory(
      taskText.story_text,
      taskText.title
    );
    const imagePromptBase = `${storyPreview} Clean, vibrant ${displayTemplate} illustration style suitable for ${targetGroup}. Focus on the scene and characters, NOT educational diagrams.`;

    for (let i = 0; i < numImages; i++) {
      console.log(`   🎨 Generating image ${i + 1}/${numImages}...`);

      const imagePrompt =
        numImages > 1
          ? `${imagePromptBase} Angle ${i + 1}: different perspective of the same scene.`
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

    return images;
  }
}
