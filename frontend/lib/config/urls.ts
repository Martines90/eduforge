/**
 * URL Configuration - SINGLE SOURCE OF TRUTH
 *
 * This module provides centralized URL configuration for both API and app URLs.
 * All URL construction throughout the app should use these utilities.
 */

/**
 * Get the API base URL
 * This is used for all backend API calls
 */
export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // In production (not localhost), use relative URLs for Firebase Hosting rewrites
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
    // In local development, use localhost
    return 'http://localhost:3000';
  }

  // 3. During SSR/build time
  // In production, use relative URLs
  // In development (local), use localhost
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
};

/**
 * Get the app base URL (frontend URL)
 * This is used for generating share links, OAuth redirects, etc.
 */
export const getAppBaseUrl = (): string => {
  // 1. Explicit environment variable (highest priority)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Check if we're in browser environment
  if (typeof window !== 'undefined') {
    // Use the current origin
    return window.location.origin;
  }

  // 3. Production default (Firebase Hosting)
  if (process.env.NODE_ENV === 'production') {
    return 'https://eduforge-d29d9.web.app';
  }

  // 4. Development default
  return 'http://localhost:3001';
};

/**
 * Singleton instances to avoid recalculating on every call
 */
export const API_BASE_URL = getApiBaseUrl();
export const APP_BASE_URL = getAppBaseUrl();

/**
 * Build a full URL for a given path
 * @param path - The path to append to the base URL (should start with /)
 * @param useApiUrl - Whether to use API URL (true) or App URL (false)
 */
export const buildUrl = (path: string, useApiUrl: boolean = false): string => {
  const baseUrl = useApiUrl ? API_BASE_URL : APP_BASE_URL;

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If baseUrl is empty (relative URLs in production), just return the path
  if (!baseUrl) {
    return normalizedPath;
  }

  // Otherwise combine base URL and path
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Build an API URL for a given endpoint
 * @param endpoint - The API endpoint (e.g., '/api/tasks' or 'api/tasks')
 */
export const buildApiUrl = (endpoint: string): string => {
  return buildUrl(endpoint, true);
};

/**
 * Build an app URL for a given path
 * @param path - The app path (e.g., '/tasks/123' or 'tasks/123')
 */
export const buildAppUrl = (path: string): string => {
  return buildUrl(path, false);
};
