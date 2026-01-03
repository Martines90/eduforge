/**
 * ============================================================================
 * SUBJECTS - SINGLE SOURCE OF TRUTH
 * ============================================================================
 * This file contains all subject-related types and constants shared between
 * frontend and backend. DO NOT duplicate these definitions elsewhere.
 */

/**
 * Subject types for the entire application
 */
export type Subject =
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "information_technology"
  | "history"
  | "geography"
  | "literature";

/**
 * Subject option with localization data
 */
export interface SubjectOption {
  value: Subject;
  labelEN: string;
  labelHU: string;
  labelMX: string;
  emoji: string;
  category?: "stem" | "humanities" | "arts" | "other";
}

/**
 * SINGLE SOURCE OF TRUTH FOR ALL SUBJECTS
 * These are the only subjects available in the entire application.
 *
 * To add/remove subjects:
 * 1. Update the Subject type above
 * 2. Update this SUBJECTS array
 * 3. Update translation files (en.ts, hu.ts, mx.ts) in the "Subjects" section
 */
export const SUBJECTS: SubjectOption[] = [
  // STEM Subjects
  {
    value: "mathematics",
    labelEN: "Mathematics",
    labelHU: "Matematika",
    labelMX: "Matemáticas",
    emoji: "🔢",
    category: "stem",
  },
  {
    value: "physics",
    labelEN: "Physics",
    labelHU: "Fizika",
    labelMX: "Física",
    emoji: "⚛️",
    category: "stem",
  },
  {
    value: "chemistry",
    labelEN: "Chemistry",
    labelHU: "Kémia",
    labelMX: "Química",
    emoji: "🧪",
    category: "stem",
  },
  {
    value: "biology",
    labelEN: "Biology",
    labelHU: "Biológia",
    labelMX: "Biología",
    emoji: "🧬",
    category: "stem",
  },
  {
    value: "information_technology",
    labelEN: "Informatics",
    labelHU: "Informatika",
    labelMX: "Tecnología de la Información",
    emoji: "💻",
    category: "stem",
  },

  // Humanities & Social Sciences
  {
    value: "history",
    labelEN: "History",
    labelHU: "Történelem",
    labelMX: "Historia",
    emoji: "📜",
    category: "humanities",
  },
  {
    value: "geography",
    labelEN: "Geography",
    labelHU: "Földrajz",
    labelMX: "Geografía",
    emoji: "🌍",
    category: "humanities",
  },

  // Languages & Literature
  {
    value: "literature",
    labelEN: "Literature",
    labelHU: "Irodalom",
    labelMX: "Literatura",
    emoji: "📚",
    category: "humanities",
  },
];

/**
 * Get all subject values (for validation, filtering, etc.)
 */
export function getAllSubjectValues(): Subject[] {
  return SUBJECTS.map((s) => s.value);
}

/**
 * Validate if a string is a valid subject
 */
export function isValidSubject(value: string): value is Subject {
  return getAllSubjectValues().includes(value as Subject);
}

/**
 * Get subject option by value
 */
export function getSubjectOption(subject: Subject): SubjectOption | undefined {
  return SUBJECTS.find((s) => s.value === subject);
}
