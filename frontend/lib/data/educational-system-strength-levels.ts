import { CountryCode } from '@/types/i18n';

export type StrengthLevel = 'very_weak' | 'weak' | 'average' | 'strong' | 'very_strong';

export interface StrengthLevelOption {
  value: StrengthLevel;
  labelEN: string;
  labelHU: string;
  description?: string;
  score: number; // Numeric value for comparisons (1-5)
}

export const STRENGTH_LEVELS: StrengthLevelOption[] = [
  {
    value: 'very_weak',
    labelEN: 'Very Weak',
    labelHU: 'Nagyon gyenge',
    description: 'Minimal foundational knowledge',
    score: 1,
  },
  {
    value: 'weak',
    labelEN: 'Weak',
    labelHU: 'Gyenge',
    description: 'Below average foundational knowledge',
    score: 2,
  },
  {
    value: 'average',
    labelEN: 'Average',
    labelHU: 'Átlagos',
    description: 'Standard foundational knowledge',
    score: 3,
  },
  {
    value: 'strong',
    labelEN: 'Strong',
    labelHU: 'Erős',
    description: 'Above average foundational knowledge',
    score: 4,
  },
  {
    value: 'very_strong',
    labelEN: 'Very Strong',
    labelHU: 'Nagyon erős',
    description: 'Exceptional foundational knowledge',
    score: 5,
  },
];

/**
 * Get strength level label based on country/language
 */
export function getStrengthLevelLabel(
  level: StrengthLevel,
  country: CountryCode
): string {
  const levelOption = STRENGTH_LEVELS.find((l) => l.value === level);
  if (!levelOption) return level;

  return country === 'HU' ? levelOption.labelHU : levelOption.labelEN;
}

/**
 * Get all strength levels with labels for a specific country
 */
export function getStrengthLevelsForCountry(
  country: CountryCode
): Array<{ value: StrengthLevel; label: string; description?: string; score: number }> {
  return STRENGTH_LEVELS.map((level) => ({
    value: level.value,
    label: country === 'HU' ? level.labelHU : level.labelEN,
    description: level.description,
    score: level.score,
  }));
}

/**
 * Get strength level by score
 */
export function getStrengthLevelByScore(score: number): StrengthLevel | null {
  const level = STRENGTH_LEVELS.find((l) => l.score === score);
  return level ? level.value : null;
}

/**
 * Compare two strength levels
 * Returns: negative if level1 < level2, 0 if equal, positive if level1 > level2
 */
export function compareStrengthLevels(
  level1: StrengthLevel,
  level2: StrengthLevel
): number {
  const score1 = STRENGTH_LEVELS.find((l) => l.value === level1)?.score ?? 0;
  const score2 = STRENGTH_LEVELS.find((l) => l.value === level2)?.score ?? 0;
  return score1 - score2;
}
