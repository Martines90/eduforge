/**
 * Main request interface for the task generator endpoint
 * POST /api/task-generator
 */
export interface TaskGeneratorRequest {
  // Navigation path to the specific curriculum topic
  curriculum_path: string; // e.g., "math:grade_9_10:algebra:linear_equations:solving_basic_equations"

  // User country/locale settings
  country_code: string; // e.g., "US", "HU", "GB" - determines language and unit system

  // Target audience configuration
  target_group: TargetGroup;

  // Task difficulty
  difficulty_level: DifficultyLevel;

  // Educational approach/philosophy
  educational_model: EducationalModel;

  // Visual configuration
  number_of_images: NumberOfImages;
  display_template: DisplayTemplate;

  // Mathematical precision settings
  precision_settings: PrecisionSettings;

  // Optional custom keywords for story inspiration
  custom_keywords: string[];

  // Optional template ID if user has saved templates
  template_id: string;
}

/**
 * Target audience gender specification
 */
export type TargetGroup = "boys" | "girls" | "mixed";

/**
 * Task difficulty levels
 */
export type DifficultyLevel = "easy" | "medium" | "hard";

/**
 * Educational models/approaches
 */
export type EducationalModel =
  | "secular"
  | "conservative"
  | "traditional"
  | "liberal"
  | "progressive"
  | "religious_christian"
  | "religious_islamic"
  | "religious_jewish"
  | "montessori"
  | "waldorf";

/**
 * Number of illustration images to generate
 */
export type NumberOfImages = 0 | 1 | 2;

/**
 * Display template options for task layout
 */
export type DisplayTemplate =
  | "classic"
  | "modern"
  | "comic"
  | "minimal"
  | "illustrated";

/**
 * Mathematical precision configuration
 */
export interface PrecisionSettings {
  // Precision for constants like π
  constant_precision: number; // e.g., 2 for 3.14, 4 for 3.1416

  // Precision for intermediate calculations
  intermediate_precision: number;

  // Precision for final answer
  final_answer_precision: number;

  // Whether to use exact values (fractions, π symbol) or decimals
  use_exact_values?: boolean;
}
