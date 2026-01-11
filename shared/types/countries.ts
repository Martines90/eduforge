/**
 * Country Configuration
 * Single Source of Truth for Country Codes
 */

/**
 * Supported countries and their codes
 */
export type CountryCode = 'US' | 'HU' | 'MX';

/**
 * Country configuration
 */
export interface CountryConfig {
  code: CountryCode;
  nameEN: string;
  nameLocal: string;
  flag: string;
  language: string;
  languageCode: string;
}

/**
 * All supported countries
 */
export const COUNTRIES: CountryConfig[] = [
  {
    code: 'HU',
    nameEN: 'Hungary',
    nameLocal: 'Magyarország',
    flag: '🇭🇺',
    language: 'Hungarian',
    languageCode: 'hu',
  },
  {
    code: 'MX',
    nameEN: 'Mexico',
    nameLocal: 'México',
    flag: '🇲🇽',
    language: 'Spanish',
    languageCode: 'es',
  },
  {
    code: 'US',
    nameEN: 'United States',
    nameLocal: 'United States',
    flag: '🇺🇸',
    language: 'English',
    languageCode: 'en',
  },
];

/**
 * Get country config by code
 */
export function getCountryConfig(code: CountryCode): CountryConfig | undefined {
  return COUNTRIES.find(country => country.code === code);
}

/**
 * Get all country codes
 */
export function getAllCountryCodes(): CountryCode[] {
  return COUNTRIES.map(country => country.code);
}

/**
 * Check if a country code is valid
 */
export function isValidCountryCode(code: string): code is CountryCode {
  return getAllCountryCodes().includes(code as CountryCode);
}
