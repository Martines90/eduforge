import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';
import * as cookiesModule from '@/lib/utils/cookies';

/**
 * UserContext Country Detection Tests
 *
 * These tests verify the country detection and modal display logic
 * in UserContext when middleware doesn't set a cookie
 */

// Mock dependencies
vi.mock('@/lib/firebase/auth', () => ({
  onAuthChange: vi.fn((callback) => {
    // Immediately call with null user (not authenticated)
    callback(null);
    return vi.fn(); // Return unsubscribe function
  }),
  logoutUser: vi.fn(),
}));

vi.mock('@/lib/firebase/users', () => ({
  getUserById: vi.fn(),
}));

vi.mock('@/lib/services/api.service', () => ({
  getCurrentUser: vi.fn(),
  loginUser: vi.fn(),
}));

vi.mock('@/components/organisms/CountrySelectionModal/CountrySelectionModal', () => ({
  CountrySelectionModal: ({ open, onSelect, detectedCountry }: any) => {
    if (!open) return null;

    return (
      <div data-testid="country-selection-modal">
        <h2>Select Country</h2>
        <p>Detected: {detectedCountry}</p>
        <button onClick={() => onSelect('US')}>United States</button>
        <button onClick={() => onSelect('HU')}>Hungary</button>
        <button onClick={() => onSelect('MX')}>Mexico</button>
      </div>
    );
  },
}));

// Test component that uses UserContext
function TestComponent() {
  const { user } = useUser();

  return (
    <div>
      <div data-testid="country">{user.country}</div>
      <div data-testid="is-first-visit">{user.isFirstVisit.toString()}</div>
    </div>
  );
}

describe('UserContext Country Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear all cookies before each test
    vi.spyOn(cookiesModule, 'getCookie').mockReturnValue(undefined);
  });

  describe('No Country Cookie - Show Modal', () => {
    it('should show country selection modal when no cookie exists', async () => {
      // Mock: No country cookie
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return undefined;
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId('country-selection-modal')).toBeInTheDocument();
      });

      // Should keep default country (HU) until user selects - no browser language detection
      expect(screen.getByTestId('country')).toHaveTextContent('HU');
    });

    it('should set country and close modal when user selects', async () => {
      const setCookieSpy = vi.spyOn(cookiesModule, 'setCookie');

      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return undefined;
        }
        return undefined;
      });

      const { rerender } = render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId('country-selection-modal')).toBeInTheDocument();
      });

      // User clicks Hungary
      const hungaryButton = screen.getByText('Hungary');
      hungaryButton.click();

      // Cookie should be set
      await waitFor(() => {
        expect(setCookieSpy).toHaveBeenCalledWith(
          cookiesModule.COOKIE_NAMES.COUNTRY,
          'HU'
        );
      });

      // Country should update
      expect(screen.getByTestId('country')).toHaveTextContent('HU');
    });
  });

  describe('Valid Country Cookie - No Modal', () => {
    it('should NOT show modal when valid US cookie exists', async () => {
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return 'US';
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('US');
      });

      // Modal should NOT be visible
      expect(screen.queryByTestId('country-selection-modal')).not.toBeInTheDocument();
    });

    it('should NOT show modal when valid HU cookie exists', async () => {
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return 'HU';
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('HU');
      });

      expect(screen.queryByTestId('country-selection-modal')).not.toBeInTheDocument();
    });

    it('should NOT show modal when valid MX cookie exists', async () => {
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return 'MX';
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('MX');
      });

      expect(screen.queryByTestId('country-selection-modal')).not.toBeInTheDocument();
    });
  });

  describe('UNSUPPORTED Country Cookie', () => {
    it('should NOT show modal when UNSUPPORTED cookie exists (user already redirected)', async () => {
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return 'UNSUPPORTED';
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Modal should NOT show (user is on /country-not-supported page)
      await waitFor(() => {
        expect(screen.queryByTestId('country-selection-modal')).not.toBeInTheDocument();
      });

      // Country should remain at default (not updated)
      // The actual page content will be handled by the /country-not-supported route
    });
  });

  describe('setCountry function', () => {
    it('should update country and set cookie when setCountry is called', async () => {
      const setCookieSpy = vi.spyOn(cookiesModule, 'setCookie');

      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return 'US';
        }
        return undefined;
      });

      function TestComponentWithSetter() {
        const { user, setCountry } = useUser();

        return (
          <div>
            <div data-testid="country">{user.country}</div>
            <button onClick={() => setCountry('HU')}>Change to HU</button>
          </div>
        );
      }

      render(
        <UserProvider>
          <TestComponentWithSetter />
        </UserProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('US');
      });

      // Click button to change country
      const button = screen.getByText('Change to HU');
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('HU');
        expect(setCookieSpy).toHaveBeenCalledWith(
          cookiesModule.COOKIE_NAMES.COUNTRY,
          'HU'
        );
      });
    });
  });

  describe('Country Selection Modal', () => {
    it('should show modal with default country (HU) when no cookie exists', async () => {
      vi.spyOn(cookiesModule, 'getCookie').mockImplementation((name) => {
        if (name === cookiesModule.COOKIE_NAMES.COUNTRY) {
          return undefined;
        }
        return undefined;
      });

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Should show modal
      await waitFor(() => {
        expect(screen.getByTestId('country-selection-modal')).toBeInTheDocument();
      });

      // Should pass default country (HU) to modal as detected country
      // Note: Browser language is NOT used for automatic country setting
      // It's only used internally by CountrySelectionModal for suggesting defaults
      await waitFor(() => {
        expect(screen.getByText('Detected: HU')).toBeInTheDocument();
      });
    });
  });
});
