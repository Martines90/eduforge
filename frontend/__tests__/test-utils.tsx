/**
 * Test utilities - Common test helpers and wrappers
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock UserContext
const MockUserProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock CountryContext
const MockCountryProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Combined providers wrapper
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockUserProvider>
      <MockCountryProvider>
        {children}
      </MockCountryProvider>
    </MockUserProvider>
  );
};

// Custom render function that includes all providers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
