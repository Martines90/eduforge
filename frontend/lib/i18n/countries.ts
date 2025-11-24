import { Country, CountryCode } from '@/types/i18n';

export const countries: Country[] = [
  {
    code: 'HU',
    name: 'Hungary',
    flag: '🇭🇺',
    language: 'Magyar',
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    language: 'English',
  },
];

export const DEFAULT_COUNTRY: CountryCode = 'HU';

export const getCountryByCode = (code: CountryCode): Country | undefined => {
  return countries.find((country) => country.code === code);
};
