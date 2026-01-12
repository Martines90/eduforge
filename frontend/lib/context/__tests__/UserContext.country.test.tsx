import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider, useUser } from '../UserContext';
import Cookies from 'js-cookie';

/**
 * UserContext Country Detection Tests
 *
 * These tests verify the country detection and modal display logic
 * in UserContext when middleware doesn't set a cookie
 */

// Unmock UserContext (it's mocked globally in vitest.setup.ts)
vi.unmock('@/lib/context/UserContext');

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
        <p data-testid="detected-country">Detected: {detectedCountry}</p>
        <select
          data-testid="country-select-modal-dropdown"
          defaultValue={detectedCountry || ''}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Select a country</option>
          <option value="US">United States</option>
          <option value="HU">Hungary</option>
          <option value="MX">Mexico</option>
        </select>
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
    // Clear all cookies before each test by resetting the js-cookie mock
    vi.mocked(Cookies.get).mockReturnValue(undefined);
    vi.mocked(Cookies.set).mockClear();
    vi.mocked(Cookies.remove).mockClear();
  });

  describe('No Country Cookie - Show Modal', () => {
    it('should show country selection modal when no cookie exists', async () => {
      // Mock: No country cookie
      vi.mocked(Cookies.get).mockReturnValue(undefined);

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Modal should be visible
      await waitFor(() => {
        expect(screen.getByTestId('country-selection-modal')).toBeInTheDocument();
      });

      // TestComponent should NOT be rendered (blocked until country selected)
      expect(screen.queryByTestId('country')).not.toBeInTheDocument();
    });

    it('should set country and close modal when user selects', async () => {
      let countryCookie: string | undefined = undefined;

      // Mock cookie get/set to track state changes
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
          return countryCookie;
        }
        return undefined;
      });

      vi.mocked(Cookies.set).mockImplementation((name, value) => {
        if (name === 'eduforge_country') {
          countryCookie = value as string;
        }
        return undefined as any;
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

      // TestComponent should NOT be rendered yet
      expect(screen.queryByTestId('country')).not.toBeInTheDocument();

      // User selects Hungary from dropdown
      const select = screen.getByTestId('country-select-modal-dropdown');
      select.dispatchEvent(new Event('change', { bubbles: true }));
      Object.defineProperty(select, 'value', { value: 'HU', writable: true });
      select.dispatchEvent(new Event('change', { bubbles: true }));

      // Cookie should be set
      await waitFor(() => {
        expect(Cookies.set).toHaveBeenCalledWith(
          'eduforge_country',
          'HU',
          expect.any(Object)
        );
      });

      // Re-render to pick up the cookie change
      rerender(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Now TestComponent should be rendered and country should be set
      await waitFor(() => {
        expect(screen.getByTestId('country')).toHaveTextContent('HU');
      });
    });
  });

  describe('Valid Country Cookie - No Modal', () => {
    it('should NOT show modal when valid US cookie exists', async () => {
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
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
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
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
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
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
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
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
      vi.mocked(Cookies.get).mockImplementation((name) => {
        if (name === 'eduforge_country') {
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
        expect(Cookies.set).toHaveBeenCalledWith(
          'eduforge_country',
          'HU',
          expect.any(Object)
        );
      });
    });
  });

  describe('Country Selection Modal', () => {
    it('should show modal with default country (HU) when no cookie exists', async () => {
      vi.mocked(Cookies.get).mockReturnValue(undefined);

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
        expect(screen.getByTestId('detected-country')).toHaveTextContent('Detected: HU');
      });
    });
  });
});
