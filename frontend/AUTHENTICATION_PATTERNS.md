# Authentication Patterns in EduForger

This document describes the authentication and authorization patterns used throughout the application.

## Overview

We have two complementary approaches for protecting pages:

1. **`AuthenticatedPage` Component** - Declarative wrapper component (recommended for new pages)
2. **`useRouteProtection` Hook** - Imperative hook (legacy, being phased out)

## 1. AuthenticatedPage Component (Recommended)

A reusable wrapper component that handles authentication and role-based access control.

### Location
`/components/templates/AuthenticatedPage/`

### Basic Usage

```tsx
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';

export default function TasksPage() {
  return (
    <AuthenticatedPage>
      <Container>
        {/* Your page content */}
      </Container>
    </AuthenticatedPage>
  );
}
```

### Role-Based Access (Teacher Only)

```tsx
export default function TaskCreatorPage() {
  return (
    <AuthenticatedPage
      requireIdentity="teacher"
      showLoadingSpinner
      loadingMessage="Loading task creator..."
    >
      <Container>
        {/* Teacher-only content */}
      </Container>
    </AuthenticatedPage>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Page content to render when authorized |
| `requireAuth` | `boolean` | `true` | Whether authentication is required |
| `requireIdentity` | `'teacher' \| 'non-teacher'` | `undefined` | Require specific user role |
| `redirectTo` | `string` | `'/unauthorized'` | Where to redirect unauthorized users |
| `showLoadingSpinner` | `boolean` | `false` | Show spinner during auth check |
| `loadingMessage` | `string` | `'Loading...'` | Custom loading message |

### Features

✅ **Prevents content leaking** - Returns `null` for non-authenticated users
✅ **Role-based access** - Support for teacher vs non-teacher roles
✅ **Automatic redirect** - Redirects unauthorized users
✅ **Clean UX** - No flash of protected content
✅ **Centralized logic** - Single source of truth

## 2. useRouteProtection Hook (Legacy)

An imperative hook that provides auth state and handles redirects.

### Location
`/lib/hooks/useRouteProtection.ts`

### Usage

```tsx
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';

export default function MyTasksPage() {
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

  return <Container>{/* Content */}</Container>;
}
```

### When to Use Each

| Scenario | Use |
|----------|-----|
| New pages | `AuthenticatedPage` component |
| Simple auth check | `AuthenticatedPage` component |
| Role-based access | `AuthenticatedPage` component |
| Need auth state in logic | `useRouteProtection` hook |
| Existing pages (legacy) | Keep `useRouteProtection` or refactor |

## Current Page Protection

### Public Pages (No Auth Required)
- `/tasks/[id]` - Task detail pages

### Authenticated Pages (Any Logged-in User)
- `/` - Home page
- `/tasks` - Task search page
- `/profile` - User profile

### Teacher-Only Pages
- `/task_creator` - Task creation
- `/my-tasks` - User's created tasks

## Migration Guide

To migrate from `useRouteProtection` to `AuthenticatedPage`:

**Before:**
```tsx
export default function MyPage() {
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthorized) return <LoadingSpinner message="Redirecting..." />;

  return <Container>Content</Container>;
}
```

**After:**
```tsx
export default function MyPage() {
  return (
    <AuthenticatedPage requireIdentity="teacher" showLoadingSpinner>
      <Container>Content</Container>
    </AuthenticatedPage>
  );
}
```

## Best Practices

1. **Use `AuthenticatedPage` for all new pages** - It's cleaner and more maintainable
2. **Keep role checks centralized** - Don't duplicate auth logic across pages
3. **Use `requireIdentity` prop** - Instead of checking `user.identity` in component
4. **Show loading states** - Use `showLoadingSpinner` for better UX
5. **Test unauthorized access** - Verify redirects work correctly

## Security Notes

- Authentication logic runs on client-side (React components)
- Backend APIs must ALWAYS verify authentication via JWT tokens
- Never trust client-side auth checks alone
- Use Firebase Auth tokens for backend API calls
- The `OnboardingHandler` manages the login modal display
