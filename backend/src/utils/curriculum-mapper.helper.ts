import * as fs from "fs";
import * as path from "path";

/**
 * Curriculum topic structure extracted from hu_math_grade_9_12.json
 */
export interface CurriculumTopic {
  key: string;
  name: string;
  short_description?: string;
  example_tasks?: string[];
  "example_tasks (COMPLETED)"?: string[]; // For purged file compatibility
  sub_topics?: CurriculumTopic[];
}

/**
 * Result of curriculum path navigation
 */
export interface CurriculumPathResult {
  topic: CurriculumTopic;
  parentTopics: CurriculumTopic[]; // Hierarchy from root to current topic
  fullPath: string;
}

/**
 * Maps subject keys to curriculum filenames
 */
const SUBJECT_FILE_MAP: Record<string, string> = {
  mathematics: "hu_mathematics_grade_9_12.json",
  math: "hu_mathematics_grade_9_12.json",
  physics: "hu_physics_grade_9_12.json",
  chemistry: "hu_chemistry_grade_9_12.json",
  biology: "hu_biology_grade_9_12.json",
  history: "hu_history_grade_9_12.json",
  literature: "hu_literature_grade_9_12.json",
  geography: "hu_geography_grade_9_12.json",
  informatics: "hu_informatics_grade_9_12.json",
  information_technology: "hu_informatics_grade_9_12.json",
};

/**
 * Loads the curriculum JSON file for a specific subject
 * @param subject The subject key (e.g., "physics", "mathematics")
 * @returns The curriculum data or null if loading fails
 */
function loadCurriculumData(subject: string): any | null {
  const filename = SUBJECT_FILE_MAP[subject.toLowerCase()];

  if (!filename) {
    console.error(`❌ Unknown subject: ${subject}. Available subjects: ${Object.keys(SUBJECT_FILE_MAP).join(", ")}`);
    return null;
  }

  const curriculumPath = path.join(
    __dirname,
    "../data/mappings/hu",
    filename
  );

  try {
    const data = fs.readFileSync(curriculumPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error loading curriculum data for ${subject} (${filename}):`, error);
    return null;
  }
}

/**
 * Navigates the curriculum tree to find a topic by its path
 * @param curriculumPath Path like "math:grade_9_10:halmazok:halmaz_megadas:halmaz_megadas_felsorolassal"
 *                       or "physics:grade_9_10:mechanika:mozgasi_energia"
 * @returns The topic data and parent hierarchy, or null if not found
 */
export function getCurriculumTopicByPath(
  curriculumPath: string
): CurriculumPathResult | null {
  // Split the path
  let pathSegments = curriculumPath.split(":");

  if (pathSegments.length === 0) {
    console.warn("⚠️  Empty curriculum path");
    return null;
  }

  // First segment should be the subject (e.g., "math", "physics")
  const subject = pathSegments[0];

  // Load curriculum data for this subject
  const curriculumData = loadCurriculumData(subject);
  if (!curriculumData) {
    return null;
  }

  // Remove subject from path segments
  pathSegments = pathSegments.slice(1);

  if (pathSegments.length === 0) {
    console.warn("⚠️  Curriculum path must include grade level after subject");
    return null;
  }

  // First segment should be the grade level (e.g., "grade_9_10")
  const gradeKey = pathSegments[0];
  const gradeTopics = curriculumData[gradeKey];

  if (!gradeTopics || !Array.isArray(gradeTopics)) {
    console.warn(`⚠️  Grade level not found: ${gradeKey}`);
    return null;
  }

  // Remove grade level from path segments
  pathSegments = pathSegments.slice(1);

  // If no more segments, return grade level info
  if (pathSegments.length === 0) {
    return {
      topic: {
        key: gradeKey,
        name: gradeKey.replace(/_/g, " ").toUpperCase(),
        short_description: "Grade level topics",
        sub_topics: gradeTopics,
      },
      parentTopics: [],
      fullPath: curriculumPath,
    };
  }

  // Navigate through the topic tree
  let currentTopics: CurriculumTopic[] = gradeTopics;
  const parentTopics: CurriculumTopic[] = [];

  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i];

    // Look for the segment in current topics array by key or name
    const foundTopic = currentTopics.find((t) =>
      t.key === segment || t.name === segment
    );

    if (!foundTopic) {
      console.warn(`⚠️  Topic not found in path: ${segment} (at depth ${i + 1})`);
      console.warn(`   Available topics at this level: ${currentTopics.map(t => `${t.key} ("${t.name}")`).join(', ')}`);
      return null;
    }

    parentTopics.push(foundTopic);

    // If this is the last segment, we found our target
    if (i === pathSegments.length - 1) {
      return {
        topic: foundTopic,
        parentTopics,
        fullPath: curriculumPath,
      };
    }

    // Move to next level
    if (!foundTopic.sub_topics || foundTopic.sub_topics.length === 0) {
      console.warn(`⚠️  No sub_topics found for: ${segment}`);
      return null;
    }

    currentTopics = foundTopic.sub_topics;
  }

  console.warn("⚠️  Unexpected end of path navigation");
  return null;
}

/**
 * Formats curriculum topic information for inclusion in the prompt
 * @param pathResult The curriculum path result
 * @returns Formatted string for prompt inclusion
 */
export function formatCurriculumTopicForPrompt(
  pathResult: CurriculumPathResult
): string {
  const { topic, parentTopics } = pathResult;

  let formatted = "\n## CURRICULUM TOPIC INFORMATION\n\n";

  // Show the hierarchy
  formatted += "**Topic Hierarchy:**\n";
  const hierarchy = parentTopics.map((t) => t.name).join(" > ");
  formatted += `${hierarchy}\n\n`;

  // Show current topic details
  formatted += "**Current Topic:**\n";
  formatted += `- **Key:** ${topic.key}\n`;
  formatted += `- **Name:** ${topic.name}\n`;
  formatted += `- **Description:** ${topic.short_description}\n\n`;

  // Get example tasks from either property name
  const exampleTasks = topic.example_tasks || topic["example_tasks (COMPLETED)"] || [];

  // Show example tasks if available
  if (exampleTasks.length > 0) {
    formatted += "**Example Tasks from Curriculum:**\n\n";
    formatted += "These are traditional textbook-style problems from the Hungarian curriculum. ";
    formatted += "Choose ONE of these tasks and transform it into a rich, story-driven, real-world problem.\n\n";

    exampleTasks.forEach((task, index) => {
      formatted += `${index + 1}. ${task}\n`;
    });

    formatted += "\n";
    formatted += "**Pick whichever example task you think would make the most engaging story-based problem.**\n\n";
  } else {
    formatted += "**Note:** No example tasks available for this topic. Create an appropriate problem based on the topic description.\n\n";
  }

  return formatted;
}

/**
 * Gets all example tasks from curriculum topic
 * @param pathResult The curriculum path result
 * @returns Array of example tasks or empty array if none found
 */
export function getExampleTasks(
  pathResult: CurriculumPathResult
): string[] {
  const { topic } = pathResult;

  // Get example tasks from either property name
  const exampleTasks = topic.example_tasks || topic["example_tasks (COMPLETED)"] || [];

  return exampleTasks;
}

