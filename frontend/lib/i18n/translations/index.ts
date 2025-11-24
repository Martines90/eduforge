import { CountryCode, Translations } from '@/types/i18n';
import { en } from './en';
import { hu } from './hu';

export const translations: Record<CountryCode, Translations> = {
  US: en,
  HU: hu,
};

export { en, hu };
