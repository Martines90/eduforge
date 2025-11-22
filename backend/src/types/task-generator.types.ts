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

/**
 * Response interface for the task generator endpoint
 */
export interface TaskGeneratorResponse {
  task_id: string;
  status: "generated" | "processing" | "failed";
  task_data?: GeneratedTask;
  error_message?: string;
}

/**
 * Generated task structure
 */
export interface GeneratedTask {
  // Task content
  title: string;
  story_chunks: string[]; // Array of story paragraphs (use **bold** for key values)
  story_text: string; // Full story (joined chunks) - for backward compatibility
  questions: string[]; // 1-2 questions (use 2 only when truly warranted)
  expected_answer_formats?: string[]; // Format descriptions for each answer

  // Solution
  solution_steps: SolutionStep[];
  final_answer?: string; // Complete final answer with context
  verification?: string; // How to verify the answer
  common_mistakes?: string[]; // Common mistakes to avoid
  key_concepts?: string[]; // Key mathematical concepts used

  // Images
  images: TaskImage[];

  // Metadata
  metadata: TaskMetadata;

  // Editing capabilities
  is_editable: boolean;
  created_at: string; // ISO datetime
}

export interface SolutionStep {
  step_number: number;
  title?: string; // Brief title for the step
  description: string;
  formula?: string; // LaTeX formatted
  calculation?: string; // LaTeX formatted
  result?: string; // Result of this step
  explanation?: string;
}

export interface TaskImage {
  image_id: string;
  url: string;
  type: "main" | "secondary";
  aspect_ratio: "5:3" | "3:2" | "1:3" | "1:1";
  prompt_used?: string; // The prompt that generated this image
}

export interface TaskMetadata {
  curriculum_path: string;
  target_group: TargetGroup;
  difficulty_level: DifficultyLevel;
  educational_model?: EducationalModel;
  country_code: string;
  estimated_time_minutes?: number;
  tags: string[];
}
