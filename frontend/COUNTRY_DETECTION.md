# Country Detection System

This document explains how EduForger automatically detects and sets the user's country preference.

## Important: Country = Language

**EduForger uses a country-based language system:**
- One country code determines the application language
- **No separate language selection**
- Country codes map directly to languages:
  - `HU` → Magyar (Hungarian)
  - `US` → English
  - `MX` → Español (Spanish)

**Cookie stored:** Only `eduforge_country` (e.g., "US", "HU", "MX")
**Language determined by:** Country code lookup in `lib/i18n/countries.ts`

## Priority Chain

The system uses a **3-tier priority chain** to determine the user's country:

### 1. Saved Cookie (Highest Priority)
- **Cookie name**: `eduforge_country`
- **Expires**: 1 year
- If a user has previously selected a country, this is **always** respected
- User can change this anytime via the country selector in the header

### 2. IP Geolocation (Server-side)
- **Runs in**: Next.js Middleware (`frontend/middleware.ts`)
- **Service**: [ipapi.co](https://ipapi.co) (Free tier: 1,000 requests/day)
- **Accuracy**: 95-99% at country level
- **Only runs when**: No country cookie exists

**Supported countries:**
- `US` - United States (English)
- `HU` - Hungary (Magyar)
- `MX` - Mexico (Español)

**For unsupported countries:** User is redirected to `/country-not-supported` with a friendly message and can select from supported countries

### 3. Country Selection Modal (User choice)
- **Runs when**: IP detection fails OR returns no result
- **Shows**: Modal with all supported countries (US, HU, MX)
- **User must select**: A country to continue using the app
- **Default**: `HU` (Hungarian) is pre-selected until user makes a choice

## How It Works

### First-Time Visit Flow (Supported Country)

```
1. User visits the app (e.g., from United States)
   ↓
2. Middleware checks for eduforge_country cookie
   ↓ (not found)
3. Middleware detects IP address
   ↓
4. Middleware calls ipapi.co API
   ↓
5. API returns "US" (supported country)
   ↓
6. Middleware sets eduforge_country=US cookie
   ↓
7. User sees content in English
```

### First-Time Visit Flow (Unsupported Country)

```
1. User visits the app (e.g., from Germany)
   ↓
2. Middleware checks for eduforge_country cookie
   ↓ (not found)
3. Middleware detects IP address
   ↓
4. Middleware calls ipapi.co API
   ↓
5. API returns "DE" (unsupported country)
   ↓
6. Middleware sets eduforge_country=UNSUPPORTED cookie
   ↓
7. Middleware redirects to /country-not-supported
   ↓
8. User sees friendly message:
   "Your Country Will Be Supported Soon!"
   "EduForger is currently available in: US, HU, MX"
```

### First-Time Visit Flow (Detection Failed)

```
1. User visits the app (localhost OR IP API timeout)
   ↓
2. Middleware checks for eduforge_country cookie
   ↓ (not found)
3. Middleware tries to detect IP address
   ↓ (fails - localhost OR API error)
4. No cookie is set, middleware allows request to continue
   ↓
5. UserContext detects no cookie exists
   ↓
6. UserContext shows CountrySelectionModal
   ↓
7. User selects country from modal (US, HU, or MX)
   ↓
8. Cookie is set, modal closes
   ↓
9. User sees content in selected language
```

### Returning User Flow

```
1. User visits the app
   ↓
2. Middleware checks for eduforge_country cookie
   ↓ (found: "HU")
3. Middleware skips IP detection
   ↓
4. User sees content in Hungarian
```

### Localhost/Development Flow

```
1. Developer runs app locally
   ↓
2. Middleware detects localhost IP (127.0.0.1)
   ↓
3. Middleware skips IP detection (localhost)
   ↓
4. UserContext detects no cookie exists
   ↓
5. CountrySelectionModal is shown to developer
   ↓
6. Developer selects country manually
```

## Implementation Files

### Core Files

- **`frontend/middleware.ts`** - Server-side IP detection (runs on every request)
- **`frontend/lib/utils/cookies.ts`** - Cookie management utilities
- **`frontend/lib/context/UserContext.tsx`** - User state management
- **`frontend/components/organisms/CountrySelectionModal/CountrySelectionModal.tsx`** - Manual country selection modal

### Configuration

**Supported countries:**
```typescript
// In middleware.ts
const COUNTRY_CODE_MAP: Record<string, string> = {
  'US': 'US',
  'HU': 'HU',
  'MX': 'MX',
};
```

**Country-language mappings:**
```typescript
// In lib/i18n/countries.ts
export const countries: Country[] = [
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', language: 'Magyar' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'English' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', language: 'Español' },
];
```

## Performance & Limits

### IP Geolocation API

- **Free tier**: 1,000 requests/day
- **Rate limit**: ~30 requests/minute (unofficial)
- **Timeout**: 2 seconds
- **Cache**: Handled by middleware (cookie prevents repeat API calls)

### Effective Request Count

Since the middleware **only calls the API when there's no cookie**, the actual API usage is:

- **~1,000 new unique visitors per day** before hitting the limit
- **Returning visitors**: 0 API calls (cookie exists)
- **After cookie expires (1 year)**: 1 API call to refresh

### Monitoring API Usage

To check your daily API usage:
```bash
curl https://ipapi.co/json/
```

Look for the `X-RateLimit-Remaining` header in the response.

## Testing

### Test IP Detection Locally

Since localhost IPs are skipped, you can test with a public IP:

```bash
# Test the API directly
curl https://ipapi.co/8.8.8.8/country/
# Returns: US

curl https://ipapi.co/json/
# Returns your current IP's country data
```

### Test in Production

1. Deploy the app
2. Clear cookies in your browser
3. Visit the app
4. Check DevTools → Application → Cookies
5. Verify `eduforge_country` is set to your country

### Test Country Override

1. Open DevTools → Application → Cookies
2. Change `eduforge_country` value (e.g., from `US` to `HU`)
3. Refresh the page
4. Content should switch to Hungarian

## VPN & Accuracy

**Question:** How accurate is this with VPNs?

**Answer:** IP geolocation is **95-99% accurate** for determining the actual physical location of an IP address. However:

- **VPN users (~10-15% of users)**: Will be detected as the VPN server's country
- **Corporate networks**: May show central office location
- **Mobile roaming**: May show home country or roaming country

**Solution:** Users can always override via the country selector in the header. The system **prioritizes user choice** over automatic detection.

## Alternative Solutions

If you want even higher accuracy or need to scale beyond 1,000 requests/day:

### Option 1: Upgrade ipapi.co
- **Basic plan**: $13/month for 30,000 requests
- **Pro plan**: $50/month for 150,000 requests

### Option 2: Use MaxMind GeoLite2 (Self-hosted)
- **Free**: Unlimited requests
- **Setup**: Download database, query locally
- **Complexity**: Requires database updates, more code

### Option 3: Use Cloudflare (Recommended for scale)
- **Free**: Unlimited with Cloudflare
- **Setup**: Add Cloudflare in front of Firebase Hosting
- **Header**: `CF-IPCountry` automatically added
- **Zero API calls**: All server-side

### Option 4: Vercel-specific (if you switch hosting)
- **Free**: Automatic with Vercel deployment
- **Header**: `x-vercel-ip-country`
- **No changes needed**: Just deploy to Vercel

## Troubleshooting

### Country not detected on localhost

**Expected behavior** - Localhost IPs are skipped. Browser language detection is used instead.

### API limit reached

If you hit 1,000 requests/day:
- Old users with cookies: Unaffected
- New users without cookies: Will fall back to browser language detection
- Consider implementing client-side caching or upgrading the API plan

### Wrong country detected

Check:
1. Is user on VPN?
2. Is cookie set correctly? (DevTools → Application → Cookies)
3. Can user manually override via country selector?

### Middleware not running

Check:
1. `middleware.ts` is in `frontend/` directory (not `frontend/src/`)
2. Build succeeds: `npm run build`
3. Middleware matcher is configured correctly (see `middleware.ts:103-116`)

## Future Enhancements

Possible improvements:

1. **Add more countries** - Extend `COUNTRY_CODE_MAP` and `LANGUAGE_MAP`
2. **Add analytics** - Track detection accuracy and API usage
3. **Add caching layer** - Cache IP→Country mappings in Redis/memory
4. **Switch to Cloudflare** - For unlimited free geolocation
5. **Detect city/region** - For more localized content (requires upgrade to ipapi.co)
