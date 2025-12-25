/**
 * Story Inspiration Helper
 * Simplified utility for generating random inspirational hints from a single JSON file
 */

import * as path from "path";
import * as fs from "fs";
import { DifficultyLevel, TargetGroup } from "../types";

// Config cache
let hintsLoaded = false;
let inspirationalHints: string[] = [];

/**
 * Loads the inspirational hints from JSON file (called once, then cached)
 */
function loadInspirationHints(): void {
  if (hintsLoaded) return;

  const hintsPath = path.join(
    __dirname,
    "../genai/task-generation-config/inspiration-vocablulary/inspirational-hints.json"
  );

  if (!fs.existsSync(hintsPath)) {
    console.warn(`⚠️  Inspirational hints file not found: ${hintsPath}`);
    hintsLoaded = true;
    return;
  }

  try {
    const content = fs.readFileSync(hintsPath, "utf-8");
    inspirationalHints = JSON.parse(content) as string[];
    hintsLoaded = true;
    console.log(`✅ Loaded ${inspirationalHints.length} inspirational hints`);
  } catch (error) {
    console.error("❌ Error loading inspirational hints:", error);
    hintsLoaded = true;
  }
}

/**
 * Picks N random unique hints from the hints array
 * @param count Number of hints to pick
 * @returns Array of randomly selected hints
 */
function pickRandomHints(count: number): string[] {
  if (inspirationalHints.length === 0) {
    return [];
  }

  // Ensure we don't try to pick more hints than available
  const actualCount = Math.min(count, inspirationalHints.length);

  // Create a copy of the array and shuffle it using Fisher-Yates algorithm
  const shuffled = [...inspirationalHints];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return the first N elements
  return shuffled.slice(0, actualCount);
}

/**
 * Generates 10 random inspirational hints
 * @param _difficultyLevel Difficulty level (unused, kept for API compatibility)
 * @param _targetGroup Target audience (unused, kept for API compatibility)
 * @param _customKeywords Optional custom keywords (unused, kept for API compatibility)
 * @returns Array of 10 randomly selected inspirational hints
 */
export function generateInspirationHints(
  _difficultyLevel?: DifficultyLevel,
  _targetGroup?: TargetGroup,
  _customKeywords: string[] = []
): string[] {
  // Ensure hints are loaded
  loadInspirationHints();

  // Pick 10 random hints
  return pickRandomHints(10);
}

/**
 * Builds prompt enhancement text from inspirational hints
 * @param hints Array of inspirational hints
 * @returns Formatted prompt enhancement string
 */
export function buildInspirationPrompt(hints: string[]): string {
  if (hints.length === 0) {
    return "";
  }

  let enhancement = "\n\n## INSPIRATIONAL SCENARIO HINTS\n\n";
  enhancement += "Below are 10 randomly selected scenario ideas to inspire your task design. ";
  enhancement += "**You MUST select ONE of these scenarios** as the foundation for your story. ";
  enhancement += "Use the chosen scenario to create an engaging, memorable context for the mathematical problem:\n\n";

  hints.forEach((hint, index) => {
    enhancement += `${index + 1}. ${hint}\n`;
  });

  enhancement += "\n**CRITICAL INSTRUCTION:** Choose ONE scenario from the list above that best fits ";
  enhancement += "the mathematical topic and difficulty level. Build your entire task story around this scenario, ";
  enhancement += "making the mathematical problem a natural and essential part of that scenario.\n";

  return enhancement;
}

/**
 * Generates complete story inspiration with hints
 * Legacy wrapper for backward compatibility with existing code
 * @param difficultyLevel Difficulty level
 * @param targetGroup Target audience
 * @param customKeywords Optional custom keywords
 * @returns Object with hints and prompt text
 */
export function generateStoryInspiration(
  difficultyLevel?: DifficultyLevel,
  targetGroup?: TargetGroup,
  customKeywords: string[] = []
): { hints: string[]; promptAdditions: string } {
  const hints = generateInspirationHints(
    difficultyLevel,
    targetGroup,
    customKeywords
  );
  const promptAdditions = buildInspirationPrompt(hints);

  return {
    hints,
    promptAdditions,
  };
}
