/**
 * Subject Type Detection Helper
 * Determines whether a subject is STEM or Humanities based on the shared config
 */

import { Subject, SUBJECTS, getSubjectOption } from "@eduforger/shared";

/**
 * Subject type categories
 */
export type SubjectType = "stem" | "humanities";

/**
 * Determines if a subject is a STEM subject
 * @param subject - The subject to check
 * @returns true if the subject is STEM, false otherwise
 */
export function isSTEMSubject(subject: Subject): boolean {
  const subjectOption = getSubjectOption(subject);
  return subjectOption?.category === "stem";
}

/**
 * Determines if a subject is a Humanities subject
 * @param subject - The subject to check
 * @returns true if the subject is Humanities, false otherwise
 */
export function isHumanitiesSubject(subject: Subject): boolean {
  const subjectOption = getSubjectOption(subject);
  return subjectOption?.category === "humanities";
}

/**
 * Gets the subject type (stem or humanities)
 * @param subject - The subject to check
 * @returns "stem" or "humanities" (defaults to "stem" for unknown subjects)
 */
export function getSubjectType(subject: Subject): SubjectType {
  const subjectOption = getSubjectOption(subject);

  if (subjectOption?.category === "humanities") {
    return "humanities";
  }

  // Default to STEM for stem subjects and any unknown categories
  return "stem";
}

/**
 * Gets all STEM subjects
 * @returns Array of STEM subject values
 */
export function getSTEMSubjects(): Subject[] {
  return SUBJECTS.filter((s) => s.category === "stem").map((s) => s.value);
}

/**
 * Gets all Humanities subjects
 * @returns Array of Humanities subject values
 */
export function getHumanitiesSubjects(): Subject[] {
  return SUBJECTS.filter((s) => s.category === "humanities").map(
    (s) => s.value
  );
}
