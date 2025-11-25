/**
 * Supported countries and their language codes
 */
export type CountryCode = 'US' | 'HU';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  language: string;
}

/**
 * Translation keys structure
 */
export interface Translations {
  // Navigation
  'Home': string;
  'Task Creator': string;
  'Open navigation menu': string;
  'Close menu': string;

  // Home page
  'Create educational tasks based on curriculum topics for grades 9-12': string;
  'Go to Task Creator': string;

  // Task Creator page
  'Select a curriculum topic to create an educational task': string;
  'Select Topic': string;
  'Grade 9-10': string;
  'Grade 11-12': string;
  'Reset': string;
  'Selection complete': string;
  'Please select a topic to begin': string;
  'Confirm Selection': string;
  'Topic': string;
  'Path': string;
  'Grade Level': string;
  'Selected Topic': string;
  'Create Task': string;
  'Clear Selection': string;

  // Select component
  'Select an option': string;
  'Select main topic': string;
  'Select sub-topic': string;
  'Level': string;

  // General
  'Close': string;
  'Open': string;
  'Menu': string;
  'Language': string;
  'Country': string;
}

export type TranslationKey = keyof Translations;

/**
 * User identity types
 */
export type UserIdentity = 'teacher' | 'non-teacher';
export type UserRole = 'guest' | 'registered' | 'admin';

/**
 * User authentication state
 */
export interface UserProfile {
  email: string;
  name: string;
  registeredAt: string;
}

/**
 * Subject types for teachers
 */
export type Subject =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'geography'
  | 'literature'
  | 'english'
  | 'computer-science'
  | 'arts'
  | 'music'
  | 'physical-education';
