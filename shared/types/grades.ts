/**
 * Grade System Configuration
 * Single Source of Truth for Grade Levels and Teacher Roles
 *
 * Each country has different grade structures and teacher role naming
 * This file centralizes all grade-related configuration
 */

import { CountryCode } from "./countries";

/**
 * Grade Level Type - All possible grade levels across all countries
 */
export type GradeLevel =
  // Hungary grades
  | "grade_1_4"
  | "grade_5_8"
  | "grade_9_12"
  // Mexico grades
  | "grade_3_6"
  | "grade_7_9"
  | "grade_10_12"
  // US grades
  | "grade_k_5"
  | "grade_6_8"
  | "grade_9_12";

/**
 * Teacher Role Type - All possible teacher roles across all countries
 */
export type TeacherRole =
  // Hungary
  | "pedagógus" // Elementary (1-4)
  | "általános_iskolai_tanár" // Middle school (5-8)
  | "középiskolai_tanár" // High school (9-12)
  // Mexico
  | "maestro_de_primaria" // Primary (3-6)
  | "maestro_de_secundaria" // Secondary (7-9)
  | "maestro_de_preparatoria" // High school (10-12)
  // US
  | "elementary_teacher" // Elementary (K-5)
  | "middle_school_teacher" // Middle school (6-8)
  | "high_school_teacher"; // High school (9-12)

/**
 * Grade Level Configuration
 */
export interface GradeConfig {
  value: GradeLevel;
  labelEN: string;
  labelLocal: string; // Localized label for the country
  gradeRange: string; // e.g., "1-4", "K-5"
  ageRange: string; // Typical age range
  teacherRole: TeacherRole;
  teacherRoleLabel: string; // Localized teacher role label
  order: number; // For sorting
}

/**
 * Country-specific grade system configuration
 */
export interface CountryGradeSystem {
  country: CountryCode;
  gradeLevels: GradeConfig[];
}

/**
 * Hungary Grade System
 */
export const HUNGARY_GRADES: GradeConfig[] = [
  {
    value: "grade_1_4",
    labelEN: "Grade 1-4",
    labelLocal: "1-4. osztály",
    gradeRange: "1-4",
    ageRange: "6-10",
    teacherRole: "pedagógus",
    teacherRoleLabel: "Pedagógus",
    order: 1,
  },
  {
    value: "grade_5_8",
    labelEN: "Grade 5-8",
    labelLocal: "5-8. osztály",
    gradeRange: "5-8",
    ageRange: "10-14",
    teacherRole: "általános_iskolai_tanár",
    teacherRoleLabel: "Általános iskolai tanár",
    order: 2,
  },
  {
    value: "grade_9_12",
    labelEN: "Grade 9-12",
    labelLocal: "9-12. osztály",
    gradeRange: "9-12",
    ageRange: "14-18",
    teacherRole: "középiskolai_tanár",
    teacherRoleLabel: "Középiskolai tanár",
    order: 3,
  },
];

/**
 * Mexico Grade System
 */
export const MEXICO_GRADES: GradeConfig[] = [
  {
    value: "grade_3_6",
    labelEN: "Grade 3-6 (Primaria)",
    labelLocal: "Primaria (3-6)",
    gradeRange: "3-6",
    ageRange: "9-12",
    teacherRole: "maestro_de_primaria",
    teacherRoleLabel: "Maestro de Primaria",
    order: 1,
  },
  {
    value: "grade_7_9",
    labelEN: "Grade 7-9 (Secundaria)",
    labelLocal: "Secundaria (7-9)",
    gradeRange: "7-9",
    ageRange: "12-15",
    teacherRole: "maestro_de_secundaria",
    teacherRoleLabel: "Maestro de Secundaria",
    order: 2,
  },
  {
    value: "grade_10_12",
    labelEN: "Grade 10-12 (Preparatoria)",
    labelLocal: "Preparatoria (10-12)",
    gradeRange: "10-12",
    ageRange: "15-18",
    teacherRole: "maestro_de_preparatoria",
    teacherRoleLabel: "Maestro de Preparatoria",
    order: 3,
  },
];

/**
 * United States Grade System
 */
export const US_GRADES: GradeConfig[] = [
  {
    value: "grade_k_5",
    labelEN: "Elementary (K-5)",
    labelLocal: "Elementary School (K-5)",
    gradeRange: "K-5",
    ageRange: "5-11",
    teacherRole: "elementary_teacher",
    teacherRoleLabel: "Elementary Teacher",
    order: 1,
  },
  {
    value: "grade_6_8",
    labelEN: "Middle School (6-8)",
    labelLocal: "Middle School (6-8)",
    gradeRange: "6-8",
    ageRange: "11-14",
    teacherRole: "middle_school_teacher",
    teacherRoleLabel: "Middle School Teacher",
    order: 2,
  },
  {
    value: "grade_9_12",
    labelEN: "High School (9-12)",
    labelLocal: "High School (9-12)",
    gradeRange: "9-12",
    ageRange: "14-18",
    teacherRole: "high_school_teacher",
    teacherRoleLabel: "High School Teacher",
    order: 3,
  },
];

/**
 * All country grade systems mapped by country code
 */
export const GRADE_SYSTEMS: Record<CountryCode, CountryGradeSystem> = {
  HU: {
    country: "HU",
    gradeLevels: HUNGARY_GRADES,
  },
  MX: {
    country: "MX",
    gradeLevels: MEXICO_GRADES,
  },
  US: {
    country: "US",
    gradeLevels: US_GRADES,
  },
};

/**
 * Get grade levels for a specific country
 */
export function getGradesForCountry(country: CountryCode): GradeConfig[] {
  return GRADE_SYSTEMS[country]?.gradeLevels || [];
}

/**
 * Get all grade level values for a country
 */
export function getGradeValuesForCountry(country: CountryCode): GradeLevel[] {
  return getGradesForCountry(country).map((grade) => grade.value);
}

/**
 * Get grade configuration by value
 */
export function getGradeConfig(
  country: CountryCode,
  gradeLevel: GradeLevel
): GradeConfig | undefined {
  return getGradesForCountry(country).find(
    (grade) => grade.value === gradeLevel
  );
}

/**
 * Get teacher role for a specific grade level
 */
export function getTeacherRole(
  country: CountryCode,
  gradeLevel: GradeLevel
): TeacherRole | undefined {
  const grade = getGradeConfig(country, gradeLevel);
  return grade?.teacherRole;
}

/**
 * Get teacher role label for a specific grade level
 */
export function getTeacherRoleLabel(
  country: CountryCode,
  gradeLevel: GradeLevel
): string | undefined {
  const grade = getGradeConfig(country, gradeLevel);
  return grade?.teacherRoleLabel;
}

/**
 * Check if a grade level is valid for a country
 */
export function isValidGradeForCountry(
  country: CountryCode,
  gradeLevel: GradeLevel
): boolean {
  return getGradeValuesForCountry(country).includes(gradeLevel);
}

/**
 * Get all unique grade levels across all countries
 */
export function getAllGradeLevels(): GradeLevel[] {
  const allGrades = Object.values(GRADE_SYSTEMS)
    .flatMap((system) => system.gradeLevels)
    .map((grade) => grade.value);

  // Remove duplicates (e.g., grade_9_12 exists in multiple countries)
  return Array.from(new Set(allGrades));
}

/**
 * Get all unique teacher roles across all countries
 */
export function getAllTeacherRoles(): TeacherRole[] {
  const allRoles = Object.values(GRADE_SYSTEMS)
    .flatMap((system) => system.gradeLevels)
    .map((grade) => grade.teacherRole);

  return Array.from(new Set(allRoles));
}
