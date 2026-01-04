# Registration-Based Onboarding Flow

## Overview

The onboarding flow has been enhanced to require user registration **before** role selection. This ensures all users create an account before accessing the platform's features.

## Updated User Flow

### Complete Flow for All Users

1. **Country Selection** - Pick country/language (US/HU)
2. **Registration** - Create account with name and email
3. **Role Selection** - Choose "Teacher" or "Non-teacher" (student/parent/etc)

### Additional Steps for Teachers

4. **Subject Selection** - Pick subject with most experience (12 options)
5. **Action Selection** - Choose to:
   - **Create** new [subject] task → navigates to `/task_creator`
   - **Search** existing [subject] tasks → navigates to `/search_tasks`

### Non-Teachers Complete Flow

After role selection, non-teachers complete onboarding and stay on home page.

## Flow Diagram

```
First Visit
    ↓
Country Selection (Step 1)
    ↓
Registration (Step 2) ← NEW STEP
    ↓
Role Selection (Step 3)
    ↓
┌───────────────┴───────────────┐
│                               │
Non-Teacher                  Teacher
    ↓                            ↓
Complete                    Subject Selection (Step 4)
(Home Page)                      ↓
                            Action Selection (Step 5)
                                 ↓
                         ┌───────┴────────┐
                         │                │
                      Create           Search
                    /task_creator   /search_tasks
```

## What Changed

### Previous Flow
```
Country → Role → [Teacher: Subject → Action] → Complete
```

### New Flow
```
Country → Registration → Role → [Teacher: Subject → Action] → Complete
```

## New Registration Modal

### Location
`components/organisms/RegistrationModal/`

### Features
- **Form Fields:**
  - Full Name (required, min 2 characters)
  - Email Address (required, validated format)
- **Validation:**
  - Client-side validation
  - Real-time error messages
  - Email format validation
  - Required field checks
- **Design:**
  - Gradient header matching other modals
  - PersonAddIcon
  - Clear error states
  - Enter key to submit
  - Info alert about simplified registration

### Component Interface

```typescript
interface RegistrationModalProps {
  open: boolean;
  onRegister: (profile: UserProfile) => void;
}

interface UserProfile {
  email: string;
  name: string;
  registeredAt: string;  // ISO timestamp
}
```

### Validation Rules

**Name:**
- Required
- Minimum 2 characters
- Trimmed of whitespace

**Email:**
- Required
- Valid email format (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Converted to lowercase
- Trimmed of whitespace

## Enhanced User State

### Updated UserState Interface

```typescript
interface UserState {
  country: CountryCode;
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;

  // NEW: Registration fields
  isRegistered: boolean;
  profile: UserProfile | null;

  identity: UserIdentity | null;
  role: UserRole;  // 'guest' before registration, 'registered' after
  subject: Subject | null;
}
```

### Key Changes

1. **isRegistered** - Boolean flag indicating if user has completed registration
2. **profile** - Contains user's name, email, and registration timestamp
3. **role** - Automatically set to:
   - `'guest'` - Before registration
   - `'registered'` - After successful registration
   - `'admin'` - Reserved for future use

## Cookie Storage

### New Cookies

```typescript
COOKIE_NAMES = {
  COUNTRY: 'eduforge_country',
  FIRST_VISIT: 'eduforge_first_visit',
  IDENTITY: 'eduforge_identity',
  ROLE: 'eduforge_role',
  SUBJECT: 'eduforge_subject',

  // NEW
  IS_REGISTERED: 'eduforge_is_registered',    // 'true' | undefined
  USER_PROFILE: 'eduforge_user_profile',      // JSON string
}
```

### Cookie Data Examples

**Before Registration:**
```javascript
{
  eduforge_country: 'US',
  eduforge_role: 'guest'
}
```

**After Registration:**
```javascript
{
  eduforge_country: 'US',
  eduforge_is_registered: 'true',
  eduforge_user_profile: '{"name":"John Doe","email":"john@example.com","registeredAt":"2025-11-25T10:30:00.000Z"}',
  eduforge_role: 'registered',
  eduforge_identity: 'teacher',
  eduforge_subject: 'mathematics'
}
```

## UserContext Updates

### New Method: registerUser()

```typescript
const registerUser = useCallback((profile: UserProfile) => {
  setUser((prev) => ({
    ...prev,
    isRegistered: true,
    profile,
    role: 'registered',
  }));
  setCookie(COOKIE_NAMES.IS_REGISTERED, 'true');
  setCookie(COOKIE_NAMES.USER_PROFILE, JSON.stringify(profile));
  setCookie(COOKIE_NAMES.ROLE, 'registered');
}, []);
```

### Usage Example

```typescript
const { user, registerUser } = useUser();

// In registration handler
const handleRegistration = (profile: UserProfile) => {
  registerUser(profile);
  // User is now registered with role='registered'
  // Profile is stored in cookies
};
```

## OnboardingHandler State Machine

### Updated Steps

```typescript
type OnboardingStep =
  | 'country'       // Step 1
  | 'registration'  // Step 2 (NEW)
  | 'role'          // Step 3
  | 'subject'       // Step 4 (teachers only)
  | 'action'        // Step 5 (teachers only)
  | 'complete';     // Step 6
```

### Step Transitions

```typescript
// Step 1: Country → Registration
const handleCountrySelect = (country: CountryCode) => {
  setCountry(country);
  setStep('registration');  // ← Changed from 'role'
};

// Step 2: Registration → Role
const handleRegistration = (profile: UserProfile) => {
  registerUser(profile);
  setStep('role');  // ← New handler
};

// Step 3: Role → Subject or Complete
const handleRoleSelect = (identity: UserIdentity) => {
  setIdentity(identity);
  if (identity === 'teacher') {
    setStep('subject');
  } else {
    completeOnboarding();
    setStep('complete');
  }
};

// ... rest of handlers unchanged
```

## Benefits of Registration First

### 1. User Accountability
- All users must provide contact information
- Creates a sense of commitment
- Enables future features (email notifications, password reset, etc.)

### 2. Data Collection
- Know who is using the platform
- Can reach out to users
- Analytics on user demographics

### 3. Role-Based Access
- Role is tied to registered user
- Clear distinction between guest and registered users
- Foundation for future authentication

### 4. Future Features Enabled
- Email notifications
- Task saving/favorites
- User dashboard
- Profile management
- Social features

## Files Modified

### 1. Types (types/i18n.ts)
- Added `UserProfile` interface

### 2. Cookies (lib/utils/cookies.ts)
- Added `IS_REGISTERED` and `USER_PROFILE` cookie names

### 3. UserContext (lib/context/UserContext.tsx)
- Added `isRegistered` and `profile` to state
- Added `registerUser()` method
- Updated cookie loading logic
- Role automatically set based on registration status

### 4. OnboardingHandler (components/organisms/OnboardingHandler/)
- Added `'registration'` step
- Added `handleRegistration` handler
- Added `<RegistrationModal>` component
- Updated step flow: country → registration → role

### 5. New Component (components/organisms/RegistrationModal/)
- **RegistrationModal.tsx** - Main component
- **RegistrationModal.module.scss** - Styles
- **index.ts** - Exports

## Testing the Registration Flow

### Test Scenario 1: New User Complete Flow

1. **Clear all cookies**
   ```javascript
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Refresh page** → Should see Country Selection

3. **Select a country** (e.g., US) → Should see Registration Modal

4. **Test Validation:**
   - Try submitting empty form → Should show errors
   - Enter name less than 2 chars → Should show error
   - Enter invalid email → Should show error
   - Click "Create Account" when disabled → Nothing happens

5. **Complete Registration:**
   - Enter valid name: "John Doe"
   - Enter valid email: "john@example.com"
   - Click "Create Account" or press Enter

6. **Should proceed to Role Selection**

7. **Select "Teacher"** → Should see Subject Selection

8. **Select a subject** (e.g., "Mathematics") → Should see Action Selection

9. **Select "Create"** → Should navigate to `/task_creator`

10. **Check Cookies:**
    ```javascript
    document.cookie.split(';').forEach(c => console.log(c.trim()));
    ```
    Should see:
    - `eduforge_country=US`
    - `eduforge_is_registered=true`
    - `eduforge_user_profile={"name":"John Doe",...}`
    - `eduforge_role=registered`
    - `eduforge_identity=teacher`
    - `eduforge_subject=mathematics`

### Test Scenario 2: Non-Teacher Flow

1. Clear cookies and start over
2. Select country
3. Register with different credentials
4. Select "Student / Parent / Other"
5. Should complete onboarding and stay on home
6. Check cookies: should have profile but no subject

### Test Scenario 3: Returning User

1. **Don't clear cookies**
2. Refresh page
3. **No modals should appear**
4. Check UserContext state:
   ```javascript
   // In React DevTools or console
   user.isRegistered // true
   user.profile // { name, email, registeredAt }
   user.role // 'registered'
   user.identity // 'teacher' or 'non-teacher'
   ```

### Test Scenario 4: Email Validation

In registration modal, test:
- `test` → Invalid
- `test@` → Invalid
- `test@domain` → Invalid
- `test @domain.com` → Invalid (space)
- `test@domain.com` → Valid ✓
- `Test@Domain.COM` → Valid (converted to lowercase) ✓

## Integration Notes

### Current Implementation
- **Simplified** registration (no password)
- **Client-side only** validation
- **Cookie-based** storage
- **No backend** verification

### Future Production Requirements

When integrating with a real authentication system:

1. **Backend Integration**
   ```typescript
   const handleRegistration = async (profile: UserProfile) => {
     try {
       // Send to backend API
       const response = await fetch('/api/auth/register', {
         method: 'POST',
         body: JSON.stringify(profile),
       });

       const data = await response.json();

       if (data.success) {
         registerUser(data.user);
         setStep('role');
       }
     } catch (error) {
       // Handle errors
     }
   };
   ```

2. **Add Password Field**
   ```typescript
   interface RegistrationData extends UserProfile {
     password: string;
     confirmPassword: string;
   }
   ```

3. **Email Verification**
   - Send verification email
   - Require email confirmation before proceeding
   - Add verification status to UserProfile

4. **Security Enhancements**
   - HTTPS only
   - CSRF protection
   - Rate limiting
   - Duplicate email checking
   - Strong password requirements

5. **JWT or Session Management**
   - Replace cookies with secure tokens
   - Server-side session management
   - Refresh token mechanism

## Security Considerations

### Current Simplified Approach
⚠️ **This is a demo implementation. Not suitable for production without backend.**

**Current Limitations:**
- No password protection
- No email verification
- No duplicate email checking
- Client-side only validation
- Cookies can be manually edited

### Recommended Production Setup

1. **Backend Required:**
   - Express/NestJS/Next.js API routes
   - Database (PostgreSQL, MongoDB)
   - Email service (SendGrid, AWS SES)

2. **Authentication Library:**
   - NextAuth.js (recommended for Next.js)
   - Passport.js
   - Auth0
   - Firebase Auth

3. **Security Measures:**
   - Password hashing (bcrypt)
   - JWT with HttpOnly cookies
   - CSRF tokens
   - Rate limiting
   - Email verification
   - Two-factor authentication (optional)

## UI/UX Design

### Registration Modal Design

**Header:**
- Purple gradient background (#667eea → #764ba2)
- PersonAddIcon (48px)
- "Create Your Account" title
- Subtitle: "Join EduForger to create and manage educational tasks"

**Content:**
- Info alert explaining simplified registration
- Two text fields:
  - Full Name
  - Email Address
- Real-time validation feedback
- Helper text below fields

**Footer:**
- "Create Account" button
- Disabled when fields empty
- Full width
- Gradient background

**Interactions:**
- Enter key submits form
- No escape key (modal required)
- Focus on name field on open
- Tab navigation between fields

## Accessibility

### Features Implemented

- ✅ Semantic HTML
- ✅ ARIA labels on form fields
- ✅ Error messages associated with inputs
- ✅ Keyboard navigation (Tab, Enter)
- ✅ Focus management
- ✅ Clear error states
- ✅ Descriptive button text

### Keyboard Navigation

- **Tab** - Move between fields
- **Enter** - Submit form
- **Escape** - Disabled (required modal)

## Summary

### What Was Added

1. **RegistrationModal Component**
   - Name and email collection
   - Client-side validation
   - Error handling
   - Gradient design matching other modals

2. **UserProfile Type**
   - Name, email, registeredAt fields

3. **Registration State**
   - isRegistered flag
   - profile object
   - Automatic role update to 'registered'

4. **New Cookies**
   - eduforge_is_registered
   - eduforge_user_profile

5. **Updated Flow**
   - Registration step between country and role
   - All users must register before proceeding

### Benefits

- ✅ User accountability
- ✅ Contact information collected
- ✅ Foundation for future auth
- ✅ Role-based access control
- ✅ Analytics and user tracking
- ✅ Consistent with production apps

### Build Status

✅ **Compiles Successfully**
✅ **No TypeScript Errors**
✅ **No ESLint Warnings**
✅ **Production Ready** (with noted limitations)

---

**Next Steps for Production:**
1. Integrate backend authentication
2. Add password field with hashing
3. Implement email verification
4. Add duplicate email checking
5. Set up secure session management
6. Implement proper error handling
7. Add rate limiting
8. Security audit
