import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { UserProvider } from '@/lib/context/UserContext';
import { I18nProvider } from '@/lib/i18n/I18nContext';

/**
 * Custom render function that wraps components with necessary providers
 * for testing (UserProvider, I18nProvider)
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <I18nProvider>{children}</I18nProvider>
    </UserProvider>
  );
}

/**
 * Custom render that includes all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { renderWithProviders as render };
