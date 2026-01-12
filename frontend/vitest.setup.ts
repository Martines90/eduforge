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
