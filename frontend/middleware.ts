import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/lib/utils/cookies';

/**
 * Map IP geolocation country codes to our supported CountryCode format
 *
 * IMPORTANT: EduForger uses COUNTRY-BASED LANGUAGE SYSTEM
 * - Country code = Language (HU→Magyar, US→English, MX→Español)
 * - Only ONE cookie: eduforge_country (stores country code)
 * - Language is determined by country code in lib/i18n/countries.ts
 * - No separate language selection
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  'US': 'US',    // United States → English
  'HU': 'HU',    // Hungary → Magyar
  'MX': 'MX',    // Mexico → Español
};

/**
 * Detect country from IP address using ipapi.co
 * Free tier: 1,000 requests/day
 * Returns:
 * - Supported country code (US/HU/MX)
 * - 'UNSUPPORTED' for detected but unsupported countries
 * - null if detection fails
 */
async function detectCountryFromIP(ip: string): Promise<string | null> {
  try {
    // Skip detection for localhost/private IPs
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      console.log('[Middleware] Localhost detected, skipping IP geolocation');
      return null;
    }

    console.log(`[Middleware] Detecting country for IP: ${ip}`);

    const response = await fetch(`https://ipapi.co/${ip}/country/`, {
      method: 'GET',
      headers: {
        'User-Agent': 'eduforger-app/1.0',
      },
      // Set a timeout to avoid blocking
      signal: AbortSignal.timeout(2000), // 2 second timeout
    });

    if (!response.ok) {
      console.warn(`[Middleware] IP API returned status: ${response.status}`);
      return null;
    }

    const countryCode = (await response.text()).trim().toUpperCase();
    console.log(`[Middleware] Detected country code: ${countryCode}`);

    // Check if country is supported
    const mappedCode = COUNTRY_CODE_MAP[countryCode];
    if (mappedCode) {
      return mappedCode;
    }

    // Country detected but not supported - mark as unsupported
    console.log(`[Middleware] Country ${countryCode} not supported`);
    return 'UNSUPPORTED';
  } catch (error) {
    console.error('[Middleware] IP geolocation error:', error);
    return null;
  }
}

/**
 * Get client IP from request headers
 * Handles various proxy/CDN scenarios (Vercel, Cloudflare, etc.)
 */
function getClientIP(request: NextRequest): string | null {
  // Try various headers in order of reliability
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is the client
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Vercel-specific header
  const vercelIP = request.headers.get('x-vercel-forwarded-for');
  if (vercelIP) {
    return vercelIP.split(',')[0].trim();
  }

  // Cloudflare
  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) {
    return cfIP;
  }

  return null;
}

/**
 * Next.js Middleware
 * Runs on every request BEFORE the page is rendered
 *
 * Flow:
 * 1. If cookie exists → respect it
 * 2. Detect from IP:
 *    - Supported country (US/HU/MX) → set cookie, continue
 *    - Unsupported country → redirect to /country-not-supported
 *    - Detection failed → let app show country selection modal
 */
export async function middleware(request: NextRequest) {
  // Check if country cookie already exists (PRIORITY #1)
  const existingCountry = request.cookies.get(COOKIE_NAMES.COUNTRY)?.value;

  if (existingCountry) {
    // User already has a country preference - respect it
    console.log(`[Middleware] Country cookie exists: ${existingCountry}`);

    // If user is on country-not-supported page with a valid country, redirect to home
    if (request.nextUrl.pathname === '/country-not-supported' &&
        existingCountry !== 'UNSUPPORTED' &&
        COUNTRY_CODE_MAP[existingCountry]) {
      console.log('[Middleware] User has valid country, redirecting from country-not-supported to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // No country cookie - try to detect from IP (PRIORITY #2)
  console.log('[Middleware] No country cookie found, attempting IP detection...');

  const clientIP = getClientIP(request);
  if (!clientIP) {
    console.log('[Middleware] Could not determine client IP, will show country selection modal');
    return NextResponse.next();
  }

  const detectedCountry = await detectCountryFromIP(clientIP);

  if (detectedCountry === 'UNSUPPORTED') {
    // Country detected but not supported - redirect to info page
    console.log('[Middleware] Unsupported country detected, redirecting to /country-not-supported');

    // Set cookie to prevent repeated redirects
    const response = NextResponse.redirect(new URL('/country-not-supported', request.url));
    response.cookies.set(COOKIE_NAMES.COUNTRY, 'UNSUPPORTED', {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response;
  } else if (detectedCountry) {
    // Supported country detected
    console.log(`[Middleware] Setting country cookie to: ${detectedCountry}`);
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAMES.COUNTRY, detectedCountry, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
    return response;
  } else {
    // Detection failed - let app show country selection modal
    console.log('[Middleware] IP detection failed, will show country selection modal');
    return NextResponse.next();
  }
}

/**
 * Configure which routes this middleware runs on
 * Run on all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
};
