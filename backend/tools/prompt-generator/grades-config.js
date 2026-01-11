/**
 * Grade System Configuration - JavaScript version
 * Synced from shared/types/grades.ts
 *
 * This is the single source of truth for all grade configurations.
 * DO NOT modify this manually - it should be generated from shared/types/grades.ts
 */

const HUNGARY_GRADES = [
  {
    value: 'grade_1_4',
    labelEN: 'Grade 1-4',
    labelLocal: '1-4. osztály',
    gradeRange: '1-4',
    ageRange: '6-10',
    teacherRole: 'pedagógus',
    teacherRoleLabel: 'Pedagógus',
    order: 1,
  },
  {
    value: 'grade_5_8',
    labelEN: 'Grade 5-8',
    labelLocal: '5-8. osztály',
    gradeRange: '5-8',
    ageRange: '10-14',
    teacherRole: 'általános_iskolai_tanár',
    teacherRoleLabel: 'Általános iskolai tanár',
    order: 2,
  },
  {
    value: 'grade_9_12',
    labelEN: 'Grade 9-12',
    labelLocal: '9-12. osztály',
    gradeRange: '9-12',
    ageRange: '14-18',
    teacherRole: 'középiskolai_tanár',
    teacherRoleLabel: 'Középiskolai tanár',
    order: 3,
  },
];

const MEXICO_GRADES = [
  {
    value: 'grade_1_6',
    labelEN: 'Grade 1-6 (Primaria)',
    labelLocal: 'Primaria (1-6)',
    gradeRange: '1-6',
    ageRange: '6-12',
    teacherRole: 'maestro_de_primaria',
    teacherRoleLabel: 'Maestro de Primaria',
    order: 1,
  },
  {
    value: 'grade_7_9',
    labelEN: 'Grade 7-9 (Secundaria)',
    labelLocal: 'Secundaria (7-9)',
    gradeRange: '7-9',
    ageRange: '12-15',
    teacherRole: 'maestro_de_secundaria',
    teacherRoleLabel: 'Maestro de Secundaria',
    order: 2,
  },
  {
    value: 'grade_10_12',
    labelEN: 'Grade 10-12 (Preparatoria)',
    labelLocal: 'Preparatoria (10-12)',
    gradeRange: '10-12',
    ageRange: '15-18',
    teacherRole: 'maestro_de_preparatoria',
    teacherRoleLabel: 'Maestro de Preparatoria',
    order: 3,
  },
];

const US_GRADES = [
  {
    value: 'grade_k_5',
    labelEN: 'Elementary (K-5)',
    labelLocal: 'Elementary School (K-5)',
    gradeRange: 'K-5',
    ageRange: '5-11',
    teacherRole: 'elementary_teacher',
    teacherRoleLabel: 'Elementary Teacher',
    order: 1,
  },
  {
    value: 'grade_6_8',
    labelEN: 'Middle School (6-8)',
    labelLocal: 'Middle School (6-8)',
    gradeRange: '6-8',
    ageRange: '11-14',
    teacherRole: 'middle_school_teacher',
    teacherRoleLabel: 'Middle School Teacher',
    order: 2,
  },
  {
    value: 'grade_9_12',
    labelEN: 'High School (9-12)',
    labelLocal: 'High School (9-12)',
    gradeRange: '9-12',
    ageRange: '14-18',
    teacherRole: 'high_school_teacher',
    teacherRoleLabel: 'High School Teacher',
    order: 3,
  },
];

const GRADE_SYSTEMS = {
  HU: {
    country: 'HU',
    gradeLevels: HUNGARY_GRADES,
  },
  MX: {
    country: 'MX',
    gradeLevels: MEXICO_GRADES,
  },
  US: {
    country: 'US',
    gradeLevels: US_GRADES,
  },
};

/**
 * Get grade levels for a specific country
 */
function getGradesForCountry(countryCode) {
  return GRADE_SYSTEMS[countryCode]?.gradeLevels || [];
}

/**
 * Get all grade level values for a country
 */
function getGradeValuesForCountry(countryCode) {
  return getGradesForCountry(countryCode).map(grade => grade.value);
}

module.exports = {
  HUNGARY_GRADES,
  MEXICO_GRADES,
  US_GRADES,
  GRADE_SYSTEMS,
  getGradesForCountry,
  getGradeValuesForCountry,
};
