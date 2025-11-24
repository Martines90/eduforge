import { CountryCode } from '@/types/i18n';

/**
 * Map of browser language codes to our supported countries
 */
const LANGUAGE_MAP: Record<string, CountryCode> = {
  'hu': 'HU',
  'hu-HU': 'HU',
  'en': 'US',
  'en-US': 'US',
  'en-GB': 'US',
  'en-CA': 'US',
  'en-AU': 'US',
};

/**
 * Detect user's preferred country from browser settings
 * Falls back to Hungarian if detection fails
 */
export function detectBrowserCountry(): CountryCode {
  if (typeof window === 'undefined') {
    return 'HU'; // Default for SSR
  }

  // Try navigator.language
  const browserLang = navigator.language || (navigator as any).userLanguage;

  if (browserLang) {
    // Try exact match first (e.g., "hu-HU")
    if (LANGUAGE_MAP[browserLang]) {
      return LANGUAGE_MAP[browserLang];
    }

    // Try language code only (e.g., "hu" from "hu-HU")
    const langCode = browserLang.split('-')[0];
    if (LANGUAGE_MAP[langCode]) {
      return LANGUAGE_MAP[langCode];
    }
  }

  // Try all languages in user's preference list
  if (navigator.languages) {
    for (const lang of navigator.languages) {
      if (LANGUAGE_MAP[lang]) {
        return LANGUAGE_MAP[lang];
      }
      const langCode = lang.split('-')[0];
      if (LANGUAGE_MAP[langCode]) {
        return LANGUAGE_MAP[langCode];
      }
    }
  }

  // Default to Hungarian
  return 'HU';
}

/**
 * Get suggested country with confidence level
 */
export function getSuggestedCountry(): {
  country: CountryCode;
  confidence: 'high' | 'medium' | 'low';
} {
  if (typeof window === 'undefined') {
    return { country: 'HU', confidence: 'low' };
  }

  const browserLang = navigator.language || (navigator as any).userLanguage;

  // Exact match = high confidence
  if (browserLang && LANGUAGE_MAP[browserLang]) {
    return { country: LANGUAGE_MAP[browserLang], confidence: 'high' };
  }

  // Language code match = medium confidence
  if (browserLang) {
    const langCode = browserLang.split('-')[0];
    if (LANGUAGE_MAP[langCode]) {
      return { country: LANGUAGE_MAP[langCode], confidence: 'medium' };
    }
  }

  // Fallback = low confidence
  return { country: 'HU', confidence: 'low' };
}
