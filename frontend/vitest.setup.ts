import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock js-cookie to always return 'HU' for the country cookie in tests
// This prevents the CountrySelectionModal from appearing and blocking component tests
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn((name: string) => {
      // Return 'HU' for the eduforge_country cookie
      if (name === 'eduforge_country') return 'HU';
      return undefined;
    }),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock UserContext globally to prevent "useUser must be used within a UserProvider" errors
vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    user: null,
    loading: false,
    gradeSystem: 'grade_9_12' as const,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
  UserProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock CountryContext globally to prevent "useCountry must be used within CountryProvider" errors
vi.mock('@/lib/context/CountryContext', () => ({
  useCountry: () => ({
    country: 'HU' as const,
    setCountry: vi.fn(),
    loading: false,
  }),
  CountryProvider: ({ children }: { children: React.ReactNode }) => children,
}));
