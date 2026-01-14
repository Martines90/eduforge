# URL Configuration - Single Source of Truth

## Problem Solved

Previously, the application had hardcoded localhost URLs scattered throughout the codebase, causing production URLs to leak localhost references. For example, share links generated in production showed `http://localhost:3001/tasks/...` instead of the production URL.

This has been completely fixed by implementing a **single source of truth** for all URL configuration.

## Solution

### Backend Configuration

**File:** `backend/src/config.ts`

The backend now has a centralized `config.frontendUrl` that:
1. Reads from `FRONTEND_URL` environment variable (highest priority)
2. Falls back to `CORS_ORIGIN` if available
3. Uses production default (`https://eduforge-d29d9.web.app`) if `NODE_ENV=production`
4. Uses development default (`http://localhost:3001`) otherwise

**Usage:**
```typescript
import { config } from '../config';

// Generate share link
const shareLink = `${config.frontendUrl}/tasks/${taskId}`;

// Generate password reset link
const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
```

**Files updated:**
- `backend/src/controllers/task.controller.ts` - Task share link generation
- `backend/src/services/password-reset.service.ts` - Password reset URL generation

### Frontend Configuration

**File:** `frontend/lib/config/urls.ts`

The frontend now has centralized URL utilities:
- `getApiBaseUrl()` - Returns the backend API URL
- `getAppBaseUrl()` - Returns the frontend app URL
- `buildApiUrl(endpoint)` - Builds a full API URL
- `buildAppUrl(path)` - Builds a full app URL

**Priority order for API URL:**
1. `NEXT_PUBLIC_API_URL` environment variable
2. Browser environment check (relative URLs in production, localhost in dev)
3. SSR/build time check

**Priority order for App URL:**
1. `NEXT_PUBLIC_APP_URL` environment variable
2. `window.location.origin` (in browser)
3. Production default (`https://eduforge-d29d9.web.app`)
4. Development default (`http://localhost:3001`)

**Usage:**
```typescript
import { buildApiUrl, buildAppUrl } from '@/lib/config/urls';

// API calls
const response = await fetch(buildApiUrl('/api/tasks'));

// Share links
const shareLink = buildAppUrl(`/tasks/${taskId}`);
```

**Files updated:**
- `frontend/lib/services/api.service.ts` - All API calls
- `frontend/lib/hooks/useGuestSession.ts` - Guest session API calls
- `frontend/lib/utils/pdf-generator.ts` - PDF upload URL
- `frontend/app/my-tasks/page.tsx` - Task deletion API call

## Environment Variables

### Backend (.env files)

**Development** (`backend/.env`):
```bash
FRONTEND_URL=http://localhost:3001
```

**Production** (`backend/.env.production`):
```bash
FRONTEND_URL=https://eduforge-d29d9.web.app
```

### Frontend (.env files)

**Development** (`frontend/.env.local`):
```bash
# Automatically uses localhost:3000 for API
# Automatically uses localhost:3001 for app
# Only override if needed:
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Production** (`frontend/.env`):
```bash
NEXT_PUBLIC_API_URL=https://api-dvzsjor7ja-uc.a.run.app
NEXT_PUBLIC_APP_URL=https://eduforge-d29d9.web.app
```

## Deployment Checklist

### Backend (Cloud Run / Cloud Functions)

Ensure these environment variables are set:
```bash
FRONTEND_URL=https://eduforge-d29d9.web.app
NODE_ENV=production
```

### Frontend (Firebase Hosting)

Ensure `.env` file has:
```bash
NEXT_PUBLIC_API_URL=https://api-dvzsjor7ja-uc.a.run.app
NEXT_PUBLIC_APP_URL=https://eduforge-d29d9.web.app
```

## Testing

### Development
1. Start backend: `cd backend && npm run dev` (should use localhost:3000)
2. Start frontend: `cd frontend && npm run dev` (should use localhost:3001)
3. Test task creation and save - share link should be `http://localhost:3001/tasks/...`

### Production
1. Deploy backend with `FRONTEND_URL=https://eduforge-d29d9.web.app`
2. Deploy frontend with production `.env`
3. Test task creation and save - share link should be `https://eduforge-d29d9.web.app/tasks/...`

## Key Benefits

1. ✅ **No more hardcoded URLs** - All URLs are configurable
2. ✅ **Environment-aware** - Automatically uses correct URLs for dev/prod
3. ✅ **Single source of truth** - All URL logic is centralized
4. ✅ **Type-safe** - Using TypeScript utilities throughout
5. ✅ **Easy to maintain** - Change URL logic in one place
6. ✅ **Production-safe** - No localhost URLs will ever leak to production

## Migration Guide

If you add new code that needs to generate URLs:

### Backend
```typescript
// ❌ DON'T DO THIS
const url = process.env.FRONTEND_URL || 'http://localhost:3001';

// ✅ DO THIS
import { config } from '../config';
const url = config.frontendUrl;
```

### Frontend
```typescript
// ❌ DON'T DO THIS
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const appUrl = window.location.origin;

// ✅ DO THIS
import { buildApiUrl, buildAppUrl } from '@/lib/config/urls';
const apiUrl = buildApiUrl('/api/endpoint');
const appUrl = buildAppUrl('/some/path');
```

## Troubleshooting

### Share links still showing localhost in production

1. Check backend environment variables:
   ```bash
   # Should be set in Cloud Run/Functions
   FRONTEND_URL=https://eduforge-d29d9.web.app
   NODE_ENV=production
   ```

2. Check backend logs to see what URL is being used:
   ```typescript
   console.log('Frontend URL:', config.frontendUrl);
   ```

3. Verify `.env.production` exists in backend and is being used

### API calls failing in production

1. Check frontend `.env` file:
   ```bash
   NEXT_PUBLIC_API_URL=https://api-dvzsjor7ja-uc.a.run.app
   ```

2. Check browser console to see what URL is being used:
   ```typescript
   console.log('API Base URL:', API_BASE_URL);
   ```

3. Verify the frontend is rebuilt with the production environment variables
