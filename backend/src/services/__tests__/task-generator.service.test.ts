/**
 * Integration tests for TaskGeneratorService
 * Tests prompt generation without calling actual AI APIs
 */

import { TaskGeneratorService } from "../task-generator.service";
import { TaskGeneratorRequest } from "../../types";
import { TextGeneratorService } from "../text-generator.service";
import { ImageGeneratorService } from "../image-generator.service";
import { TaskStorageService } from "../task-storage.service";

// Mock the dependencies
jest.mock("../text-generator.service");
jest.mock("../image-generator.service");
jest.mock("../task-storage.service");
jest.mock("../../utils/story-inspiration.helper");
jest.mock("../../utils/curriculum-mapper.helper");

// Import the mocked modules to access mock functions
import * as inspirationHelper from "../../utils/story-inspiration.helper";
import * as curriculumMapper from "../../utils/curriculum-mapper.helper";

describe("TaskGeneratorService - Prompt Generation", () => {
  let service: TaskGeneratorService;
  let mockTextGenerator: jest.Mocked<TextGeneratorService>;
  let mockImageGenerator: jest.Mocked<ImageGeneratorService>;
  let mockTaskStorage: jest.Mocked<TaskStorageService>;

  // Helper function to get task system prompt (from generateWithSystemPrompt)
  const getTaskSystemPrompt = () =>
    mockTextGenerator.generateWithSystemPrompt.mock.calls[0][0];

  // Helper function to get task user message (from generateWithSystemPrompt)
  const getTaskUserMessage = () =>
    mockTextGenerator.generateWithSystemPrompt.mock.calls[0][1];

  // Helper function to get solution prompt (from generate)
  const getSolutionPrompt = () => mockTextGenerator.generate.mock.calls[0][0];

  // Sample request for Hungary (Metric, Hungarian)
  // New path format: country:subject:grade:topic_keys...
  const metricRequest: TaskGeneratorRequest = {
    curriculum_path:
      "HU:mathematics:grade_9_12:algebra:linear_equations:solving_basic",
    country_code: "HU",
    target_group: "mixed",
    difficulty_level: "medium",
    educational_model: "secular",
    display_template: "modern",
    precision_settings: {
      constant_precision: 2,
      intermediate_precision: 3,
      final_answer_precision: 2,
      use_exact_values: false,
    },
    custom_keywords: ["sports", "competition"],
    template_id: "",
  };

  // Sample request for USA (Imperial, English)
  const imperialRequest: TaskGeneratorRequest = {
    ...metricRequest,
    country_code: "US",
  };

  beforeEach(() => {
    // Clear DISABLE_IMAGE_GENERATION env variable for tests
    delete process.env.DISABLE_IMAGE_GENERATION;

    // Create fresh mocks
    mockTextGenerator =
      new TextGeneratorService() as jest.Mocked<TextGeneratorService>;
    mockImageGenerator =
      new ImageGeneratorService() as jest.Mocked<ImageGeneratorService>;
    mockTaskStorage =
      new TaskStorageService() as jest.Mocked<TaskStorageService>;

    // Mock the generateStoryInspiration function
    (inspirationHelper.generateStoryInspiration as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        selected: {
          era: {
            id: "modern",
            name: "Modern Era (2000-2024)",
            period: "2000-2024",
            keywords: ["digital", "contemporary"],
          },
          location: {
            id: "urban_city",
            name: "Urban City",
            type: "urban",
            subcategories: ["downtown", "business district"],
          },
          field: {
            id: "engineering",
            name: "Engineering",
            subcategories: ["civil", "mechanical"],
          },
          stake: {
            id: "professional",
            name: "Professional Success",
            intensity: "medium",
            description: "Career achievement",
            examples: ["project completion"],
          },
        },
        promptAdditions:
          "\n\n## STORY INSPIRATION ELEMENTS\n**Era:** Modern Era\n**Field:** Engineering\n",
      });

    // Mock curriculum mapper functions
    (curriculumMapper.getCurriculumTopicByPath as jest.Mock) = jest
      .fn()
      .mockReturnValue({
        topic: {
          key: "solving_basic",
          name: "Solving Basic Equations",
          short_description: "Introduction to solving basic linear equations",
          example_tasks: [
            "Solve for x: 2x + 5 = 13",
            "Solve for x: 3x - 7 = 11",
            "Solve for x: x/4 = 9",
          ],
        },
        parentTopics: [
          { key: "algebra", name: "Algebra" },
          { key: "linear_equations", name: "Linear Equations" },
          { key: "solving_basic", name: "Solving Basic Equations" },
        ],
        fullPath: "math:grade_9_10:algebra:linear_equations:solving_basic",
      });

    (curriculumMapper.formatCurriculumTopicForPrompt as jest.Mock) = jest
      .fn()
      .mockReturnValue(
        "\n## CURRICULUM TOPIC INFORMATION\n**Topic:** Solving Basic Equations\n"
      );

    (curriculumMapper.getExampleTasks as jest.Mock) = jest
      .fn()
      .mockReturnValue([
        "Solve for x: 2x + 5 = 13",
        "Solve for x: 3x - 7 = 11",
        "Solve for x: x/4 = 9",
      ]);

    // Mock text generator to capture the prompt
    mockTextGenerator.generateWithSystemPrompt = jest
      .fn()
      .mockImplementation(async (systemPrompt: string, userPrompt: string) => {
        // Return mock task response for the new system prompt approach
        return {
          text: JSON.stringify({
            title: "Test Task Title",
            story_chunks: ["First paragraph.", "Second paragraph."],
            questions: ["What is the answer?"],
            expected_answer_formats: ["Number to 2 decimal places"],
          }),
          tokens: 150,
          cost: 0.001,
        };
      });

    mockTextGenerator.generate = jest
      .fn()
      .mockImplementation(async (prompt: string) => {
        // Return mock solution response
        return {
          text: JSON.stringify({
            solution_steps: [
              {
                step_number: 1,
                title: "Step 1",
                description: "First step",
                result: "10",
              },
            ],
            final_answer: "The answer is 10",
          }),
          tokens: 150,
          cost: 0.001,
        };
      });

    // Mock image generator
    mockImageGenerator.generate = jest.fn().mockResolvedValue({
      url: "https://example.com/image.png",
      revisedPrompt: "Test image prompt",
    });

    // Mock storage
    mockTaskStorage.saveTask = jest
      .fn()
      .mockResolvedValue(
        "/storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations"
      );
    mockTaskStorage.getTask = jest
      .fn()
      .mockImplementation(async (request, taskId) => {
        // Return a mock task with updated image URLs
        return {
          title: "Test Task Title",
          story_chunks: ["First paragraph.", "Second paragraph."],
          story_text: "First paragraph.\n\nSecond paragraph.",
          questions: ["What is the answer?"],
          expected_answer_formats: ["Number to 2 decimal places"],
          solution_steps: [
            {
              step_number: 1,
              title: "Step 1",
              description: "First step",
              result: "10",
            },
          ],
          final_answer: "The answer is 10",
          images: [],
          metadata: {
            curriculum_path: request.curriculum_path,
            target_group: request.target_group,
            difficulty_level: request.difficulty_level,
            educational_model: request.educational_model,
            country_code: request.country_code,
            tags: [],
          },
          is_editable: true,
          created_at: new Date().toISOString(),
        };
      });

    // Create service instance
    service = new TaskGeneratorService();
    (service as any).textGenerator = mockTextGenerator;
    (service as any).imageGenerator = mockImageGenerator;
    (service as any).taskStorage = mockTaskStorage;
  });

  describe("System Prompt Approach", () => {
    it("should use system prompt template with replacements", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      // Should contain template content with placeholders replaced
      expect(systemPrompt).toContain("THE IMMORTAL TEACHER");
      expect(systemPrompt).toContain("CURRICULUM ALIGNMENT IS MANDATORY");
      expect(systemPrompt).toContain("Hungarian"); // {{LANGUAGE}} replaced
      expect(systemPrompt).toContain("metric"); // {{METRIC_SYSTEM}} replaced
    });

    it("should include user message as JSON", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();

      // User message should be valid JSON
      expect(() => JSON.parse(userMessage)).not.toThrow();

      const parsedMessage = JSON.parse(userMessage);
      expect(parsedMessage).toHaveProperty("task_config");
      expect(parsedMessage).toHaveProperty("curriculum_topic");
    });

    it("should include task configuration in system prompt", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      expect(systemPrompt).toContain("ADDITIONAL CONTEXT");
      expect(systemPrompt).toContain("Target Audience");
      expect(systemPrompt).toContain("Difficulty Level");
      expect(systemPrompt).toContain("Educational Model");
    });

    it("should include precision settings in system prompt", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      expect(systemPrompt).toContain("Mathematical Precision");
      expect(systemPrompt).toContain("Constant Precision");
      expect(systemPrompt).toContain("decimal places");
    });

    it("should include custom keywords in system prompt", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      expect(systemPrompt).toContain("Custom Keywords");
      expect(systemPrompt).toContain("sports");
      expect(systemPrompt).toContain("competition");
    });

    it("should include curriculum topic information", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      expect(systemPrompt).toContain("CURRICULUM TOPIC INFORMATION");
    });
  });

  describe("Prompt Structure Validation", () => {
    it("should call generateWithSystemPrompt for task and generate for solution", async () => {
      await service.generateTask(metricRequest);

      expect(mockTextGenerator.generateWithSystemPrompt).toHaveBeenCalledTimes(
        1
      );
      expect(mockTextGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it("should call image generator for requested images", async () => {
      await service.generateTask(metricRequest);

      expect(mockImageGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it("should not call image generator when DISABLE_IMAGE_GENERATION env is set", async () => {
      process.env.DISABLE_IMAGE_GENERATION = "true";
      await service.generateTask(metricRequest);

      expect(mockImageGenerator.generate).not.toHaveBeenCalled();
    });

    it("should pass task story to solution prompt", async () => {
      await service.generateTask(metricRequest);

      const solutionPrompt = getSolutionPrompt();

      // Should contain the parsed story from the first call
      expect(solutionPrompt).toContain("First paragraph.");
      expect(solutionPrompt).toContain("Second paragraph.");
    });

    it("should save generated task to storage", async () => {
      await service.generateTask(metricRequest);

      expect(mockTaskStorage.saveTask).toHaveBeenCalledTimes(1);

      // Check that saveTask was called with: taskId, request, generatedTask
      const saveTaskCall = mockTaskStorage.saveTask.mock.calls[0];
      const taskId = saveTaskCall[0]; // First argument is taskId
      const request = saveTaskCall[1]; // Second argument is request
      const savedTask = saveTaskCall[2]; // Third argument is generatedTask

      expect(typeof taskId).toBe("string");
      expect(request).toEqual(metricRequest);
      expect(savedTask.title).toBe("Test Task Title");
      expect(savedTask.story_chunks).toEqual([
        "First paragraph.",
        "Second paragraph.",
      ]);
      expect(savedTask.questions).toEqual(["What is the answer?"]);
    });

    it("should retrieve task from storage after saving", async () => {
      await service.generateTask(metricRequest);

      expect(mockTaskStorage.getTask).toHaveBeenCalledTimes(1);

      // Check that getTask was called with: request, taskId
      const getTaskCall = mockTaskStorage.getTask.mock.calls[0];
      const request = getTaskCall[0]; // First argument is request
      const taskId = getTaskCall[1]; // Second argument is taskId

      expect(request).toEqual(metricRequest);
      expect(typeof taskId).toBe("string");
    });
  });

  describe("User Message JSON Structure", () => {
    it("should include task_config with language and metric_system", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();
      const parsed = JSON.parse(userMessage);

      expect(parsed.task_config).toBeDefined();
      expect(parsed.task_config.language).toBeDefined();
      expect(parsed.task_config.metric_system).toBeDefined();
    });

    it("should include curriculum_topic with example_tasks", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();
      const parsed = JSON.parse(userMessage);

      expect(parsed.curriculum_topic).toBeDefined();
      expect(parsed.curriculum_topic.key).toBe("solving_basic");
      expect(parsed.curriculum_topic.example_tasks).toBeDefined();
      expect(Array.isArray(parsed.curriculum_topic.example_tasks)).toBe(true);
    });

    it("should NOT include selected_example_index", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();
      const parsed = JSON.parse(userMessage);

      expect(parsed.selected_example_index).toBeUndefined();
    });
  });

  describe("Task Refinement", () => {
    const sampleTaskText = {
      title: "Baghdad Merchant Problem",
      story_text:
        "You are a treasurer. Three merchants offer money: 15,000 + 8,000 later, or 25,000 in a year. Money grows at 8% every 3 months.",
      questions: ["Which option is best?"],
    };

    beforeEach(() => {
      // Mock the refinement response with different levels
      mockTextGenerator.generate = jest
        .fn()
        .mockImplementation(async (prompt: string) => {
          // Check if this is a refinement prompt
          if (prompt.includes("Task Refinement")) {
            return {
              text: JSON.stringify({
                refined_title: "The Caliph's Financial Dilemma",
                refined_story:
                  "As treasurer to the Caliph in 830 CE Baghdad, you must finance the House of Wisdom's translation projects. Three merchants offer loans with different payment schedules. Your challenge: you can invest any money you receive into trade caravans that return 8% profit every three months. Which merchant's payment schedule allows you to maximize your total funds by year-end?",
                refined_questions: [
                  "Calculate which merchant offer maximizes your total funds after one year, considering the 8% quarterly returns from trade caravans.",
                ],
                refinement_level: "moderate",
                changes_made:
                  "Reorganized story to better integrate 8% profit rate into merchant's decision-making context. Added clear motivation (House of Wisdom funding) and explicit connection between payment timing and reinvestment opportunity.",
                mathematical_verification:
                  "Verified that all payment amounts are consistent, the 8% quarterly rate is realistic for medieval trade, and the problem is solvable with compound interest calculations.",
                image_visual_description:
                  "A medieval Baghdad marketplace with a treasurer examining scrolls at a wooden desk, surrounded by trade goods and lanterns, with the House of Wisdom visible in the background.",
              }),
              tokens: 200,
              cost: 0.002,
            };
          }
          // Default solution response
          return {
            text: JSON.stringify({
              solution_steps: [
                {
                  step_number: 1,
                  title: "Step 1",
                  description: "First step",
                  result: "10",
                },
              ],
              final_answer: "The answer is 10",
            }),
            tokens: 150,
            cost: 0.001,
          };
        });
    });

    it("should refine task text with moderate level changes", async () => {
      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      expect(result.refined_title).toBe("The Caliph's Financial Dilemma");
      expect(result.refined_story).toContain("House of Wisdom");
      expect(result.refined_story).toContain("trade caravans");
      expect(result.refinement_level).toBe("moderate");
      expect(result.changes_made).toContain("Reorganized story");
      expect(result.mathematical_verification).toContain("Verified");
      expect(result.image_visual_description).toContain("Baghdad marketplace");
    });

    it("should include refinement level in response", async () => {
      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      expect(result.refinement_level).toBeDefined();
      expect(["minor", "moderate", "major"]).toContain(result.refinement_level);
    });

    it("should generate image visual description from refined task", async () => {
      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      expect(result.image_visual_description).toBeDefined();
      expect(result.image_visual_description).not.toContain("question");
      expect(result.image_visual_description).not.toContain("formula");
      expect(result.image_visual_description).not.toContain("calculate");
    });

    it("should call text generator with refinement prompt", async () => {
      await service.refineTaskText(sampleTaskText, metricRequest);

      expect(mockTextGenerator.generate).toHaveBeenCalledTimes(1);

      const refinementPrompt = mockTextGenerator.generate.mock.calls[0][0];
      expect(refinementPrompt).toContain("Task Refinement");
      expect(refinementPrompt).toContain("Mathematical Accuracy");
      expect(refinementPrompt).toContain("Narrative-Mathematical Integration");
      expect(refinementPrompt).toContain(sampleTaskText.title);
      expect(refinementPrompt).toContain(sampleTaskText.story_text);
    });

    it("should use correct language in refinement prompt", async () => {
      await service.refineTaskText(sampleTaskText, metricRequest);

      const refinementPrompt = mockTextGenerator.generate.mock.calls[0][0];
      expect(refinementPrompt).toContain("Hungarian");
    });

    it("should preserve original task on minor refinement", async () => {
      // Mock minor refinement response
      mockTextGenerator.generate = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          refined_title: sampleTaskText.title,
          refined_story: sampleTaskText.story_text + " Minor clarification added.",
          refined_questions: sampleTaskText.questions,
          refinement_level: "minor",
          changes_made: "Minor wording improvements for clarity.",
          mathematical_verification: "All values are consistent and correct.",
          image_visual_description: "A treasurer in medieval Baghdad.",
        }),
        tokens: 150,
        cost: 0.001,
      });

      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      expect(result.refinement_level).toBe("minor");
      expect(result.refined_title).toBe(sampleTaskText.title);
      expect(result.refined_story).toContain(sampleTaskText.story_text);
    });

    it("should handle major redesign when task is fundamentally flawed", async () => {
      const flawedTask = {
        title: "Impossible Math",
        story_text:
          "Buy 0.43 books for a party. The merchant sells 2,847,392 apples daily.",
        questions: ["Calculate something?"],
      };

      // Mock major redesign response
      mockTextGenerator.generate = jest.fn().mockResolvedValue({
        text: JSON.stringify({
          refined_title: "Planning a School Book Fair",
          refined_story:
            "You're organizing a school book fair with a limited budget. The bookstore offers package deals: you can buy sets of 5 books for $20 each. If you have $85 to spend, how many complete sets can you purchase, and how much money will you have left over?",
          refined_questions: [
            "How many complete book sets can you buy with $85?",
            "How much money will remain after purchasing the maximum number of sets?",
          ],
          refinement_level: "major",
          changes_made:
            "Major redesign required - original task contained unrealistic values (0.43 books, 2.8M apples daily) and incoherent narrative. Redesigned to create a realistic school book fair scenario while preserving division with remainders concept and age-appropriate context.",
          mathematical_verification:
            "Verified: $85 ÷ $20 per set = 4 complete sets with $5 remaining. Values are realistic for school context.",
          image_visual_description:
            "A school library or classroom with colorful books displayed on tables for a book fair, students browsing.",
        }),
        tokens: 250,
        cost: 0.003,
      });

      const result = await service.refineTaskText(flawedTask, metricRequest);

      expect(result.refinement_level).toBe("major");
      expect(result.changes_made).toContain("Major redesign required");
      expect(result.refined_story).not.toContain("0.43");
      expect(result.refined_story).not.toContain("2,847,392");
    });

    it("should handle parsing errors gracefully", async () => {
      // Mock invalid JSON response
      mockTextGenerator.generate = jest.fn().mockResolvedValue({
        text: "This is not valid JSON",
        tokens: 50,
        cost: 0.0005,
      });

      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      // Should return fallback values
      expect(result.refined_title).toBe("Refined Task");
      expect(result.refinement_level).toBe("minor");
      expect(result.changes_made).toContain("Parsing error");
    });

    it("should include all required fields in refinement response", async () => {
      const result = await service.refineTaskText(sampleTaskText, metricRequest);

      expect(result).toHaveProperty("refined_title");
      expect(result).toHaveProperty("refined_story");
      expect(result).toHaveProperty("refined_questions");
      expect(result).toHaveProperty("refinement_level");
      expect(result).toHaveProperty("changes_made");
      expect(result).toHaveProperty("mathematical_verification");
      expect(result).toHaveProperty("image_visual_description");
    });
  });
});
