/**
 * Curriculum Path Helper
 * Utilities for building file system paths from curriculum paths
 */

import * as path from "path";

/**
 * Converts a curriculum path string to a file system path
 *
 * Example:
 * Input: "math:grade_9_10:algebra:linear_equations:solving_basic_equations"
 * With countryCode="HU"
 * Output: "storage/hu/math/grade_9_10/algebra/linear_equations/solving_basic_equations"
 *
 * @param storageBaseDir The base storage directory
 * @param countryCode ISO country code (e.g., "HU", "US")
 * @param curriculumPath Colon-separated curriculum path
 * @returns Full file system path
 */
export function buildCurriculumStoragePath(
  storageBaseDir: string,
  countryCode: string,
  curriculumPath: string
): string {
  // Convert curriculum path parts to file system path
  // "math:grade_9_10:algebra" => "math/grade_9_10/algebra"
  const curriculumParts = curriculumPath.split(":").filter(Boolean);

  // Build the full path: storage/{country}/{curriculum_parts...}
  return path.join(
    storageBaseDir,
    countryCode.toLowerCase(),
    ...curriculumParts
  );
}

/**
 * Gets the tasks.json file path for a curriculum location
 *
 * @param curriculumDir The curriculum directory path
 * @returns Path to tasks.json file
 */
export function getTasksJsonPath(curriculumDir: string): string {
  return path.join(curriculumDir, "tasks.json");
}

/**
 * Gets the images directory path for a specific task
 *
 * @param curriculumDir The curriculum directory path
 * @param taskId The task ID
 * @returns Path to the task's images directory
 */
export function getTaskImagesDir(
  curriculumDir: string,
  taskId: string
): string {
  return path.join(curriculumDir, "images", taskId);
}

/**
 * Gets a specific image file path
 *
 * @param curriculumDir The curriculum directory path
 * @param taskId The task ID
 * @param imageId The image ID
 * @returns Path to the image file
 */
export function getTaskImagePath(
  curriculumDir: string,
  taskId: string,
  imageId: string
): string {
  return path.join(getTaskImagesDir(curriculumDir, taskId), `${imageId}.png`);
}

/**
 * Parses a curriculum path into its components
 *
 * @param curriculumPath Colon-separated curriculum path
 * @returns Object with curriculum components
 */
export function parseCurriculumPath(curriculumPath: string): {
  subject: string;
  grade: string;
  category: string;
  topic: string;
  subtopic: string;
  parts: string[];
} {
  const parts = curriculumPath.split(":").filter(Boolean);

  return {
    subject: parts[0] || "",
    grade: parts[1] || "",
    category: parts[2] || "",
    topic: parts[3] || "",
    subtopic: parts[4] || "",
    parts,
  };
}
