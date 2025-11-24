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
jest.mock("../../utils/reference-tasks.helper");

// Import the mocked modules to access mock functions
import * as inspirationHelper from "../../utils/story-inspiration.helper";
import * as curriculumMapper from "../../utils/curriculum-mapper.helper";
import * as referenceTasks from "../../utils/reference-tasks.helper";

describe("TaskGeneratorService - Prompt Generation", () => {
  let service: TaskGeneratorService;
  let mockTextGenerator: jest.Mocked<TextGeneratorService>;
  let mockImageGenerator: jest.Mocked<ImageGeneratorService>;
  let mockTaskStorage: jest.Mocked<TaskStorageService>;

  // Helper function to get task system prompt (from generateWithSystemPrompt)
  const getTaskSystemPrompt = () => mockTextGenerator.generateWithSystemPrompt.mock.calls[0][0];

  // Helper function to get task user message (from generateWithSystemPrompt)
  const getTaskUserMessage = () => mockTextGenerator.generateWithSystemPrompt.mock.calls[0][1];

  // Helper function to get solution prompt (from generate)
  const getSolutionPrompt = () => mockTextGenerator.generate.mock.calls[0][0];

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
    // Clear DISABLE_IMAGE_GENERATION env variable for tests
    delete process.env.DISABLE_IMAGE_GENERATION;

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

    // Mock curriculum mapper functions
    (curriculumMapper.getCurriculumTopicByPath as jest.Mock) = jest.fn().mockReturnValue({
      topic: {
        key: "solving_basic",
        name: "Solving Basic Equations",
        short_description: "Introduction to solving basic linear equations",
        example_tasks: [
          "Solve for x: 2x + 5 = 13",
          "Solve for x: 3x - 7 = 11",
          "Solve for x: x/4 = 9"
        ],
      },
      parentTopics: [
        { key: "algebra", name: "Algebra" },
        { key: "linear_equations", name: "Linear Equations" },
        { key: "solving_basic", name: "Solving Basic Equations" },
      ],
      fullPath: "math:grade_9_10:algebra:linear_equations:solving_basic",
    });

    (curriculumMapper.formatCurriculumTopicForPrompt as jest.Mock) = jest.fn().mockReturnValue(
      "\n## CURRICULUM TOPIC INFORMATION\n**Topic:** Solving Basic Equations\n"
    );

    (curriculumMapper.getExampleTasks as jest.Mock) = jest.fn().mockReturnValue([
      "Solve for x: 2x + 5 = 13",
      "Solve for x: 3x - 7 = 11",
      "Solve for x: x/4 = 9"
    ]);

    // Mock reference tasks helper
    (referenceTasks.selectRandomReferenceTasks as jest.Mock) = jest.fn().mockReturnValue([
      {
        tags: "#Algebra > #Linear Equations",
        title: "Reference Task 1",
        description: "Description of reference task 1"
      },
      {
        tags: "#Geometry > #Circles",
        title: "Reference Task 2",
        description: "Description of reference task 2"
      },
    ]);

    (referenceTasks.formatReferenceTasksForPrompt as jest.Mock) = jest.fn().mockReturnValue(
      "\n## REFERENCE STYLE TASKS\nReference tasks for style guidance...\n"
    );

    // Mock text generator to capture the prompt
    mockTextGenerator.generateWithSystemPrompt = jest.fn().mockImplementation(async (systemPrompt: string, userPrompt: string) => {
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

    mockTextGenerator.generate = jest.fn().mockImplementation(async (prompt: string) => {
      // Return mock solution response
      return {
        text: JSON.stringify({
          solution_steps: [
            { step_number: 1, title: "Step 1", description: "First step", result: "10" },
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

  describe("System Prompt Approach", () => {
    it("should use system prompt template with replacements", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      // Should contain template content with placeholders replaced
      expect(systemPrompt).toContain("You are an expert math task designer");
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
      expect(parsedMessage).toHaveProperty("reference_style_tasks");
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

    it("should include reference tasks", async () => {
      await service.generateTask(metricRequest);

      const systemPrompt = getTaskSystemPrompt();

      expect(systemPrompt).toContain("REFERENCE STYLE TASKS");
    });
  });

  describe("Prompt Structure Validation", () => {
    it("should call generateWithSystemPrompt for task and generate for solution", async () => {
      await service.generateTask(metricRequest);

      expect(mockTextGenerator.generateWithSystemPrompt).toHaveBeenCalledTimes(1);
      expect(mockTextGenerator.generate).toHaveBeenCalledTimes(1);
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

    it("should include reference_style_tasks array", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();
      const parsed = JSON.parse(userMessage);

      expect(parsed.reference_style_tasks).toBeDefined();
      expect(Array.isArray(parsed.reference_style_tasks)).toBe(true);
    });

    it("should NOT include selected_example_index", async () => {
      await service.generateTask(metricRequest);

      const userMessage = getTaskUserMessage();
      const parsed = JSON.parse(userMessage);

      expect(parsed.selected_example_index).toBeUndefined();
    });
  });
});
