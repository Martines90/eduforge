import * as fs from "fs";
import * as path from "path";
import { TaskGeneratorRequest } from "../types";
import {
  getCurriculumTopicByPath,
  formatCurriculumTopicForPrompt,
  getExampleTasks,
} from "./curriculum-mapper.helper";
import { getLanguageForCountry, getMeasurementSystem } from "./measurement-system.helper";
import { TASK_CHARACTER_LENGTH } from "../config/task-generation.config";

/**
 * Builds a complete system prompt by interpolating the template with all required data
 * @param request The task generator request
 * @returns The fully interpolated system prompt ready to use
 */
export function buildSystemPrompt(
  request: TaskGeneratorRequest
): string {
  // Load the system prompt template
  const templatePath = path.join(
    __dirname,
    "../genai/prompts/latest/system_prompt.template.md"
  );

  let systemPrompt = "";
  try {
    systemPrompt = fs.readFileSync(templatePath, "utf-8");
  } catch (error) {
    console.error("❌ Error loading system prompt template:", error);
    throw new Error("Failed to load system prompt template");
  }

  // Load the scenario inspiration library
  const scenarioLibraryPath = path.join(
    __dirname,
    "../genai/prompts/scenario-inspiration-library.md"
  );

  let scenarioLibrary = "";
  try {
    scenarioLibrary = fs.readFileSync(scenarioLibraryPath, "utf-8");
  } catch (error) {
    console.warn("⚠️  Could not load scenario inspiration library:", error);
    // Continue without the library - it's optional
  }

  // Get language and metric system
  const language = getLanguageForCountry(request.country_code);
  const metricSystem = getMeasurementSystem(request.country_code);

  // Step 1: Replace basic placeholders in template
  systemPrompt = systemPrompt.replace(/\{\{LANGUAGE\}\}/g, language);
  systemPrompt = systemPrompt.replace(/\{\{METRIC_SYSTEM\}\}/g, metricSystem);
  systemPrompt = systemPrompt.replace(/\{\{TASK_CHARACTER_MIN_LENGTH\}\}/g, TASK_CHARACTER_LENGTH.min.toString());
  systemPrompt = systemPrompt.replace(/\{\{TASK_CHARACTER_MAX_LENGTH\}\}/g, TASK_CHARACTER_LENGTH.max.toString());

  // Step 1.5: Append the scenario inspiration library if available
  if (scenarioLibrary) {
    systemPrompt += "\n\n---\n\n";
    systemPrompt += scenarioLibrary;
    systemPrompt += "\n\n---\n\n";
  }

  // Step 2: Get curriculum topic information
  const curriculumPathResult = getCurriculumTopicByPath(
    request.curriculum_path
  );
  if (!curriculumPathResult) {
    console.warn(
      `⚠️  Curriculum path not found: ${request.curriculum_path}, using generic prompt`
    );
  }

  // Step 3: Build the enriched JSON input object that represents what the USER MESSAGE will contain
  const taskInputJson = buildTaskInputJson(
    request,
    curriculumPathResult
  );

  // Step 5: Add additional context sections to the system prompt
  // These sections enhance the template with runtime-specific information

  let additionalContext = "\n\n---\n\n";
  additionalContext += "## ADDITIONAL CONTEXT FOR THIS GENERATION\n\n";

  // Add task configuration details
  additionalContext += "### Task Configuration\n\n";
  additionalContext += `- **Target Audience:** ${request.target_group}\n`;
  additionalContext += `- **Difficulty Level:** ${request.difficulty_level}\n`;
  additionalContext += `- **Educational Model:** ${request.educational_model}\n`;
  additionalContext += `- **Display Template:** ${request.display_template}\n`;
  additionalContext += `- **Number of Images:** ${request.number_of_images}\n`;
  additionalContext += `- **Country/Locale:** ${request.country_code}\n`;
  additionalContext += `- **Language:** ${language}\n`;
  additionalContext += `- **Measurement System:** ${metricSystem}\n\n`;

  // Add precision settings
  additionalContext += "### Mathematical Precision Requirements\n\n";
  additionalContext += `- **Constant Precision:** ${request.precision_settings.constant_precision} decimal places\n`;
  additionalContext += `- **Intermediate Precision:** ${request.precision_settings.intermediate_precision} decimal places\n`;
  additionalContext += `- **Final Answer Precision:** ${request.precision_settings.final_answer_precision} decimal places\n`;
  if (request.precision_settings.use_exact_values) {
    additionalContext += `- **Use Exact Values:** Yes (use fractions, π symbol where appropriate)\n`;
  } else {
    additionalContext += `- **Use Exact Values:** No (use decimal approximations)\n`;
  }
  additionalContext += "\n";

  // Add custom keywords if provided
  if (request.custom_keywords && request.custom_keywords.length > 0) {
    additionalContext += "### Custom Keywords (MANDATORY)\n\n";
    additionalContext +=
      "**CRITICAL REQUIREMENT**: You MUST incorporate AT LEAST 2 of these keywords into the story as central elements:\n\n";
    additionalContext += `**Keywords:** ${request.custom_keywords.join(", ")}\n\n`;
    additionalContext +=
      "- These keywords should be integral to the plot, not just mentioned in passing\n";
    additionalContext += "- Build the narrative around these themes\n";
    additionalContext += "- Make them relevant to the mathematical problem\n\n";
  }

  // Add curriculum topic information if available
  if (curriculumPathResult) {
    additionalContext += formatCurriculumTopicForPrompt(curriculumPathResult);
  }

  // NOTE: Inspirational hints are now added per-variation in buildTaskPromptWithVariation()
  // This allows different variations to use different hint strategies

  // Add reminder about the input format
  additionalContext += "\n## EXPECTED USER MESSAGE FORMAT\n\n";
  additionalContext +=
    "The user message you will receive will be a **single JSON object** in this exact format:\n\n";
  additionalContext += "```json\n";
  additionalContext += JSON.stringify(taskInputJson, null, 2);
  additionalContext += "\n```\n\n";
  additionalContext +=
    "Process this JSON according to the instructions in the system prompt above.\n\n";

  // Combine the template with additional context
  const finalPrompt = systemPrompt + additionalContext;

  console.log("✅ Built enhanced system prompt with all context");
  console.log(`   - Template length: ${systemPrompt.length} chars`);
  console.log(`   - Scenario library: ${scenarioLibrary ? scenarioLibrary.length + ' chars (included)' : 'not loaded'}`);
  console.log(`   - Additional context: ${additionalContext.length} chars`);
  console.log(`   - Total prompt length: ${finalPrompt.length} chars`);
  console.log(
    `   - Curriculum topic: ${curriculumPathResult?.topic.name || "N/A"}`
  );

  return finalPrompt;
}

/**
 * Builds the task input JSON object that will be sent as the user message
 * This represents the structured input the AI will process
 */
function buildTaskInputJson(
  request: TaskGeneratorRequest,
  curriculumPathResult: any
): any {
  const language = getLanguageForCountry(request.country_code);
  const metricSystem = getMeasurementSystem(request.country_code);

  const inputJson: any = {
    task_config: {
      language: language,
      metric_system: metricSystem,
    },
  };

  // Add curriculum topic if available
  if (curriculumPathResult) {
    const topic = curriculumPathResult.topic;
    // Get example tasks from either property name
    const exampleTasks = topic.example_tasks || topic["example_tasks (COMPLETED)"] || [];

    inputJson.curriculum_topic = {
      key: topic.key,
      name: topic.name,
      short_description: topic.short_description || "",
      example_tasks: exampleTasks,
    };
  }

  // Add task ID hint from curriculum path if available
  if (curriculumPathResult) {
    const topicKey = curriculumPathResult.topic.key;
    inputJson.task_id_hint = `${topicKey}_generated`;
  }

  return inputJson;
}

/**
 * Builds the user message (JSON input) that will be sent to the AI
 * @param request The task generator request
 * @returns The JSON string to send as user message
 */
export function buildUserMessage(
  request: TaskGeneratorRequest
): string {
  const language = getLanguageForCountry(request.country_code);
  const metricSystem = getMeasurementSystem(request.country_code);

  // Get curriculum topic information
  const curriculumPathResult = getCurriculumTopicByPath(
    request.curriculum_path
  );

  // Build the input JSON
  const inputJson = buildTaskInputJson(
    request,
    curriculumPathResult
  );

  return JSON.stringify(inputJson, null, 2);
}
