import { CountryCode, Translations } from '@/types/i18n';
import { en } from './en';
import { hu } from './hu';
import { mx } from './mx';

export const translations: Record<CountryCode, Translations> = {
  US: en,
  HU: hu,
  MX: mx,
};

export { en, hu, mx };
