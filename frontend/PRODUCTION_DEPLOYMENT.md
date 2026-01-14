# Production Deployment Guide

## Environment Configuration

### CRITICAL: Production API URL Configuration

**Problem:** The app is connecting to `http://localhost:3000` in production, causing errors like:
- "Failed to load curriculum data"
- "Cannot connect to backend server at http://localhost:3000"
- Infinite request loops to `/api/auth/guest-token`

**Solution:** Remove or update `NEXT_PUBLIC_API_URL` in your production environment.

### Option 1: Firebase Hosting with Cloud Functions (Recommended)

If you're using Firebase Hosting with Cloud Functions rewrites, **DO NOT SET** `NEXT_PUBLIC_API_URL` in production:

```bash
# .env.production (or Firebase environment config)
# DO NOT include NEXT_PUBLIC_API_URL
# The app will automatically use relative URLs for API calls

NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
```

The app will automatically use relative URLs (empty string) in production, which allows Firebase Hosting rewrites to work correctly.

### Option 2: Separate Backend Server

If your backend is hosted separately (e.g., on a different domain), set the full URL:

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.yourbackend.com

NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
```

### Option 3: Same Domain (Non-Firebase)

If your backend is on the same domain but not using Firebase:

```bash
# .env.production
NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
```

## How the API URL Resolution Works

The app uses smart API URL resolution logic in `lib/services/api.service.ts`:

```typescript
const getApiBaseUrl = (): string => {
  // 1. If explicitly set via env var, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. In browser environment
  if (typeof window !== 'undefined') {
    // In production (not localhost), use relative URLs
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
    // In local development, use localhost
    return 'http://localhost:3000';
  }

  // 3. During SSR/build time
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
};
```

## Deployment Steps

### 1. Check Current Configuration

```bash
# Navigate to frontend directory
cd frontend

# Check your .env.local file (should NOT be deployed)
cat .env.local

# Check if you have a .env.production file
cat .env.production 2>/dev/null || echo "No .env.production file"
```

### 2. Update Environment Variables

**For Firebase Hosting:**

```bash
# Remove NEXT_PUBLIC_API_URL from .env.local if it exists
# This file is for local development only and should NOT be committed

# Create or update .env.production
cat > .env.production <<EOF
# DO NOT set NEXT_PUBLIC_API_URL for Firebase Hosting
NEXT_PUBLIC_DISABLE_IMAGE_GENERATION=false
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_production_recaptcha_key
EOF
```

### 3. Build and Deploy

```bash
# Build the Next.js app
npm run build

# Test the production build locally
npm run start

# Deploy to Firebase
firebase deploy --only hosting
```

### 4. Verify Production Configuration

After deployment, open your browser's developer console and check:

```javascript
// Check what API URL is being used
console.log('API calls should go to:', window.location.origin + '/api/...');

// Look for errors in the console
// You should NOT see "Cannot connect to backend server at http://localhost:3000"
```

## Error Prevention Features

The app now includes several features to prevent infinite request loops:

### 1. Request Retry Logic with Exponential Backoff

All API calls now use `fetchWithRetry` which:
- Retries failed requests up to 3 times
- Uses exponential backoff (1s, 2s, 4s)
- Adds random jitter to prevent thundering herd
- Only retries network errors and 5xx server errors
- Does NOT retry 4xx client errors

### 2. Guest Session Creation Limits

The `useGuestSession` hook now:
- Limits retry attempts to 3 maximum
- Only attempts creation once per page load
- Tracks `hasAttemptedCreate` to prevent re-triggering
- Shows user-friendly error after max retries

### 3. Improved useEffect Dependencies

The task generator page now:
- Only creates guest session when `isGuest` changes
- Does NOT recreate on every `guestToken` or `isLoading` change
- Prevents infinite re-render loops

## Common Issues and Solutions

### Issue: Still seeing localhost errors in production

**Cause:** `.env.local` is being deployed or `NEXT_PUBLIC_API_URL` is set in production environment

**Solution:**
1. Ensure `.env.local` is in `.gitignore` (it should be)
2. Remove `NEXT_PUBLIC_API_URL` from production environment config
3. Rebuild and redeploy

### Issue: API calls failing with CORS errors

**Cause:** Backend is on a different domain and CORS is not configured

**Solution:**
1. Set `NEXT_PUBLIC_API_URL` to your backend domain
2. Configure CORS on your backend to allow requests from your frontend domain

### Issue: Infinite request loops

**Cause:** Error in API call triggering useEffect re-render

**Solution:**
- The retry logic now prevents this
- Check browser console for error messages
- Verify API endpoints are responding correctly

## Monitoring

After deployment, monitor these metrics:

1. **Error Rate:** Check for spikes in API errors
2. **Request Volume:** Look for unusual patterns (e.g., 6000+ requests)
3. **Response Times:** Ensure API calls are completing reasonably
4. **User Reports:** "Failed to load curriculum data" errors

## Rollback Plan

If issues occur in production:

1. Revert to previous deployment
2. Check Firebase Hosting versions: `firebase hosting:clone SOURCE_SITE_ID:SOURCE_VERSION_ID DESTINATION_SITE_ID`
3. Review environment configuration
4. Test locally before redeploying

## Support

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Verify backend is running and accessible
3. Review Firebase Functions logs: `firebase functions:log`
4. Contact support with error logs and deployment details
