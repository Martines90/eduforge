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

// Import the mocked module to access mock functions
import * as inspirationHelper from "../../utils/story-inspiration.helper";

describe("TaskGeneratorService - Prompt Generation", () => {
  let service: TaskGeneratorService;
  let mockTextGenerator: jest.Mocked<TextGeneratorService>;
  let mockImageGenerator: jest.Mocked<ImageGeneratorService>;
  let mockTaskStorage: jest.Mocked<TaskStorageService>;

  // Helper function to get task prompt
  const getTaskPrompt = () => mockTextGenerator.generate.mock.calls[0][0];

  // Helper function to get solution prompt
  const getSolutionPrompt = () => mockTextGenerator.generate.mock.calls[1][0];

  // Sample request for Hungary (Metric, Hungarian)
  const metricRequest: TaskGeneratorRequest = {
    curriculum_path: "math:grade_9_10:algebra:linear_equations:solving_basic",
    country_code: "HU",
    target_group: "mixed",
    difficulty_level: "medium",
    educational_model: "secular",
    number_of_images: 1,
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
    // Create fresh mocks
    mockTextGenerator = new TextGeneratorService() as jest.Mocked<TextGeneratorService>;
    mockImageGenerator = new ImageGeneratorService() as jest.Mocked<ImageGeneratorService>;
    mockTaskStorage = new TaskStorageService() as jest.Mocked<TaskStorageService>;

    // Mock the generateStoryInspiration function
    (inspirationHelper.generateStoryInspiration as jest.Mock) = jest.fn().mockReturnValue({
      selected: {
        era: { id: "modern", name: "Modern Era (2000-2024)", period: "2000-2024", keywords: ["digital", "contemporary"] },
        location: { id: "urban_city", name: "Urban City", type: "urban", subcategories: ["downtown", "business district"] },
        field: { id: "engineering", name: "Engineering", subcategories: ["civil", "mechanical"] },
        stake: { id: "professional", name: "Professional Success", intensity: "medium", description: "Career achievement", examples: ["project completion"] },
      },
      promptAdditions: "\n\n## STORY INSPIRATION ELEMENTS\n**Era:** Modern Era\n**Field:** Engineering\n",
    });

    // Mock text generator to capture the prompt
    mockTextGenerator.generate = jest.fn().mockImplementation(async (prompt: string) => {
      // Return mock task response (checking if it contains task template keywords)
      if (prompt.includes("TASK CONFIGURATION") || prompt.includes("task_generation")) {
        return {
          text: JSON.stringify({
            title: "Test Task Title",
            story_chunks: ["First paragraph.", "Second paragraph."],
            questions: ["What is the answer?"],
            expected_answer_formats: ["Number to 2 decimal places"],
          }),
          usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
        };
      }
      // Return mock solution response
      return {
        text: JSON.stringify({
          solution_steps: [
            { step_number: 1, title: "Step 1", description: "First step", result: "10" },
          ],
          final_answer: "The answer is 10",
        }),
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
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
      .mockResolvedValue("/storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations");
    mockTaskStorage.getTask = jest.fn().mockImplementation(async (request, taskId) => {
      // Return a mock task with updated image URLs
      return {
        title: "Test Task Title",
        story_chunks: ["First paragraph.", "Second paragraph."],
        story_text: "First paragraph.\n\nSecond paragraph.",
        questions: ["What is the answer?"],
        expected_answer_formats: ["Number to 2 decimal places"],
        solution_steps: [
          { step_number: 1, title: "Step 1", description: "First step", result: "10" },
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

  describe("Metric System (Hungary)", () => {
    it("should load metric prompt template", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      // Should load task_generation_metric.md
      expect(taskPrompt).toContain("METRIC SYSTEM");
      expect(taskPrompt).toContain("kilometers (km)");
      expect(taskPrompt).toContain("Decimal separator: **comma**");
      expect(taskPrompt).toContain("12,7 km");
      expect(taskPrompt).toContain("112 233 222");
    });

    it("should inject Hungarian language", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("Generate the entire task in Hungarian");
      expect(taskPrompt).toContain("Language: Hungarian");
      expect(taskPrompt).toContain("Write everything in Hungarian");
    });

    it("should include task configuration", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("TASK CONFIGURATION");
      expect(taskPrompt).toContain("Curriculum Path: math:grade_9_10:algebra:linear_equations:solving_basic");
      expect(taskPrompt).toContain("Country/Locale: HU");
      expect(taskPrompt).toContain("Target Audience: mixed");
      expect(taskPrompt).toContain("Difficulty Level: medium");
      expect(taskPrompt).toContain("Educational Model: secular");
      expect(taskPrompt).toContain("Display Template: modern");
    });

    it("should include precision settings", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("MATHEMATICAL PRECISION");
      expect(taskPrompt).toContain("Constant Precision: 2 decimal places");
      expect(taskPrompt).toContain("Intermediate Precision: 3 decimal places");
      expect(taskPrompt).toContain("Final Answer Precision: 2 decimal places");
    });

    it("should include custom keywords", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("CUSTOM KEYWORDS");
      expect(taskPrompt).toContain("sports, competition");
    });

    it("should include story inspiration", async () => {
      await service.generateTask(metricRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("STORY INSPIRATION ELEMENTS");
      expect(taskPrompt).toContain("Modern Era");
      expect(taskPrompt).toContain("Engineering");
    });

    it("should load metric solution template", async () => {
      await service.generateTask(metricRequest);

      const solutionPrompt = getSolutionPrompt();

      expect(solutionPrompt).toContain("METRIC SYSTEM");
      expect(solutionPrompt).toContain("Decimal separator: **comma**");
      expect(solutionPrompt).toContain("12,7 km");
    });

    it("should inject Hungarian language in solution", async () => {
      await service.generateTask(metricRequest);

      const solutionPrompt = getSolutionPrompt();

      expect(solutionPrompt).toContain("Generate the entire solution in Hungarian");
      expect(solutionPrompt).toContain("All step descriptions, explanations, formulas, and text must be in Hungarian");
    });
  });

  describe("Imperial System (USA)", () => {
    it("should load imperial prompt template", async () => {
      await service.generateTask(imperialRequest);

      const taskPrompt = getTaskPrompt();

      // Should load task_generation_imperial.md
      expect(taskPrompt).toContain("IMPERIAL SYSTEM");
      expect(taskPrompt).toContain("miles (mi)");
      expect(taskPrompt).toContain("Decimal separator: **period**");
      expect(taskPrompt).toContain("12.7 miles");
      expect(taskPrompt).toContain("112,233,222");
    });

    it("should inject English language", async () => {
      await service.generateTask(imperialRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("Generate the entire task in English");
      expect(taskPrompt).toContain("Language: English");
      expect(taskPrompt).toContain("Write everything in English");
    });

    it("should load imperial solution template", async () => {
      await service.generateTask(imperialRequest);

      const solutionPrompt = getSolutionPrompt();

      expect(solutionPrompt).toContain("IMPERIAL SYSTEM");
      expect(solutionPrompt).toContain("Decimal separator: **period**");
      expect(solutionPrompt).toContain("12.7 miles");
      expect(solutionPrompt).toContain("1,250,000");
    });

    it("should inject English language in solution", async () => {
      await service.generateTask(imperialRequest);

      const solutionPrompt = getSolutionPrompt();

      expect(solutionPrompt).toContain("Generate the entire solution in English");
    });
  });

  describe("Prompt Structure Validation", () => {
    it("should call text generator twice (task + solution)", async () => {
      await service.generateTask(metricRequest);

      expect(mockTextGenerator.generate).toHaveBeenCalledTimes(2);
    });

    it("should call image generator for requested images", async () => {
      await service.generateTask(metricRequest);

      expect(mockImageGenerator.generate).toHaveBeenCalledTimes(1);
    });

    it("should not call image generator when images = 0", async () => {
      const noImageRequest: TaskGeneratorRequest = { ...metricRequest, number_of_images: 0 as 0 };
      await service.generateTask(noImageRequest);

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
      expect(savedTask.story_chunks).toEqual(["First paragraph.", "Second paragraph."]);
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

  describe("Different Languages", () => {
    test.each([
      { country: "DE", language: "German" },
      { country: "FR", language: "French" },
      { country: "ES", language: "Spanish" },
      { country: "IT", language: "Italian" },
      { country: "HU", language: "Hungarian" },
    ])("should use $language for country code $country", async ({ country, language }) => {
      const request = { ...metricRequest, country_code: country };
      await service.generateTask(request);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain(language);
      expect(taskPrompt).toContain(`Write everything in ${language}`);
    });

    it("should default to English for unknown country code", async () => {
      const unknownRequest = { ...metricRequest, country_code: "XX" };
      await service.generateTask(unknownRequest);

      const taskPrompt = getTaskPrompt();

      expect(taskPrompt).toContain("English");
    });
  });
});
