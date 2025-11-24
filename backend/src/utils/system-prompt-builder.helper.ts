import * as fs from "fs";
import * as path from "path";
import { TaskGeneratorRequest } from "../types";
import {
  selectRandomReferenceTasks,
  formatReferenceTasksForPrompt,
} from "./reference-tasks.helper";
import {
  getCurriculumTopicByPath,
  formatCurriculumTopicForPrompt,
  getExampleTasks,
} from "./curriculum-mapper.helper";
import { getLanguageForCountry, getMeasurementSystem } from "./measurement-system.helper";

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

  // Get language and metric system
  const language = getLanguageForCountry(request.country_code);
  const metricSystem = getMeasurementSystem(request.country_code);

  // Step 1: Replace basic placeholders in template
  systemPrompt = systemPrompt.replace(/\{\{LANGUAGE\}\}/g, language);
  systemPrompt = systemPrompt.replace(/\{\{METRIC_SYSTEM\}\}/g, metricSystem);

  // Step 2: Get curriculum topic information
  const curriculumPathResult = getCurriculumTopicByPath(
    request.curriculum_path
  );
  if (!curriculumPathResult) {
    console.warn(
      `⚠️  Curriculum path not found: ${request.curriculum_path}, using generic prompt`
    );
  }

  // Step 3: Select 6 random reference tasks
  const referenceTasks = selectRandomReferenceTasks(6);

  // Step 4: Build the enriched JSON input object that represents what the USER MESSAGE will contain
  const taskInputJson = buildTaskInputJson(
    request,
    curriculumPathResult,
    referenceTasks
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

  // Add reference tasks for style guidance
  if (referenceTasks.length > 0) {
    additionalContext += formatReferenceTasksForPrompt(referenceTasks);
  }

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
  console.log(`   - Additional context: ${additionalContext.length} chars`);
  console.log(`   - Total prompt length: ${finalPrompt.length} chars`);
  console.log(`   - Reference tasks included: ${referenceTasks.length}`);
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
  curriculumPathResult: any,
  referenceTasks: any[]
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

  // Add reference style tasks (simplified format for the user message)
  if (referenceTasks.length > 0) {
    inputJson.reference_style_tasks = referenceTasks.map((task) => ({
      tags: task.tags,
      title: task.title,
      description: task.description,
    }));
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

  // Select 6 random reference tasks
  const referenceTasks = selectRandomReferenceTasks(6);

  // Build the input JSON
  const inputJson = buildTaskInputJson(
    request,
    curriculumPathResult,
    referenceTasks
  );

  return JSON.stringify(inputJson, null, 2);
}
