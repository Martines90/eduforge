/**
 * Fetch with Retry Logic
 * Implements exponential backoff to prevent infinite request loops
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attemptNumber: number) => boolean;
  onRetry?: (error: any, attemptNumber: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Default retry condition - only retry on network errors or 5xx server errors
 */
const defaultShouldRetry = (error: any, attemptNumber: number): boolean => {
  // Don't retry client errors (4xx)
  if (error.status >= 400 && error.status < 500) {
    return false;
  }

  // Retry network errors and server errors (5xx)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  if (error.status >= 500) {
    return true;
  }

  return false;
};

/**
 * Delay execution for a specified number of milliseconds
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 */
const calculateDelay = (
  attemptNumber: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attemptNumber - 1);
  const jitter = Math.random() * 0.3 * exponentialDelay; // Add 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Fetch with automatic retry and exponential backoff
 *
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param retryOptions - Retry configuration
 * @returns Response promise
 *
 * @example
 * ```typescript
 * const response = await fetchWithRetry('/api/data', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * }, {
 *   maxRetries: 3,
 *   onRetry: (error, attempt, delay) => {
 *     console.log(`Retry attempt ${attempt} after ${delay}ms`);
 *   }
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
  } = { ...DEFAULT_OPTIONS, ...retryOptions };

  const shouldRetry = retryOptions?.shouldRetry ?? defaultShouldRetry;
  const onRetry = retryOptions?.onRetry;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok or a client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error - check if we should retry
      lastError = { status: response.status, statusText: response.statusText };

      if (attempt < maxRetries && shouldRetry(lastError, attempt + 1)) {
        const delayMs = calculateDelay(attempt + 1, initialDelayMs, maxDelayMs, backoffMultiplier);

        if (onRetry) {
          onRetry(lastError, attempt + 1, delayMs);
        }

        await delay(delayMs);
        continue;
      }

      // Don't retry, return the error response
      return response;
    } catch (error: any) {
      lastError = error;

      // If this is the last attempt or we shouldn't retry, throw the error
      if (attempt >= maxRetries || !shouldRetry(error, attempt + 1)) {
        throw error;
      }

      // Calculate delay and retry
      const delayMs = calculateDelay(attempt + 1, initialDelayMs, maxDelayMs, backoffMultiplier);

      if (onRetry) {
        onRetry(error, attempt + 1, delayMs);
      }

      await delay(delayMs);
    }
  }

  // If we exhausted all retries, throw the last error
  throw lastError;
}

/**
 * Wrapper for JSON API calls with retry logic
 * Automatically parses JSON and handles errors
 *
 * @example
 * ```typescript
 * const data = await fetchJsonWithRetry<UserData>('/api/user', {
 *   method: 'GET',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 * ```
 */
export async function fetchJsonWithRetry<T = any>(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
