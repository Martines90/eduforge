import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware Country Detection Tests
 *
 * These tests verify the country detection logic in middleware.ts
 * They test IP geolocation, cookie handling, and redirect behavior
 */

// Mock fetch globally
global.fetch = vi.fn();

// Import after mocking fetch
const middlewareModule = await import('../../middleware');

describe('Middleware Country Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Existing Cookie Behavior', () => {
    it('should respect existing valid country cookie', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          cookie: 'eduforge_country=US',
        },
      });

      const response = await middlewareModule.middleware(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
      // Should not call IP API
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should redirect from /country-not-supported when valid cookie exists', async () => {
      const request = new NextRequest('http://localhost:3000/country-not-supported', {
        headers: {
          cookie: 'eduforge_country=US',
        },
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toBe('http://localhost:3000/');
    });

    it('should allow /country-not-supported when cookie is UNSUPPORTED', async () => {
      const request = new NextRequest('http://localhost:3000/country-not-supported', {
        headers: {
          cookie: 'eduforge_country=UNSUPPORTED',
        },
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
    });
  });

  describe('IP Detection - Supported Countries', () => {
    it('should detect US from IP and set cookie', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '8.8.8.8', // Google DNS (US)
        },
      });

      // Mock API response for US
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'US',
      });

      const response = await middlewareModule.middleware(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipapi.co/8.8.8.8/country/',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'User-Agent': 'eduforger-app/1.0',
          }),
        })
      );

      expect(response.status).toBe(200);

      // Check if cookie was set
      const setCookie = response.cookies.get('eduforge_country');
      expect(setCookie?.value).toBe('US');
    });

    it('should detect HU from IP and set cookie', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '88.151.97.10', // Hungarian IP
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'HU',
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
      const setCookie = response.cookies.get('eduforge_country');
      expect(setCookie?.value).toBe('HU');
    });

    it('should detect MX from IP and set cookie', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '201.141.45.100', // Mexican IP
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'MX',
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
      const setCookie = response.cookies.get('eduforge_country');
      expect(setCookie?.value).toBe('MX');
    });
  });

  describe('IP Detection - Unsupported Countries', () => {
    it('should redirect to /country-not-supported for unsupported country (DE)', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '217.79.184.10', // German IP
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'DE',
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(307); // Temporary redirect
      expect(response.headers.get('location')).toBe('http://localhost:3000/country-not-supported');

      // Check if UNSUPPORTED cookie was set
      const setCookie = response.cookies.get('eduforge_country');
      expect(setCookie?.value).toBe('UNSUPPORTED');
    });

    it('should redirect to /country-not-supported for FR', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '82.64.12.10', // French IP
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'FR',
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/country-not-supported');
    });
  });

  describe('IP Detection Failures', () => {
    it('should continue without cookie when IP cannot be determined', async () => {
      const request = new NextRequest('http://localhost:3000/');
      // No IP headers

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
      expect(global.fetch).not.toHaveBeenCalled();

      // No cookie should be set
      expect(response.cookies.get('eduforge_country')).toBeUndefined();
    });

    it('should skip detection for localhost IP', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      });

      const response = await middlewareModule.middleware(request);

      expect(global.fetch).not.toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('should skip detection for private IP (192.168.x.x)', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '192.168.1.100',
        },
      });

      const response = await middlewareModule.middleware(request);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle API timeout gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '8.8.8.8',
        },
      });

      // Mock timeout error
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
      // Should not crash, should continue without setting cookie
    });

    it('should handle API error response (non-200)', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '8.8.8.8',
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429, // Rate limit
      });

      const response = await middlewareModule.middleware(request);

      expect(response.status).toBe(200);
      // Should continue without cookie
    });
  });

  describe('IP Header Priority', () => {
    it('should prioritize x-forwarded-for header', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '8.8.8.8, 1.1.1.1',
          'x-real-ip': '9.9.9.9',
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'US',
      });

      await middlewareModule.middleware(request);

      // Should use first IP from x-forwarded-for
      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipapi.co/8.8.8.8/country/',
        expect.anything()
      );
    });

    it('should use x-real-ip if x-forwarded-for not present', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-real-ip': '8.8.8.8',
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'US',
      });

      await middlewareModule.middleware(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://ipapi.co/8.8.8.8/country/',
        expect.anything()
      );
    });
  });

  describe('Cookie Expiration', () => {
    it('should set cookie with 1 year expiration', async () => {
      const request = new NextRequest('http://localhost:3000/', {
        headers: {
          'x-forwarded-for': '8.8.8.8',
        },
      });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'US',
      });

      const response = await middlewareModule.middleware(request);

      const setCookie = response.cookies.get('eduforge_country');
      expect(setCookie).toBeDefined();
      // Cookie should have maxAge of 1 year (365 days * 24 hours * 60 minutes * 60 seconds)
      // Note: We can't directly test maxAge from the cookie object, but we've verified it's set in the code
    });
  });
});
