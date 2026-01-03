import { Subject } from "@/types/i18n";
import { CountryCode } from "@/types/i18n";
import {
  SUBJECTS as SHARED_SUBJECTS,
  SubjectOption as SharedSubjectOption,
  getAllSubjectValues,
  isValidSubject,
  getSubjectOption
} from "@eduforge/shared";

/**
 * Re-export types from shared for backward compatibility
 */
export type SubjectOption = SharedSubjectOption;

/**
 * SUBJECTS CONSTANT - Imported from shared library
 * This is the single source of truth for all subjects.
 *
 * To add/remove subjects:
 * 1. Update shared/types/subjects.ts
 * 2. Update translation files (en.ts, hu.ts, mx.ts) in the "Subjects" section
 */
export const SUBJECTS = SHARED_SUBJECTS;

/**
 * Re-export utility functions from shared
 */
export { getAllSubjectValues, isValidSubject, getSubjectOption };

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
