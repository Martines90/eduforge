import { Subject } from "@/types/i18n";
import { CountryCode } from "@/types/i18n";

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
 * 1. Update this SUBJECTS array
 * 2. Update the Subject type in types/i18n.ts
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
 * Get subject label based on country/language
 */
export function getSubjectLabel(
  subject: Subject,
  country: CountryCode
): string {
  const subjectOption = SUBJECTS.find((s) => s.value === subject);
  if (!subjectOption) return subject;

  switch (country) {
    case "HU":
      return subjectOption.labelHU;
    case "MX":
      return subjectOption.labelMX;
    default:
      return subjectOption.labelEN;
  }
}

/**
 * Get all subjects with labels for a specific country
 */
export function getSubjectsForCountry(
  country: CountryCode
): Array<{ value: Subject; label: string; emoji: string }> {
  return SUBJECTS.map((subject) => ({
    value: subject.value,
    label: getSubjectLabel(subject.value, country),
    emoji: subject.emoji,
  }));
}

/**
 * Get all subject values (for validation, filtering, etc.)
 */
export function getAllSubjectValues(): Subject[] {
  return SUBJECTS.map((s) => s.value);
}
