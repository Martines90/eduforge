/**
 * Measurement System and Locale Helper
 * Determines measurement system and language based on country code
 */

export type MeasurementSystem = "metric" | "imperial";

/**
 * Countries using the Imperial system
 */
const IMPERIAL_COUNTRIES = ["US", "MM", "LR"]; // USA, Myanmar, Liberia

/**
 * Country code to primary language mapping
 * ISO 3166-1 alpha-2 to language name
 */
const COUNTRY_LANGUAGES: Record<string, string> = {
  US: "English",
  GB: "English",
  CA: "English",
  AU: "English",
  NZ: "English",
  IE: "English",
  HU: "Hungarian",
  DE: "German",
  AT: "German",
  CH: "German",
  FR: "French",
  BE: "French",
  ES: "Spanish",
  MX: "Spanish",
  AR: "Spanish",
  IT: "Italian",
  PT: "Portuguese",
  BR: "Portuguese",
  NL: "Dutch",
  PL: "Polish",
  RO: "Romanian",
  CZ: "Czech",
  SK: "Slovak",
  SE: "Swedish",
  NO: "Norwegian",
  DK: "Danish",
  FI: "Finnish",
  GR: "Greek",
  TR: "Turkish",
  RU: "Russian",
  UA: "Ukrainian",
  JP: "Japanese",
  CN: "Chinese",
  KR: "Korean",
  IN: "English",
  // Add more as needed
};

/**
 * Determines the measurement system based on country code
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "HU")
 * @returns "metric" or "imperial"
 */
export function getMeasurementSystem(countryCode: string): MeasurementSystem {
  const upperCode = countryCode.toUpperCase();
  return IMPERIAL_COUNTRIES.includes(upperCode) ? "imperial" : "metric";
}

/**
 * Gets the primary language for a country code
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., "HU", "US", "DE")
 * @returns Language name (e.g., "Hungarian", "English", "German")
 */
export function getLanguageForCountry(countryCode: string): string {
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_LANGUAGES[upperCode] || "English"; // Default to English if not found
}
