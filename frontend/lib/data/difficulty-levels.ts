import { CountryCode } from '@/types/i18n';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface DifficultyLevelOption {
  value: DifficultyLevel;
  labelEN: string;
  labelHU: string;
  description?: string;
}

export const DIFFICULTY_LEVELS: DifficultyLevelOption[] = [
  {
    value: 'easy',
    labelEN: 'Easy',
    labelHU: 'Könnyű',
    description: 'Basic level tasks',
  },
  {
    value: 'medium',
    labelEN: 'Medium',
    labelHU: 'Közepes',
    description: 'Intermediate level tasks',
  },
  {
    value: 'hard',
    labelEN: 'Hard',
    labelHU: 'Nehéz',
    description: 'Advanced level tasks',
  },
];

/**
 * Get difficulty level label based on country/language
 */
export function getDifficultyLevelLabel(
  level: DifficultyLevel,
  country: CountryCode
): string {
  const levelOption = DIFFICULTY_LEVELS.find((l) => l.value === level);
  if (!levelOption) return level;

  return country === 'HU' ? levelOption.labelHU : levelOption.labelEN;
}

/**
 * Get all difficulty levels with labels for a specific country
 */
export function getDifficultyLevelsForCountry(
  country: CountryCode
): Array<{ value: DifficultyLevel; label: string; description?: string }> {
  return DIFFICULTY_LEVELS.map((level) => ({
    value: level.value,
    label: country === 'HU' ? level.labelHU : level.labelEN,
    description: level.description,
  }));
}
