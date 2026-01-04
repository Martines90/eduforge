# Internationalization (i18n) Feature Documentation

## Overview

A complete internationalization system has been implemented with country/language selection. The system supports multiple countries with their respective languages and persists user preferences.

## Supported Countries & Languages

| Country | Code | Flag | Language | Default |
|---------|------|------|----------|---------|
| Hungary | HU   | 🇭🇺   | Magyar   | ✅ Yes  |
| United States | US   | 🇺🇸   | English  | No      |

**Default Language: Hungarian (HU)**

## Architecture

### File Structure

```
lib/
└── i18n/
    ├── I18nContext.tsx           # Context provider and hooks
    ├── index.ts                  # Public API exports
    ├── countries.ts              # Country configuration
    └── translations/
        ├── index.ts              # Translation exports
        ├── en.ts                 # English translations
        └── hu.ts                 # Hungarian translations

types/
└── i18n.ts                       # TypeScript interfaces

components/
└── molecules/
    └── CountrySelector/          # Country selection dropdown
```

### Type System

```typescript
// Country codes
type CountryCode = 'US' | 'HU';

// Translation keys (type-safe)
type TranslationKey = keyof Translations;

// Country definition
interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  language: string;
}
```

## Usage

### In Components

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('Home')}</h1>
      <p>{t('Task Creator')}</p>
    </div>
  );
}
```

### Accessing Country

```typescript
import { useI18n } from '@/lib/i18n';

function MyComponent() {
  const { country, setCountry, t } = useI18n();

  return (
    <div>
      <p>Current: {country}</p>
      <button onClick={() => setCountry('US')}>
        Switch to English
      </button>
    </div>
  );
}
```

## Features

### 1. Country Selector Component

Located in the header, allows users to switch between languages:
- Displays country flag and code (e.g., 🇭🇺 HU)
- Dropdown shows country name and language
- Visual feedback for current selection
- Accessible with keyboard navigation

### 2. Persistent Storage

User language preference is saved to `localStorage`:
- Key: `eduforge_country`
- Automatically loads on page refresh
- SSR-compatible (no hydration issues)

### 3. Type-Safe Translations

All translation keys are type-checked:
```typescript
t('Home')           // ✅ Valid
t('Invalid Key')    // ❌ TypeScript error
```

### 4. Dynamic Content

Only static text is translated. Dynamic content from the `navigation_mapping.json` (topic names) remains in original form.

## Translation Keys

### Navigation
- `Home`
- `Task Creator`
- `Open navigation menu`
- `Close menu`

### Home Page
- `Create educational tasks based on curriculum topics for grades 9-12`
- `Go to Task Creator`

### Task Creator Page
- `Select a curriculum topic to create an educational task`
- `Select Topic`
- `Grade 9-10`
- `Grade 11-12`
- `Reset`
- `Selection complete`
- `Please select a topic to begin`
- `Confirm Selection`
- `Topic`
- `Path`
- `Grade Level`
- `Selected Topic`
- `Create Task`
- `Clear Selection`

### Select Component
- `Select an option`
- `Select main topic`
- `Select sub-topic`
- `Level`

### General
- `Close`
- `Open`
- `Menu`
- `Language`
- `Country`

## Adding New Translations

### 1. Add Translation Key to Type

```typescript
// types/i18n.ts
export interface Translations {
  // ... existing keys
  'My New Key': string;
}
```

### 2. Add Translations

```typescript
// lib/i18n/translations/en.ts
export const en: Translations = {
  // ... existing translations
  'My New Key': 'My English Text',
};

// lib/i18n/translations/hu.ts
export const hu: Translations = {
  // ... existing translations
  'My New Key': 'Magyar Szöveg',
};
```

### 3. Use in Component

```typescript
const { t } = useTranslation();
<p>{t('My New Key')}</p>
```

## Adding New Languages/Countries

### 1. Update CountryCode Type

```typescript
// types/i18n.ts
export type CountryCode = 'US' | 'HU' | 'DE'; // Added DE
```

### 2. Create Translation File

```typescript
// lib/i18n/translations/de.ts
import { Translations } from '@/types/i18n';

export const de: Translations = {
  'Home': 'Startseite',
  'Task Creator': 'Aufgaben-Ersteller',
  // ... all other keys
};
```

### 3. Register Translation

```typescript
// lib/i18n/translations/index.ts
import { de } from './de';

export const translations: Record<CountryCode, Translations> = {
  US: en,
  HU: hu,
  DE: de, // Added
};
```

### 4. Add Country Configuration

```typescript
// lib/i18n/countries.ts
export const countries: Country[] = [
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', language: 'Magyar' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'English' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', language: 'Deutsch' }, // Added
];
```

## Implementation Details

### SSR Compatibility

The i18n system is compatible with Next.js SSR:
- Hydration-safe rendering
- No client-only code in critical path
- `localStorage` only accessed client-side
- Default language used during SSR

### Context Provider

The `I18nProvider` wraps the entire application in `app/layout.tsx`:

```typescript
<I18nProvider>
  <Header />
  <main>{children}</main>
</I18nProvider>
```

### Translation Strategy

**Translated:**
- All UI labels
- Navigation items
- Button text
- Form labels
- Status messages
- Help text

**NOT Translated:**
- Topic names from JSON data
- User-generated content
- Dynamic data from backend
- Brand name ("EduForger")

## Best Practices

### 1. Use English as Base

English keys serve as fallback and default:
```typescript
'Home': 'Home',  // Key matches English value
```

### 2. Keep Keys Descriptive

Use full phrases as keys:
```typescript
✅ 'Create educational tasks...'
❌ 'page.home.subtitle'
```

### 3. Avoid Concatenation

Don't split sentences:
```typescript
✅ t('Welcome to EduForger')
❌ t('Welcome to') + ' EduForger'
```

### 4. Handle Plurals

Use separate keys for singular/plural:
```typescript
'1 task selected'
'%d tasks selected'
```

### 5. Context Matters

Include context in key when same word has different meanings:
```typescript
'Close' (verb - close window)
'Close' (adjective - close to you)
```

## Testing

The translation system is automatically tested through component tests. To manually test:

1. **Change Language**
   - Click country selector in header
   - Select different country
   - Verify all UI updates

2. **Persistence**
   - Change language
   - Refresh page
   - Verify language persists

3. **SSR**
   - Build production: `npm run build`
   - Check for hydration errors
   - Verify default language renders

## Performance

- **Bundle Size**: Minimal impact (~5KB for all translations)
- **Runtime**: O(1) lookup via object access
- **Re-renders**: Only affected components re-render on language change
- **Loading**: Translations loaded synchronously (no flash of untranslated content)

## Future Enhancements

- [ ] Add more languages (German, French, Spanish, etc.)
- [ ] Translate topic names from JSON
- [ ] Date/time localization
- [ ] Number formatting
- [ ] Currency formatting
- [ ] RTL language support
- [ ] Translation management system
- [ ] Automatic language detection from browser
- [ ] Translation strings extraction tool
- [ ] Translation progress tracking
