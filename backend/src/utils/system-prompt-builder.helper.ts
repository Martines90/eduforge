import * as fs from "fs";
import * as path from "path";
import { TaskGeneratorRequest } from "../types";
import {
  getCurriculumTopicByPath,
  formatCurriculumTopicForPrompt,
} from "./curriculum-mapper.helper";
import {
  getLanguageForCountry,
  getMeasurementSystem,
} from "./measurement-system.helper";
import { TASK_CHARACTER_LENGTH } from "@eduforger/shared/task-generation";

/**
 * Builds a complete system prompt by interpolating the template with all required data
 * @param request The task generator request
 * @returns The fully interpolated system prompt ready to use
 */
export function buildSystemPrompt(request: TaskGeneratorRequest): string {
  // Load the system prompt template
  // Path varies based on environment:
  // - Production/compiled: /workspace/dist/backend/src/utils/ -> /workspace/dist/genai/prompts/
  // - Development/tests: /workspace/backend/src/utils/ -> /workspace/backend/src/genai/prompts/

  // Try compiled path first (dist), then source path (src)
  const compiledPath = path.join(
    __dirname,
    "../../../genai/prompts/latest/system_prompt.template"
  );
  const sourcePath = path.join(
    __dirname,
    "../genai/prompts/latest/system_prompt.template.md"
  );

  let systemPrompt = "";
  let templatePath = compiledPath;

  try {
    // Try compiled path first (production/built code)
    if (fs.existsSync(compiledPath)) {
      systemPrompt = fs.readFileSync(compiledPath, "utf-8");
      templatePath = compiledPath;
    } else if (fs.existsSync(sourcePath)) {
      // Fall back to source path (development/tests)
      systemPrompt = fs.readFileSync(sourcePath, "utf-8");
      templatePath = sourcePath;
    } else {
      throw new Error(`Template not found in either compiled (${compiledPath}) or source (${sourcePath}) path`);
    }
  } catch (error) {
    console.error("❌ Error loading system prompt template:", error);
    console.error("❌ Attempted paths:", { compiledPath, sourcePath });
    throw new Error("Failed to load system prompt template");
  }

  // Load the scenario inspiration library
  // Try both compiled and source paths
  const compiledScenarioPath = path.join(
    __dirname,
    "../../../genai/prompts/scenario-inspiration-library"
  );
  const sourceScenarioPath = path.join(
    __dirname,
    "../genai/prompts/scenario-inspiration-library.md"
  );

  let scenarioLibrary = "";
  try {
    if (fs.existsSync(compiledScenarioPath)) {
      scenarioLibrary = fs.readFileSync(compiledScenarioPath, "utf-8");
    } else if (fs.existsSync(sourceScenarioPath)) {
      scenarioLibrary = fs.readFileSync(sourceScenarioPath, "utf-8");
    } else {
      console.warn("⚠️  Scenario inspiration library not found in either compiled or source path");
    }
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
  systemPrompt = systemPrompt.replace(
    /\{\{TASK_CHARACTER_MIN_LENGTH\}\}/g,
    TASK_CHARACTER_LENGTH.min.toString()
  );
  systemPrompt = systemPrompt.replace(
    /\{\{TASK_CHARACTER_MAX_LENGTH\}\}/g,
    TASK_CHARACTER_LENGTH.max.toString()
  );

  // Step 1.5: Append the scenario inspiration library if available
  if (scenarioLibrary) {
    systemPrompt += "\n\n---\n\n";
    systemPrompt += scenarioLibrary;
    systemPrompt += "\n\n---\n\n";
  }

  // Step 2: Get curriculum topic information
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🔍 LOADING CURRICULUM DATA FOR PROMPT`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📚 Curriculum path: ${request.curriculum_path}`);

  const curriculumPathResult = getCurriculumTopicByPath(
    request.curriculum_path
  );

  if (!curriculumPathResult) {
    console.warn(
      `⚠️  Curriculum path not found: ${request.curriculum_path}, using generic prompt`
    );
  } else {
    console.log(`✅ Curriculum topic found:`);
    console.log(`   Topic name: ${curriculumPathResult.topic.name}`);
    console.log(`   Topic key: ${curriculumPathResult.topic.key}`);
    console.log(`   Subject: ${curriculumPathResult.subject}`);
    console.log(`   Grade: ${curriculumPathResult.gradeLevel}`);
    console.log(`   Country: ${curriculumPathResult.country}`);
    console.log(`   Short description: ${curriculumPathResult.topic.short_description || 'N/A'}`);

    // Log example tasks
    const exampleTasks = curriculumPathResult.topic.example_tasks ||
                         curriculumPathResult.topic["example_tasks (COMPLETED)"] || [];
    console.log(`   Example tasks count: ${exampleTasks.length}`);
    if (exampleTasks.length > 0) {
      console.log(`   Example tasks:`);
      exampleTasks.forEach((task: string, i: number) => {
        console.log(`     ${i + 1}. ${task.substring(0, 100)}${task.length > 100 ? '...' : ''}`);
      });
    } else {
      console.warn(`   ⚠️  NO EXAMPLE TASKS FOUND! This will cause generic task generation!`);
    }
  }
  console.log(`${"=".repeat(80)}\n`);

  // Step 3: Build the enriched JSON input object that represents what the USER MESSAGE will contain
  const taskInputJson = buildTaskInputJson(request, curriculumPathResult);

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
  console.log(
    `   - Scenario library: ${scenarioLibrary ? scenarioLibrary.length + " chars (included)" : "not loaded"}`
  );
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
    const exampleTasks =
      topic.example_tasks || topic["example_tasks (COMPLETED)"] || [];

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
export function buildUserMessage(request: TaskGeneratorRequest): string {
  // Get curriculum topic information
  const curriculumPathResult = getCurriculumTopicByPath(
    request.curriculum_path
  );

  // Build the input JSON
  const inputJson = buildTaskInputJson(request, curriculumPathResult);

  return JSON.stringify(inputJson, null, 2);
}
