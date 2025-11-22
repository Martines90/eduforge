/**
 * Measurement System Helper
 * Determines measurement system based on country code
 */

export type MeasurementSystem = "metric" | "imperial";

/**
 * Countries using the Imperial system
 */
const IMPERIAL_COUNTRIES = ["US", "MM", "LR"]; // USA, Myanmar, Liberia

/**
 * Determines the measurement system based on country code
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "HU")
 * @returns "metric" or "imperial"
 */
export function getMeasurementSystem(countryCode: string): MeasurementSystem {
  const upperCode = countryCode.toUpperCase();
  return IMPERIAL_COUNTRIES.includes(upperCode) ? "imperial" : "metric";
}
