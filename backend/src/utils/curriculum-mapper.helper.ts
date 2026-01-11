import * as fs from "fs";
import * as path from "path";
import { CountryCode } from "../../../shared/types/countries";
import { GradeLevel, getGradesForCountry } from "../../../shared/types/grades";

/**
 * Curriculum topic structure
 */
export interface CurriculumTopic {
  key: string;
  name: string;
  short_description?: string;
  example_tasks?: string[];
  sub_topics?: CurriculumTopic[];
}

/**
 * Result of curriculum path navigation
 */
export interface CurriculumPathResult {
  topic: CurriculumTopic;
  parentTopics: CurriculumTopic[]; // Hierarchy from root to current topic
  fullPath: string;
  country: CountryCode;
  gradeLevel: GradeLevel;
  subject: string;
}

/**
 * Subject keys supported by the system
 */
const VALID_SUBJECTS = [
  "mathematics",
  "physics",
  "chemistry",
  "biology",
  "history",
  "geography",
  "literature",
  "informatics",
] as const;

type SubjectKey = (typeof VALID_SUBJECTS)[number];

/**
 * Validates if a string is a valid subject key
 */
function isValidSubject(subject: string): subject is SubjectKey {
  return VALID_SUBJECTS.includes(subject as SubjectKey);
}

/**
 * Loads the curriculum JSON file for a specific country, grade, and subject
 * New structure: data/mappings/{country}/{grade}/{subject}.json
 * Legacy structure: data/mappings/{country}/{country}_{subject}_{grade}.json
 *
 * @param country The country code (e.g., "HU", "MX", "US")
 * @param gradeLevel The grade level (e.g., "grade_9_12", "grade_3_6")
 * @param subject The subject key (e.g., "mathematics", "physics")
 * @returns The curriculum data (array of topics) or null if loading fails
 */
function loadCurriculumData(
  country: CountryCode,
  gradeLevel: GradeLevel,
  subject: string
): CurriculumTopic[] | null {
  const countryLower = country.toLowerCase();

  // Validate subject
  if (!isValidSubject(subject)) {
    console.error(
      `❌ Unknown subject: ${subject}. Available subjects: ${VALID_SUBJECTS.join(", ")}`
    );
    return null;
  }

  // Try new structure first: mappings/{country}/{grade}/{subject}.json
  const newPath = path.join(
    __dirname,
    "../data/mappings",
    countryLower,
    gradeLevel,
    `${subject}.json`
  );

  if (fs.existsSync(newPath)) {
    try {
      const data = fs.readFileSync(newPath, "utf-8");
      const parsed = JSON.parse(data);
      console.log(
        `✓ Loaded curriculum: ${countryLower}/${gradeLevel}/${subject}.json`
      );
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.error(`❌ Error loading curriculum data from ${newPath}:`, error);
      return null;
    }
  }

  // Try legacy structure: mappings/{country}/{country}_{subject}_{grade}.json
  const legacyFilename = `${countryLower}_${subject}_${gradeLevel}.json`;
  const legacyPath = path.join(
    __dirname,
    "../data/mappings",
    countryLower,
    legacyFilename
  );

  if (fs.existsSync(legacyPath)) {
    try {
      const data = fs.readFileSync(legacyPath, "utf-8");
      const parsed = JSON.parse(data);
      console.log(`⚠️  Using legacy curriculum: ${legacyFilename}`);

      // Legacy files might have nested structure with grade keys
      if (parsed[gradeLevel] && Array.isArray(parsed[gradeLevel])) {
        return parsed[gradeLevel];
      }

      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      console.error(
        `❌ Error loading legacy curriculum data from ${legacyPath}:`,
        error
      );
      return null;
    }
  }

  console.error(
    `❌ Curriculum file not found for ${country}/${gradeLevel}/${subject}. Tried:\n` +
      `  - ${newPath}\n` +
      `  - ${legacyPath}`
  );
  return null;
}

/**
 * Navigates the curriculum tree to find a topic by its path
 *
 * Path format: "{country}:{subject}:{grade}:{topic_key}:{subtopic_key}:..."
 * Examples:
 *   - "MX:mathematics:grade_10_12:algebra_expresiones_algebraicas"
 *   - "HU:physics:grade_9_12:mechanika:mozgasi_energia"
 *   - "US:chemistry:grade_9_12:atomic_structure:periodic_table"
 *
 * @param curriculumPath Path with country, subject, grade, and topic keys
 * @returns The topic data and parent hierarchy, or null if not found
 */
export function getCurriculumTopicByPath(
  curriculumPath: string
): CurriculumPathResult | null {
  // Split the path
  const pathSegments = curriculumPath.split(":");

  if (pathSegments.length < 3) {
    console.warn(
      "⚠️  Invalid curriculum path format. Expected: country:subject:grade[:topic_keys...]"
    );
    return null;
  }

  // Extract country, subject, and grade from path
  const [countryStr, subject, gradeStr, ...topicPath] = pathSegments;
  const country = countryStr.toUpperCase() as CountryCode;
  const gradeLevel = gradeStr as GradeLevel;

  // Validate country
  const grades = getGradesForCountry(country);
  if (grades.length === 0) {
    console.warn(`⚠️  Invalid country code: ${country}`);
    return null;
  }

  // Validate grade level for this country
  const validGrade = grades.find((g) => g.value === gradeLevel);
  if (!validGrade) {
    console.warn(
      `⚠️  Invalid grade level '${gradeLevel}' for country ${country}. Available: ${grades.map((g) => g.value).join(", ")}`
    );
    return null;
  }

  // Load curriculum data
  const curriculumData = loadCurriculumData(country, gradeLevel, subject);
  if (!curriculumData) {
    return null;
  }

  // If no topic path specified, return the root level
  if (topicPath.length === 0) {
    return {
      topic: {
        key: `${subject}_${gradeLevel}`,
        name: `${subject.charAt(0).toUpperCase() + subject.slice(1)} - ${validGrade.labelEN}`,
        short_description: `${subject} curriculum for ${validGrade.labelEN} in ${country}`,
        sub_topics: curriculumData,
      },
      parentTopics: [],
      fullPath: curriculumPath,
      country,
      gradeLevel,
      subject,
    };
  }

  // Navigate through the topic tree
  let currentTopics: CurriculumTopic[] = curriculumData;
  const parentTopics: CurriculumTopic[] = [];

  for (let i = 0; i < topicPath.length; i++) {
    const segment = topicPath[i];

    // Look for the segment in current topics array by key
    const foundTopic = currentTopics.find((t) => t.key === segment);

    if (!foundTopic) {
      console.warn(
        `⚠️  Topic not found in path: ${segment} (at depth ${i + 1})`
      );
      console.warn(
        `   Available topics at this level: ${currentTopics.map((t) => t.key).join(", ")}`
      );
      return null;
    }

    parentTopics.push(foundTopic);

    // If this is the last segment, we found our target
    if (i === topicPath.length - 1) {
      return {
        topic: foundTopic,
        parentTopics,
        fullPath: curriculumPath,
        country,
        gradeLevel,
        subject,
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
  const { topic, parentTopics, country, gradeLevel, subject } = pathResult;

  let formatted = "\n## CURRICULUM TOPIC INFORMATION\n\n";

  // Show metadata
  formatted += "**Curriculum Context:**\n";
  formatted += `- **Country:** ${country}\n`;
  formatted += `- **Grade Level:** ${gradeLevel}\n`;
  formatted += `- **Subject:** ${subject}\n\n`;

  // Show the hierarchy
  if (parentTopics.length > 0) {
    formatted += "**Topic Hierarchy:**\n";
    const hierarchy = parentTopics.map((t) => t.name).join(" > ");
    formatted += `${hierarchy}\n\n`;
  }

  // Show current topic details
  formatted += "**Current Topic:**\n";
  formatted += `- **Key:** ${topic.key}\n`;
  formatted += `- **Name:** ${topic.name}\n`;
  if (topic.short_description) {
    formatted += `- **Description:** ${topic.short_description}\n`;
  }
  formatted += "\n";

  // Show example tasks if available
  const exampleTasks = topic.example_tasks || [];

  if (exampleTasks.length > 0) {
    formatted += "**Example Tasks from Curriculum:**\n\n";
    formatted +=
      "These are traditional textbook-style problems from the official curriculum. ";
    formatted +=
      "Choose ONE of these tasks and transform it into a rich, story-driven, real-world problem.\n\n";

    exampleTasks.forEach((task, index) => {
      formatted += `${index + 1}. ${task}\n`;
    });

    formatted += "\n";
    formatted +=
      "**Pick whichever example task you think would make the most engaging story-based problem.**\n\n";
  } else {
    formatted +=
      "**Note:** No example tasks available for this topic. Create an appropriate problem based on the topic description.\n\n";
  }

  return formatted;
}

/**
 * Gets all example tasks from curriculum topic
 * @param pathResult The curriculum path result
 * @returns Array of example tasks or empty array if none found
 */
export function getExampleTasks(pathResult: CurriculumPathResult): string[] {
  const { topic } = pathResult;
  return topic.example_tasks || [];
}

/**
 * Lists all available subjects for a given country and grade
 * @param country The country code
 * @param gradeLevel The grade level
 * @returns Array of available subject keys
 */
export function getAvailableSubjects(
  country: CountryCode,
  gradeLevel: GradeLevel
): SubjectKey[] {
  const countryLower = country.toLowerCase();
  const availableSubjects: SubjectKey[] = [];

  for (const subject of VALID_SUBJECTS) {
    // Check new structure
    const newPath = path.join(
      __dirname,
      "../data/mappings",
      countryLower,
      gradeLevel,
      `${subject}.json`
    );

    // Check legacy structure
    const legacyPath = path.join(
      __dirname,
      "../data/mappings",
      countryLower,
      `${countryLower}_${subject}_${gradeLevel}.json`
    );

    if (fs.existsSync(newPath) || fs.existsSync(legacyPath)) {
      availableSubjects.push(subject);
    }
  }

  return availableSubjects;
}

/**
 * Gets the full curriculum tree for a subject
 * @param country The country code
 * @param gradeLevel The grade level
 * @param subject The subject key
 * @returns The full curriculum tree or null if not found
 */
export function getCurriculumTree(
  country: CountryCode,
  gradeLevel: GradeLevel,
  subject: string
): CurriculumTopic[] | null {
  return loadCurriculumData(country, gradeLevel, subject);
}
