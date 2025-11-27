# Route Protection & Redirection Guide

This guide explains how authentication, authorization, and 404 handling work in the EduForge frontend application.

## Overview

The application has three levels of page protection:

1. **Public pages** - Accessible to everyone (e.g., home page)
2. **Authenticated pages** - Require user to be logged in (e.g., search tasks)
3. **Role-protected pages** - Require specific user identity (e.g., task creator requires teacher)

And two special pages:
- **404 Not Found** (`/not-found`) - For non-existent routes
- **403 Unauthorized** (`/unauthorized`) - For access denied (logged in but wrong role)

## Components & Hooks

### `useRouteProtection` Hook

Location: `/lib/hooks/useRouteProtection.ts`

A React hook that protects routes based on authentication and authorization requirements.

**Usage:**

```typescript
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';

function ProtectedPage() {
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,           // Requires user to be logged in
    requireIdentity: 'teacher',  // Requires specific identity (optional)
    redirectTo: '/custom-path'   // Custom redirect path (optional)
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  return <div>Protected content</div>;
}
```

**Options:**

- `requireAuth?: boolean` - Whether the route requires authentication (default: false)
- `requireIdentity?: 'teacher' | 'non-teacher'` - Required user identity (optional)
- `redirectTo?: string` - Custom redirect path
  - Defaults to `/` for missing authentication
  - Defaults to `/unauthorized` for wrong role/identity

**Return values:**

- `isAuthorized: boolean` - Whether the user meets all requirements
- `isLoading: boolean` - Whether authentication state is still being loaded
- `user: UserState` - Current user state from context

### `LoadingSpinner` Component

Location: `/components/atoms/LoadingSpinner/LoadingSpinner.tsx`

A loading spinner with optional message.

**Props:**
- `message?: string` - Optional loading message
- `fullScreen?: boolean` - Whether to display full screen (default: false)

### `not-found.tsx` - 404 Page

Location: `/app/not-found.tsx`

Next.js automatically shows this page when:
- A user navigates to a non-existent route
- A page/component calls `notFound()` function

The 404 page provides:
- Clear error message (404 - Page Not Found)
- Quick navigation to home page
- Link to task creator

### `unauthorized/page.tsx` - 403 Unauthorized Page

Location: `/app/unauthorized/page.tsx`

Shown when a logged-in user tries to access a route they don't have permission for.

Common scenarios:
- Non-teacher trying to access `/task_creator`
- User with wrong role trying to access role-specific features

The 403 page provides:
- Clear error message (403 - Access Denied)
- Explanation of why access was denied
- "Go Back" button to return to previous page
- Link to home page

## Protected Page Examples

### Example 1: Require Authentication Only

Users must be logged in to access the page. Non-logged-in users are redirected to home.

```typescript
'use client';

import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';

export default function SearchTasksPage() {
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  return <div>Search Tasks Content</div>;
}
```

**Use case:** Search tasks, view profile, settings, etc.

### Example 2: Require Teacher Identity

Users must be logged in AND have selected "teacher" identity during onboarding.

```typescript
'use client';

import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';

export default function TaskCreatorPage() {
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  return <div>Task Creator Content</div>;
}
```

**Use case:** Task creator, teacher dashboard, teacher analytics, etc.

### Example 3: Custom Redirect Path

Redirect unauthorized users to a specific page instead of home.

```typescript
'use client';

import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';

export default function AdminPage() {
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    redirectTo: '/unauthorized', // Custom redirect
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  return <div>Admin Content</div>;
}
```

## How It Works

### Authentication Flow

1. **User visits protected page**
   - Hook checks `user.isRegistered` from `UserContext`
   - If not registered and `requireAuth: true`, redirects to home

2. **User Context initialization**
   - On mount, `UserContext` loads user state from cookies
   - Sets `isFirstVisit` based on whether cookies exist
   - During onboarding, `isFirstVisit` is true until completed

3. **Authorization check**
   - Hook validates `user.identity` against `requireIdentity`
   - If identity doesn't match, redirects to `/unauthorized` (or custom path)

### Identity Selection

Users select their identity during the onboarding flow:
- **Teacher** - Can create and manage tasks (task_creator access)
- **Non-teacher** - Can search and complete tasks (no task_creator access)

The identity is stored in:
- `UserContext` state (`user.identity`)
- Cookie (`COOKIE_NAMES.IDENTITY`)

### Loading States

The hook returns `isLoading: true` when:
- Initial page load (user state being loaded from cookies)
- During onboarding flow (`isFirstVisit && !hasCompletedOnboarding`)

Always show a loading spinner during these states to prevent content flash.

## Current Protected Pages

### `/task_creator` - Teacher Only
- **Requires:** Authentication + Teacher identity
- **Redirects to:** `/unauthorized` (if logged in as non-teacher) or `/` (if not logged in)
- **Purpose:** Only teachers can create educational tasks

### `/search_tasks` - Authenticated Users
- **Requires:** Authentication only
- **Redirects to:** `/` (if not logged in)
- **Purpose:** Registered users can search and browse tasks

### `/` - Public
- **Requires:** Nothing
- **Purpose:** Landing page accessible to everyone

## Adding Protection to New Pages

1. **Import the hook and loading component:**
```typescript
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
```

2. **Add protection logic:**
```typescript
const { isAuthorized, isLoading } = useRouteProtection({
  requireAuth: true,
  requireIdentity: 'teacher', // Optional
});
```

3. **Add loading and unauthorized states:**
```typescript
if (isLoading) {
  return <LoadingSpinner message="Loading..." fullScreen />;
}

if (!isAuthorized) {
  return <LoadingSpinner message="Redirecting..." fullScreen />;
}
```

## Testing Protection

### Test Authentication Protection

1. Visit protected page while logged out → Should redirect to home
2. Complete onboarding and login → Should see protected content

### Test Role Protection

1. Login as non-teacher
2. Visit `/task_creator` → Should redirect to `/unauthorized` page
3. Login as teacher → Should see task creator

### Test 404 Page

1. Visit non-existent route (e.g., `/does-not-exist`) → Should see 404 page
2. Click "Go to Home" → Should navigate to home page

### Test Unauthorized Page

1. Login as non-teacher
2. Visit `/task_creator` → Should see 403 Unauthorized page
3. Click "Go Back" → Should return to previous page
4. Click "Go to Home" → Should navigate to home page

## Future Enhancements

Consider adding:
- **Role-based navigation** - Hide/show nav links based on user role
- **Permission system** - More granular permissions beyond teacher/non-teacher
- **Middleware** - Server-side protection for API routes
- **JWT validation** - Verify tokens on protected routes
- **Analytics** - Track unauthorized access attempts

## Troubleshooting

**Issue:** Page content flashes before redirect
- **Solution:** Make sure you're showing `LoadingSpinner` during `isLoading` state

**Issue:** Infinite redirect loop
- **Solution:** Don't use route protection on the redirect target page

**Issue:** User state not persisting
- **Solution:** Check that cookies are being set correctly in `UserContext`

**Issue:** Authorization check not working
- **Solution:** Ensure user has completed onboarding and identity is set
