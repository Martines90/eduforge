import { EducationalModel } from '@/lib/context/UserContext';
import { CountryCode } from '@/types/i18n';

export interface EducationalModelOption {
  value: EducationalModel;
  labelEN: string;
  labelHU: string;
  description?: string;
  category?: 'secular' | 'religious' | 'alternative';
}

export const EDUCATIONAL_MODELS: EducationalModelOption[] = [
  // Secular Models
  {
    value: 'secular',
    labelEN: 'Secular',
    labelHU: 'Szekuláris',
    description: 'Non-religious, science-based education',
    category: 'secular',
  },
  {
    value: 'liberal',
    labelEN: 'Liberal',
    labelHU: 'Liberális',
    description: 'Progressive, student-centered approach',
    category: 'secular',
  },
  {
    value: 'conservative',
    labelEN: 'Conservative',
    labelHU: 'Konzervatív',
    description: 'Traditional values and structured learning',
    category: 'secular',
  },
  {
    value: 'traditional',
    labelEN: 'Traditional',
    labelHU: 'Hagyományos',
    description: 'Classical education methods',
    category: 'secular',
  },
  {
    value: 'progressive',
    labelEN: 'Progressive',
    labelHU: 'Progresszív',
    description: 'Modern, inquiry-based learning',
    category: 'secular',
  },

  // Religious Models
  {
    value: 'religious_christian',
    labelEN: 'Religious - Christian',
    labelHU: 'Vallási - Keresztény',
    description: 'Christian faith-based education',
    category: 'religious',
  },
  {
    value: 'religious_islamic',
    labelEN: 'Religious - Islamic',
    labelHU: 'Vallási - Iszlám',
    description: 'Islamic faith-based education',
    category: 'religious',
  },
  {
    value: 'religious_jewish',
    labelEN: 'Religious - Jewish',
    labelHU: 'Vallási - Zsidó',
    description: 'Jewish faith-based education',
    category: 'religious',
  },

  // Alternative Models
  {
    value: 'montessori',
    labelEN: 'Montessori',
    labelHU: 'Montessori',
    description: 'Self-directed, hands-on learning',
    category: 'alternative',
  },
  {
    value: 'waldorf',
    labelEN: 'Waldorf',
    labelHU: 'Waldorf',
    description: 'Holistic, arts-integrated education',
    category: 'alternative',
  },
];

/**
 * Get educational model label based on country/language
 */
export function getEducationalModelLabel(
  model: EducationalModel,
  country: CountryCode
): string {
  const modelOption = EDUCATIONAL_MODELS.find((m) => m.value === model);
  if (!modelOption) return model;

  return country === 'HU' ? modelOption.labelHU : modelOption.labelEN;
}

/**
 * Get all educational models with labels for a specific country
 */
export function getEducationalModelsForCountry(
  country: CountryCode
): Array<{ value: EducationalModel; label: string; description?: string }> {
  return EDUCATIONAL_MODELS.map((model) => ({
    value: model.value,
    label: country === 'HU' ? model.labelHU : model.labelEN,
    description: model.description,
  }));
}

/**
 * Get educational models by category
 */
export function getEducationalModelsByCategory(
  category: 'secular' | 'religious' | 'alternative',
  country: CountryCode
): Array<{ value: EducationalModel; label: string }> {
  return EDUCATIONAL_MODELS.filter((model) => model.category === category).map(
    (model) => ({
      value: model.value,
      label: country === 'HU' ? model.labelHU : model.labelEN,
    })
  );
}
