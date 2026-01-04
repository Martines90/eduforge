# Enhanced Onboarding Flow - Implementation Summary

## Overview

This document describes the enhanced multi-step onboarding flow for first-time visitors to EduForger. The new system guides users through country selection, role identification, and (for teachers) subject expertise and action selection.

## User Flow

### For All Users
1. **Country Selection** - User picks their country/language
2. **Role Selection** - User identifies as "Teacher" or "Non-teacher" (student/parent/etc)

### For Non-Teachers
3. **Complete** - Onboarding completes, user stays on home page

### For Teachers
3. **Subject Selection** - Teacher selects their subject with the most experience
4. **Action Selection** - Teacher chooses to either:
   - Create a new [subject] task → Navigate to `/task_creator`
   - Search for existing [subject] tasks → Navigate to `/search_tasks`
5. **Complete** - Onboarding completes, user is navigated to selected page

## User State Model

### UserState Interface
```typescript
interface UserState {
  country: CountryCode;              // 'US' | 'HU'
  isFirstVisit: boolean;             // true on first visit
  hasCompletedOnboarding: boolean;   // false until flow complete
  identity: UserIdentity | null;     // 'teacher' | 'non-teacher' | null
  role: UserRole;                    // 'guest' | 'registered' | 'admin'
  subject: Subject | null;           // Selected subject or null
}
```

### New Types Added
```typescript
// User identity
export type UserIdentity = 'teacher' | 'non-teacher';

// User role (for future authentication)
export type UserRole = 'guest' | 'registered' | 'admin';

// Available subjects
export type Subject =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'geography'
  | 'literature'
  | 'english'
  | 'computer-science'
  | 'arts'
  | 'music'
  | 'physical-education';
```

## Cookie Storage

All user state is persisted in cookies with 1-year expiration:

```typescript
COOKIE_NAMES = {
  COUNTRY: 'eduforger_country',     // Country code
  FIRST_VISIT: 'eduforger_first_visit',
  IDENTITY: 'eduforger_identity',   // 'teacher' | 'non-teacher'
  ROLE: 'eduforger_role',           // 'guest' | 'registered' | 'admin'
  SUBJECT: 'eduforger_subject',     // Selected subject
}
```

## Components Created

### 1. RoleSelectionModal
**Location:** `components/organisms/RoleSelectionModal/`

**Purpose:** Asks user if they are a teacher or non-teacher

**Features:**
- Two card-based options with icons
- Teacher icon (SchoolIcon)
- Non-teacher icon (PeopleIcon)
- Visual selection feedback with checkmark
- Gradient header design matching existing modals

**Props:**
```typescript
interface RoleSelectionModalProps {
  open: boolean;
  onSelect: (identity: UserIdentity) => void;
}
```

### 2. SubjectSelectionModal
**Location:** `components/organisms/SubjectSelectionModal/`

**Purpose:** For teachers to select their subject expertise

**Features:**
- Dropdown/select with all 12 subjects
- Each subject has an emoji icon
- Help text: "Don't worry, you can create tasks for any subject later"
- Matches existing modal design

**Props:**
```typescript
interface SubjectSelectionModalProps {
  open: boolean;
  onSelect: (subject: Subject) => void;
}
```

**Available Subjects:**
- Mathematics 🔢
- Physics ⚛️
- Chemistry 🧪
- Biology 🧬
- History 📜
- Geography 🌍
- Literature 📚
- English 🔤
- Computer Science 💻
- Arts 🎨
- Music 🎵
- Physical Education ⚽

### 3. ActionSelectionModal
**Location:** `components/organisms/ActionSelectionModal/`

**Purpose:** Asks teacher if they want to create or search tasks

**Features:**
- Dynamic title showing selected subject
- Two card options: Create (AddCircleOutlineIcon) or Search (SearchIcon)
- Shows subject name in action descriptions

**Props:**
```typescript
interface ActionSelectionModalProps {
  open: boolean;
  subject: Subject;
  onSelect: (action: 'create' | 'search') => void;
}
```

### 4. Updated OnboardingHandler
**Location:** `components/organisms/OnboardingHandler/`

**Purpose:** Orchestrates the multi-step onboarding flow

**State Machine:**
```typescript
type OnboardingStep = 'country' | 'role' | 'subject' | 'action' | 'complete';
```

**Logic:**
1. Starts at 'country' step for first-time visitors
2. After country: goes to 'role'
3. After role:
   - Teacher → 'subject'
   - Non-teacher → 'complete' (stays on home)
4. After subject: goes to 'action'
5. After action:
   - Create → navigate to `/task_creator`
   - Search → navigate to `/search_tasks`
   - Sets 'complete' state

**Features:**
- Single component manages entire flow
- Uses Next.js router for navigation
- Saves state to cookies at each step
- Conditional rendering of modals based on step

## Pages Created

### /search_tasks
**Location:** `app/search_tasks/page.tsx`

**Purpose:** Placeholder page for searching existing tasks

**Features:**
- Coming Soon message
- Shows selected subject in title
- Search icon
- Informational text about future functionality
- Matches existing page styling

## Enhanced UserContext

### New Methods
```typescript
interface UserContextType {
  user: UserState;
  setCountry: (country: CountryCode) => void;
  setIdentity: (identity: UserIdentity) => void;  // NEW
  setSubject: (subject: Subject) => void;          // NEW
  completeOnboarding: () => void;
  resetUser: () => void;
}
```

### Cookie Integration
- `setIdentity()` - saves to `eduforger_identity` cookie
- `setSubject()` - saves to `eduforger_subject` cookie
- All values loaded from cookies on app initialization
- Returning users automatically restore their preferences

## Files Modified

### Core Files
1. **types/i18n.ts** - Added UserIdentity, UserRole, Subject types
2. **lib/utils/cookies.ts** - Added IDENTITY, ROLE, SUBJECT cookie names
3. **lib/context/UserContext.tsx** - Enhanced with new state fields and methods

### New Components
4. **components/organisms/RoleSelectionModal/** (3 files)
   - RoleSelectionModal.tsx
   - RoleSelectionModal.module.scss
   - index.ts

5. **components/organisms/SubjectSelectionModal/** (3 files)
   - SubjectSelectionModal.tsx
   - SubjectSelectionModal.module.scss
   - index.ts

6. **components/organisms/ActionSelectionModal/** (3 files)
   - ActionSelectionModal.tsx
   - ActionSelectionModal.module.scss
   - index.ts

7. **components/organisms/OnboardingHandler/** (modified)
   - OnboardingHandler.tsx - Complete rewrite for multi-step flow

### New Pages
8. **app/search_tasks/page.tsx** - Placeholder for task search

## Testing the Flow

### First-Time User Testing

1. **Clear all cookies:**
   ```javascript
   // In DevTools Console
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Refresh page** - Should see Country Selection modal

3. **Select a country** - Should proceed to Role Selection

4. **Test Non-Teacher Path:**
   - Select "Student / Parent / Other"
   - Should complete onboarding
   - Should stay on home page
   - Check cookies - should have country, identity='non-teacher', role='guest'

5. **Clear cookies and test Teacher Path:**
   - Select country
   - Select "Teacher"
   - Should see Subject Selection
   - Pick a subject (e.g., "Mathematics")
   - Should see Action Selection with "Mathematics" in titles
   - Choose "Create" → redirects to /task_creator
   - OR choose "Search" → redirects to /search_tasks

6. **Verify persistence:**
   - Refresh page - no modals should appear
   - Check DevTools → Application → Cookies
   - Should see: eduforger_country, eduforger_identity, eduforger_subject

### Cookie Inspection
```javascript
// View all EduForger cookies
document.cookie.split(';').filter(c => c.includes('eduforge'))
```

## Design Consistency

All new modals follow the existing design pattern:

**Shared Styles:**
- Gradient header (purple: #667eea → #764ba2)
- White content area
- Card-based selection with hover effects
- Selected state with border highlight
- Checkmark icon on selection
- Full-width "Continue" button
- Consistent padding and spacing

**Visual Hierarchy:**
- Large title in header
- Subtitle for context
- Clear action buttons
- Icon-based visual feedback

## Future Enhancements

### Potential Additions

1. **Back Button**
   - Allow users to go back to previous step
   - Update state machine to support backward navigation

2. **Progress Indicator**
   - Show "Step 2 of 4" or progress bar
   - Help users understand how far they are

3. **Skip Options**
   - Allow non-teachers to skip directly to home
   - "I'll do this later" option

4. **Multi-Subject Selection**
   - Allow teachers to select multiple subjects
   - Store as array in user state

5. **Profile Page**
   - Let users change their preferences later
   - Edit identity, subject, etc.

6. **Anonymous Analytics**
   - Track which subjects are most popular
   - Teacher vs non-teacher ratio

7. **Welcome Tour**
   - After onboarding, show a brief feature tour
   - Highlight key functionality

8. **Internationalization**
   - Add translation keys for modal content
   - Support Hungarian translations

## Technical Notes

### State Management
- OnboardingHandler maintains local state for current step
- UserContext maintains global user state
- Cookies provide persistence across sessions

### Navigation
- Uses Next.js `useRouter()` for client-side navigation
- No page refresh when transitioning
- Smooth user experience

### Modal Management
- Only one modal shown at a time
- Modals are non-dismissible (no escape key, no backdrop click)
- User must complete the flow

### TypeScript Safety
- All new types properly defined
- Props interfaces exported
- Full type checking on user state

## Architecture Benefits

1. **Modular Design** - Each modal is independent and reusable
2. **Single Responsibility** - OnboardingHandler only orchestrates, doesn't render modals
3. **Extensible** - Easy to add new steps or modify flow
4. **Type-Safe** - TypeScript ensures correct data flow
5. **Persistent** - Cookies ensure returning users don't see modals again
6. **Conditional Logic** - Different flows for teachers vs non-teachers
7. **Separation of Concerns** - UI (modals) separated from state (context) and persistence (cookies)

## Summary

The enhanced onboarding flow successfully:
- ✅ Guides users through country selection
- ✅ Identifies user role (teacher/non-teacher)
- ✅ Collects subject expertise from teachers
- ✅ Directs teachers to create or search tasks
- ✅ Stores all preferences in persistent cookies
- ✅ Navigates users to appropriate pages
- ✅ Maintains design consistency
- ✅ Follows best practices for TypeScript and React
- ✅ Builds successfully without errors

**Status:** ✅ Complete and Production Ready

**Role for Non-Teachers:** Set to `'guest'` by default
**Identity Storage:** Saved in `eduforger_identity` cookie
**Subject Storage:** Saved in `eduforger_subject` cookie (teachers only)
**Navigation:** Automatic based on user selections
