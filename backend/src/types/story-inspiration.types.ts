/**
 * Story Inspiration Configuration Types
 * Defines the structure for story generation vocabulary and weights
 */

// Era types
export interface Era {
  id: string;
  name: string;
  period: string;
  keywords: string[];
}

export interface ErasConfig {
  eras: Era[];
}

// Location types
export interface Location {
  id: string;
  name: string;
  type: "terrestrial" | "extraterrestrial" | "virtual" | "fictional";
  subcategories: string[];
}

export interface LocationsConfig {
  locations: Location[];
}

// Character types
export interface HeroPersonality {
  id: string;
  name: string;
  traits: string[];
}

export interface HeroRole {
  id: string;
  name: string;
  category: string;
  specializations: string[];
}

export interface HeroAge {
  id: string;
  name: string;
  age_range: string;
  characteristics: string[];
}

export interface CharactersConfig {
  hero_personalities: HeroPersonality[];
  hero_roles: HeroRole[];
  hero_ages: HeroAge[];
}

// Situation types
export interface Situation {
  id: string;
  name: string;
  type: string;
  variations: string[];
}

export interface SituationsConfig {
  situations: Situation[];
}

// Theme types
export interface Theme {
  id: string;
  name: string;
  message: string;
}

export interface ThemesConfig {
  themes: Theme[];
}

// Field types
export interface Field {
  id: string;
  name: string;
  subcategories: string[];
}

export interface FieldsConfig {
  fields: Field[];
}

// Stakes types
export interface Stake {
  id: string;
  name: string;
  description: string;
  intensity: string;
  examples: string[];
}

export interface StakesConfig {
  stakes: Stake[];
}

// Conflict types
export interface ConflictType {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

export interface ConflictsConfig {
  conflict_types: ConflictType[];
}

// Environment types
export interface Environment {
  id: string;
  name: string;
  category: string;
  settings: string[];
}

export interface EnvironmentsConfig {
  environments: Environment[];
}

// Narrative types
export interface StorytellingMode {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  example: string;
}

export interface NarrativeStructure {
  id: string;
  name: string;
  description: string;
  pattern: string;
}

export interface Pacing {
  id: string;
  name: string;
  characteristics: string[];
  suitable_for: string[];
}

export interface NarrativeConfig {
  storytelling_modes: StorytellingMode[];
  narrative_structures: NarrativeStructure[];
  pacing: Pacing[];
}

// Atmosphere types (vibes and genres)
export interface Vibe {
  id: string;
  name: string;
  mood: string;
  tone_descriptors: string[];
}

export interface Genre {
  id: string;
  name: string;
  characteristics: string[];
}

export interface AtmosphereConfig {
  vibes: Vibe[];
  genres: Genre[];
}

// Weight configuration
export interface WeightCategory {
  [key: string]: number;
}

export interface DifficultyAdjustment {
  prefer_simple_situations?: boolean;
  avoid_complex_themes?: boolean;
  lighter_vibes?: boolean;
  balanced?: boolean;
  complex_situations?: boolean;
  deeper_themes?: boolean;
  challenging_stakes?: boolean;
}

export interface WeightsConfig {
  description: string;
  default_weights: {
    eras: WeightCategory;
    locations: WeightCategory;
    hero_personalities: WeightCategory;
    situations: WeightCategory;
    vibes: WeightCategory;
  };
  difficulty_adjustments: {
    easy: DifficultyAdjustment;
    medium: DifficultyAdjustment;
    hard: DifficultyAdjustment;
  };
}

// Selected inspiration elements
export interface SelectedInspiration {
  era?: Era;
  location?: Location;
  personality?: HeroPersonality;
  role?: HeroRole;
  age?: HeroAge;
  situation?: Situation;
  theme?: Theme;
  vibe?: Vibe;
  genre?: Genre;
  field?: Field;
  stake?: Stake;
  conflict?: ConflictType;
  environment?: Environment;
  storytellingMode?: StorytellingMode;
  narrativeStructure?: NarrativeStructure;
  pacing?: Pacing;
}

// Story inspiration prompt enhancement
export interface StoryInspirationEnhancement {
  selected: SelectedInspiration;
  promptAdditions: string;
}
