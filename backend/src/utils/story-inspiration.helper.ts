/**
 * Story Inspiration Helper
 * Utility for generating random inspirational hints with support for different hint types
 */

import * as path from "path";
import * as fs from "fs";
import { DifficultyLevel, TargetGroup } from "../types";

// Config cache
let hintsLoaded = false;
let inspirationalHints: string[] = [];
let professionHints: string[] = [];
let eraHints: string[] = [];
let situationHints: string[] = [];
let locationHints: string[] = [];

/**
 * Loads all inspirational hint files (called once, then cached)
 */
function loadInspirationHints(): void {
  if (hintsLoaded) return;

  const basePath = path.join(
    __dirname,
    "../genai/task-generation-config/inspiration-vocablulary"
  );

  // Load main inspirational hints
  const hintsPath = path.join(basePath, "inspirational-hints.json");
  if (fs.existsSync(hintsPath)) {
    try {
      const content = fs.readFileSync(hintsPath, "utf-8");
      inspirationalHints = JSON.parse(content) as string[];
      console.log(`✅ Loaded ${inspirationalHints.length} inspirational hints`);
    } catch (error) {
      console.error("❌ Error loading inspirational hints:", error);
    }
  } else {
    console.warn(`⚠️  Inspirational hints file not found: ${hintsPath}`);
  }

  // Load profession hints
  const professionPath = path.join(
    basePath,
    "inspirational-profession-hints.json"
  );
  if (fs.existsSync(professionPath)) {
    try {
      const content = fs.readFileSync(professionPath, "utf-8");
      professionHints = JSON.parse(content) as string[];
      console.log(`✅ Loaded ${professionHints.length} profession hints`);
    } catch (error) {
      console.error("❌ Error loading profession hints:", error);
    }
  } else {
    console.warn(`⚠️  Profession hints file not found: ${professionPath}`);
  }

  // Load era hints
  const eraPath = path.join(basePath, "inspirational-era-hints.json");
  if (fs.existsSync(eraPath)) {
    try {
      const content = fs.readFileSync(eraPath, "utf-8");
      eraHints = JSON.parse(content) as string[];
      console.log(`✅ Loaded ${eraHints.length} era hints`);
    } catch (error) {
      console.error("❌ Error loading era hints:", error);
    }
  } else {
    console.warn(`⚠️  Era hints file not found: ${eraPath}`);
  }

  // Load situation hints
  const situationPath = path.join(
    basePath,
    "inspirational-situation-hints.json"
  );
  if (fs.existsSync(situationPath)) {
    try {
      const content = fs.readFileSync(situationPath, "utf-8");
      situationHints = JSON.parse(content) as string[];
      console.log(`✅ Loaded ${situationHints.length} situation hints`);
    } catch (error) {
      console.error("❌ Error loading situation hints:", error);
    }
  } else {
    console.warn(`⚠️  Situation hints file not found: ${situationPath}`);
  }

  // Load location hints
  const locationPath = path.join(basePath, "inspirational-location-hints.json");
  if (fs.existsSync(locationPath)) {
    try {
      const content = fs.readFileSync(locationPath, "utf-8");
      locationHints = JSON.parse(content) as string[];
      console.log(`✅ Loaded ${locationHints.length} location hints`);
    } catch (error) {
      console.error("❌ Error loading location hints:", error);
    }
  } else {
    console.warn(`⚠️  Location hints file not found: ${locationPath}`);
  }

  hintsLoaded = true;
}

/**
 * Picks N random unique hints from the hints array using Fisher-Yates shuffle
 * @param hintsArray Array to pick from
 * @param count Number of hints to pick
 * @returns Array of randomly selected hints
 */
function pickRandomHints(hintsArray: string[], count: number): string[] {
  if (hintsArray.length === 0) {
    return [];
  }

  // Ensure we don't try to pick more hints than available
  const actualCount = Math.min(count, hintsArray.length);

  // Create a copy of the array and shuffle it using Fisher-Yates algorithm
  const shuffled = [...hintsArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Return the first N elements
  return shuffled.slice(0, actualCount);
}

/**
 * Generates 50 random inspirational hints for variation 1
 * @returns Array of 50 randomly selected inspirational hints
 */
export function generateInspirationHintsVariation1(): string[] {
  loadInspirationHints();
  return pickRandomHints(inspirationalHints, 50);
}

/**
 * Picks ONE random location hint (mandatory for all tasks)
 * @returns A single randomly selected location
 */
export function generateRandomLocation(): string {
  loadInspirationHints();
  const locations = pickRandomHints(locationHints, 1);
  return locations.length > 0 ? locations[0] : "Europe";
}

/**
 * Picks 3 unique random location hints for the 3 task variations
 * Each variation gets its own location to ensure diversity
 * @returns Array of 3 randomly selected locations
 */
export function generate3UniqueLocations(): string[] {
  loadInspirationHints();
  const locations = pickRandomHints(locationHints, 3);

  // Ensure we have exactly 3 locations (fallback if not enough in the file)
  while (locations.length < 3) {
    locations.push(
      locationHints[locations.length % locationHints.length] || "Europe"
    );
  }

  return locations;
}

/**
 * Generates profession, era, and situation hints for variations 2 and 3
 * @returns Object with 10 profession hints, 3 era hints, and 3 situation hints
 */
export function generateProfessionEraAndSituationHints(): {
  professions: string[];
  eras: string[];
  situations: string[];
} {
  loadInspirationHints();
  return {
    professions: pickRandomHints(professionHints, 10),
    eras: pickRandomHints(eraHints, 3),
    situations: pickRandomHints(situationHints, 3),
  };
}

/**
 * @deprecated Use generateProfessionEraAndSituationHints instead
 */
export function generateProfessionAndEraHints(): {
  professions: string[];
  eras: string[];
} {
  loadInspirationHints();
  return {
    professions: pickRandomHints(professionHints, 10),
    eras: pickRandomHints(eraHints, 3),
  };
}

/**
 * Generates 10 random inspirational hints
 * @param _difficultyLevel Difficulty level (unused, kept for API compatibility)
 * @param _targetGroup Target audience (unused, kept for API compatibility)
 * @param _customKeywords Optional custom keywords (unused, kept for API compatibility)
 * @returns Array of 10 randomly selected inspirational hints
 * @deprecated Use generateInspirationHintsVariation1 or generateProfessionAndEraHints instead
 */
export function generateInspirationHints(
  _difficultyLevel?: DifficultyLevel,
  _targetGroup?: TargetGroup,
  _customKeywords: string[] = []
): string[] {
  loadInspirationHints();
  return pickRandomHints(inspirationalHints, 10);
}

/**
 * Builds prompt enhancement text from 50 inspirational hints (for variation 1)
 * @param hints Array of 50 inspirational hints
 * @returns Formatted prompt enhancement string
 */
export function buildInspirationPromptVariation1(hints: string[]): string {
  if (hints.length === 0) {
    return "";
  }

  let enhancement = "\n\n## INSPIRATIONAL SCENARIO HINTS (50 OPTIONS)\n\n";
  enhancement +=
    "Below are 50 randomly selected scenario ideas to inspire your task design. ";
  enhancement +=
    "**You MUST select ONE of these scenarios that best fits the mathematical topic** as the foundation for your story. ";
  enhancement +=
    "Use the chosen scenario to create an engaging, memorable context for the mathematical problem:\n\n";

  hints.forEach((hint, index) => {
    enhancement += `${index + 1}. ${hint}\n`;
  });

  enhancement +=
    "\n**CRITICAL INSTRUCTION:** Choose ONE scenario from the list above that best fits ";
  enhancement +=
    "the mathematical topic and difficulty level. Build your entire task story around this scenario, ";
  enhancement +=
    "making the mathematical problem a natural and essential part of that scenario.\n";

  return enhancement;
}

/**
 * Builds prompt enhancement text from profession, era, and situation hints (for variations 2 & 3)
 * @param professions Array of 10 profession hints
 * @param eras Array of 3 era hints
 * @param situations Array of 3 situation hints
 * @returns Formatted prompt enhancement string
 */
export function buildProfessionEraAndSituationPrompt(
  professions: string[],
  eras: string[],
  situations: string[]
): string {
  if (
    professions.length === 0 &&
    eras.length === 0 &&
    situations.length === 0
  ) {
    return "";
  }

  let enhancement = "\n\n## PROFESSION, ERA & SITUATION CONTEXT HINTS\n\n";
  enhancement +=
    "Below are randomly selected professions, historical eras, and situations to inspire your task design. ";
  enhancement +=
    "**You MUST select ONE profession, ONE era, and ONE situation that best fit the mathematical topic** ";
  enhancement += "to create a unique story context:\n\n";

  if (professions.length > 0) {
    enhancement += "### PROFESSIONS (Choose 1):\n";
    professions.forEach((profession, index) => {
      enhancement += `${index + 1}. ${profession}\n`;
    });
    enhancement += "\n";
  }

  if (eras.length > 0) {
    enhancement += "### HISTORICAL ERAS (Choose 1):\n";
    eras.forEach((era, index) => {
      enhancement += `${index + 1}. ${era}\n`;
    });
    enhancement += "\n";
  }

  if (situations.length > 0) {
    enhancement += "### SITUATIONS (Choose 1):\n";
    situations.forEach((situation, index) => {
      enhancement += `${index + 1}. ${situation}\n`;
    });
    enhancement += "\n";
  }

  enhancement +=
    "**CRITICAL INSTRUCTION:** Select the BEST-FIT profession, era, and situation combination from the lists above ";
  enhancement +=
    "that aligns with the mathematical topic and difficulty level. Build your task story as if the student ";
  enhancement +=
    "is working in that profession during that historical era, facing that specific situation, making the mathematical problem a natural and ";
  enhancement += "essential part of solving the situation in that context.\n";

  return enhancement;
}

/**
 * Builds prompt enhancement text from profession and era hints (for variations 2 & 3)
 * @param professions Array of 10 profession hints
 * @param eras Array of 3 era hints
 * @returns Formatted prompt enhancement string
 * @deprecated Use buildProfessionEraAndSituationPrompt instead
 */
export function buildProfessionAndEraPrompt(
  professions: string[],
  eras: string[]
): string {
  if (professions.length === 0 && eras.length === 0) {
    return "";
  }

  let enhancement = "\n\n## PROFESSION & ERA CONTEXT HINTS\n\n";
  enhancement +=
    "Below are randomly selected professions and historical eras to inspire your task design. ";
  enhancement +=
    "**You MUST select ONE profession and ONE era that best fit the mathematical topic** ";
  enhancement += "to create a unique story context:\n\n";

  if (professions.length > 0) {
    enhancement += "### PROFESSIONS (Choose 1):\n";
    professions.forEach((profession, index) => {
      enhancement += `${index + 1}. ${profession}\n`;
    });
    enhancement += "\n";
  }

  if (eras.length > 0) {
    enhancement += "### HISTORICAL ERAS (Choose 1):\n";
    eras.forEach((era, index) => {
      enhancement += `${index + 1}. ${era}\n`;
    });
    enhancement += "\n";
  }

  enhancement +=
    "**CRITICAL INSTRUCTION:** Select the BEST-FIT profession and era combination from the lists above ";
  enhancement +=
    "that aligns with the mathematical topic and difficulty level. Build your task story as if the student ";
  enhancement +=
    "is working in that profession during that historical era, making the mathematical problem a natural and ";
  enhancement += "essential part of their work in that context.\n";

  return enhancement;
}

/**
 * Builds prompt enhancement text from inspirational hints
 * @param hints Array of inspirational hints
 * @returns Formatted prompt enhancement string
 * @deprecated Use buildInspirationPromptVariation1 or buildProfessionAndEraPrompt instead
 */
export function buildInspirationPrompt(hints: string[]): string {
  if (hints.length === 0) {
    return "";
  }

  let enhancement = "\n\n## INSPIRATIONAL SCENARIO HINTS\n\n";
  enhancement +=
    "Below are 10 randomly selected scenario ideas to inspire your task design. ";
  enhancement +=
    "**You MUST select ONE of these scenarios** as the foundation for your story. ";
  enhancement +=
    "Use the chosen scenario to create an engaging, memorable context for the mathematical problem:\n\n";

  hints.forEach((hint, index) => {
    enhancement += `${index + 1}. ${hint}\n`;
  });

  enhancement +=
    "\n**CRITICAL INSTRUCTION:** Choose ONE scenario from the list above that best fits ";
  enhancement +=
    "the mathematical topic and difficulty level. Build your entire task story around this scenario, ";
  enhancement +=
    "making the mathematical problem a natural and essential part of that scenario.\n";

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
