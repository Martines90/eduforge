# User Context & Cookie-Based i18n

## Overview

Enhanced internationalization system with:
- **Cookie-based storage** (1-year expiration, more persistent than localStorage)
- **First-visit modal** for country selection
- **Browser language detection** with intelligent suggestions
- **UserContext** for global user state management
- **Seamless integration** with i18n system

## Architecture

### Context Providers Hierarchy

```typescript
<UserProvider>          // Manages user state and preferences
  <I18nProvider>        // Handles translations (uses UserContext)
    <OnboardingHandler> // Shows modal on first visit
      <App />
    </OnboardingHandler>
  </I18nProvider>
</UserProvider>
```

## UserContext

### Purpose
Centralized state management for user preferences:
- Country/language preference
- First visit detection
- Onboarding completion status
- Future: theme, notifications, etc.

### Interface

```typescript
interface UserState {
  country: CountryCode;
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
}

interface UserContextType {
  user: UserState;
  setCountry: (country: CountryCode) => void;
  completeOnboarding: () => void;
  resetUser: () => void;
}
```

### Usage

```typescript
import { useUser } from '@/lib/context';

function MyComponent() {
  const { user, setCountry, completeOnboarding } = useUser();

  return (
    <div>
      <p>Current: {user.country}</p>
      <p>First visit: {user.isFirstVisit ? 'Yes' : 'No'}</p>
      <button onClick={() => setCountry('US')}>
        Switch to English
      </button>
    </div>
  );
}
```

## Cookie Management

### Cookie Names & Configuration

```typescript
COOKIE_NAMES = {
  COUNTRY: 'eduforge_country',      // Stores selected country
  FIRST_VISIT: 'eduforge_first_visit' // Marks onboarding complete
}

COOKIE_OPTIONS = {
  expires: 365,           // 1 year
  sameSite: 'lax',
  secure: true (production only)
}
```

### Cookie Utilities

```typescript
import { getCookie, setCookie, removeCookie } from '@/lib/utils/cookies';

// Get country from cookie
const country = getCookie(COOKIE_NAMES.COUNTRY);

// Save country (1-year expiration)
setCookie(COOKIE_NAMES.COUNTRY, 'HU');

// Remove cookie
removeCookie(COOKIE_NAMES.COUNTRY);

// Check if first visit
const isFirst = isFirstVisit(); // true if no country cookie
```

## Browser Language Detection

### How It Works

1. **Check navigator.language** (e.g., "hu-HU", "en-US")
2. **Try exact match** against language map
3. **Try language code only** (e.g., "hu" from "hu-HU")
4. **Check navigator.languages array** (user's preferred languages)
5. **Default to Hungarian** if no match

### Language Map

```typescript
const LANGUAGE_MAP = {
  'hu': 'HU',
  'hu-HU': 'HU',
  'en': 'US',
  'en-US': 'US',
  'en-GB': 'US',
  'en-CA': 'US',
  'en-AU': 'US',
};
```

### Detection Functions

```typescript
import { detectBrowserCountry, getSuggestedCountry } from '@/lib/utils';

// Simple detection
const country = detectBrowserCountry(); // 'HU' or 'US'

// Detection with confidence
const { country, confidence } = getSuggestedCountry();
// confidence: 'high' | 'medium' | 'low'
// high = exact language match (hu-HU -> HU)
// medium = language code match (hu -> HU)
// low = fallback (no match, defaulted to HU)
```

## First-Visit Onboarding Flow

### User Journey

**New User (No Cookie):**
1. Page loads
2. UserContext detects first visit (no cookie)
3. Browser language detected automatically
4. OnboardingHandler shows modal
5. Modal displays detected language as suggestion
6. User selects country
7. Country saved to cookie (365 days)
8. Modal closes, user proceeds

**Returning User (Has Cookie):**
1. Page loads
2. UserContext reads country from cookie
3. Language applied immediately
4. No modal shown

### Modal Features

- **Beautiful Design**: Gradient header, card-based selection
- **Language Detection**: Shows detected language with "Recommended" badge
- **Visual Feedback**: Selected country highlighted with checkmark
- **Cannot Close**: Modal is required (no escape key, no backdrop click)
- **Help Text**: Explains they can change later from header

### OnboardingHandler Component

```typescript
// Automatically shows modal on first visit
// No manual trigger needed
<OnboardingHandler />
```

Handles:
- Detecting first visit from UserContext
- Opening modal automatically
- Saving selection
- Completing onboarding
- Closing modal

## Integration with i18n

### Flow

```
UserContext (cookie)
  ↓
i18nProvider (reads from UserContext)
  ↓
useTranslation() hook
  ↓
Components
```

### Before (Old System)

```typescript
// localStorage-based, no onboarding
const { t } = useTranslation();
```

### After (New System)

```typescript
// Cookie-based, with UserContext
const { t } = useTranslation(); // Same API!
const { user } = useUser();     // But now also has user state
```

**Same translation API, better storage!**

## File Structure

```
lib/
├── context/
│   ├── UserContext.tsx        # User state management
│   └── index.ts
├── utils/
│   ├── cookies.ts             # Cookie utilities
│   ├── language-detection.ts  # Browser language detection
│   └── index.ts
└── i18n/
    └── I18nContext.tsx        # Updated to use UserContext

components/organisms/
├── CountrySelectionModal/     # First-visit modal
└── OnboardingHandler/         # Modal trigger logic
```

## Benefits Over Previous System

### Old System (localStorage)
- ❌ localStorage less reliable (can be cleared)
- ❌ No expiration control
- ❌ No first-visit detection
- ❌ User had to find selector manually
- ❌ No browser detection

### New System (Cookies + Context)
- ✅ Cookies persist for 1 year
- ✅ More reliable storage
- ✅ Automatic first-visit detection
- ✅ Guided onboarding experience
- ✅ Browser language detection
- ✅ Centralized user state management
- ✅ Extensible for future features

## Best Practices

### 1. Always Use UserContext for User State

```typescript
// ✅ Good - Use UserContext
const { user, setCountry } = useUser();

// ❌ Bad - Don't access cookies directly
const country = getCookie(COOKIE_NAMES.COUNTRY);
```

### 2. Use i18n Hook for Translations

```typescript
// ✅ Good - Use translation hook
const { t } = useTranslation();

// ⚠️ Avoid - Direct context access usually not needed
const { country } = useI18n();
```

### 3. Let OnboardingHandler Manage Modal

```typescript
// ✅ Good - Automatic
<OnboardingHandler />

// ❌ Bad - Don't manually manage
const [showModal, setShowModal] = useState(true);
```

## Testing the Flow

### Test First Visit

1. **Clear Cookies**: Open DevTools → Application → Cookies → Delete all
2. **Refresh Page**: Modal should appear
3. **Check Detection**: Your language should be pre-selected
4. **Select Country**: Choose and confirm
5. **Verify Cookie**: Check DevTools → Cookies → `eduforge_country`
6. **Refresh Again**: No modal, language persists

### Test Cookie Expiration

```javascript
// In DevTools Console:
document.cookie = 'eduforge_country=HU; max-age=5'; // 5 seconds
// Wait 5 seconds, refresh
// Cookie expired, modal shows again
```

### Test Detection

```javascript
// In DevTools Console (before page load):
Object.defineProperty(navigator, 'language', {
  get: () => 'hu-HU' // Force Hungarian
});
// Refresh page, modal should suggest Hungarian
```

## Adding to UserContext

Want to add theme preference?

```typescript
// 1. Update interface
interface UserState {
  country: CountryCode;
  theme: 'light' | 'dark';  // Add this
  // ...
}

// 2. Add to UserContext
const [user, setUser] = useState<UserState>({
  country: DEFAULT_COUNTRY,
  theme: 'light',           // Add this
  // ...
});

// 3. Add setter
const setTheme = useCallback((theme: 'light' | 'dark') => {
  setUser((prev) => ({ ...prev, theme }));
  setCookie('eduforge_theme', theme);
}, []);

// 4. Load from cookie
useEffect(() => {
  const savedTheme = getCookie('eduforge_theme');
  if (savedTheme) {
    setUser(prev => ({ ...prev, theme: savedTheme }));
  }
}, []);
```

## Future IP-Based Detection

Currently: Browser language detection
Future: Add IP-based country detection

```typescript
// Potential implementation
async function detectCountryFromIP(): Promise<CountryCode> {
  try {
    const response = await fetch('/api/geolocate');
    const data = await response.json();
    return data.country; // 'HU' or 'US'
  } catch {
    return detectBrowserCountry(); // Fallback
  }
}
```

Could use:
- Cloudflare headers (`CF-IPCountry`)
- MaxMind GeoIP database
- ipapi.co or similar service
- Vercel Edge Functions with geo data

## Summary

### What Changed

1. **Storage**: localStorage → Cookies (365 days)
2. **State**: Isolated → UserContext (centralized)
3. **Detection**: None → Browser language detection
4. **Onboarding**: Manual → Automatic first-visit modal
5. **Suggestion**: Random → Intelligent (based on browser)

### Developer Experience

**Same simple API:**
```typescript
const { t } = useTranslation();
const text = t('Home');
```

**But now with:**
- Persistent cookies (1 year)
- Automatic onboarding
- Smart detection
- Extensible user state

### User Experience

- ✅ Welcome modal on first visit
- ✅ Smart language detection
- ✅ Clear recommendation
- ✅ One-time setup
- ✅ Preference persists forever (1 year)
- ✅ Can change anytime from header

---

**Status**: ✅ Production Ready
**Storage**: Cookies (365 days)
**Detection**: Browser language
**Onboarding**: Automatic modal
**Context**: UserContext (extensible)
