# Development Setup Guide

## ⚠️ CRITICAL: Local Development Configuration

**ALWAYS verify your environment is configured for local development before starting!**

### Problem: Accidentally Using Production APIs

If you don't configure your local environment correctly, your localhost frontend will call the **PRODUCTION** backend API, which can cause:
- Confusion when debugging (changes to local backend won't be reflected)
- Unwanted modifications to production data
- Wasted time troubleshooting the wrong environment

### Solution: Proper .env.local Configuration

The project uses these environment files:
- `.env` - Production defaults (committed to git)
- `.env.local` - Local development overrides (**NOT** committed to git)

**`.env.local` MUST override the production URLs with localhost URLs!**

## Quick Start

### 1. Frontend Setup

```bash
cd app/frontend

# Create .env.local from example (if not exists)
cp .env.example .env.local

# Edit .env.local and ensure these lines are UNCOMMENTED:
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Your `.env.local` should look like:
```bash
# API Configuration - Development Mode
# CRITICAL: This MUST be set to localhost for local development
NEXT_PUBLIC_API_URL=http://localhost:3000

# App URL Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Verify Configuration

```bash
# This will check if your environment is configured correctly
npm run check-env
```

You should see:
```
✅ API URL correctly set to localhost: http://localhost:3000
✅ APP URL correctly set to localhost: http://localhost:3001
```

If you see errors, fix your `.env.local` file!

### 3. Start Development

```bash
# Frontend (automatically runs check-env first)
cd app/frontend
npm run dev

# Backend (in separate terminal)
cd app/backend
npm run dev:watch
```

## Verification Checklist

Before making API requests, verify:

1. ✅ Frontend is running on `http://localhost:3001`
2. ✅ Backend is running on `http://localhost:3000`
3. ✅ `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3000`
4. ✅ `npm run check-env` passes successfully
5. ✅ Browser DevTools Network tab shows requests to `localhost:3000` (NOT production URLs)

## Testing Your Setup

1. Start both frontend and backend
2. Open DevTools Network tab
3. Make a request from the frontend (e.g., generate a task)
4. Verify the request goes to `http://localhost:3000`
5. Verify you see log messages in the **backend terminal**

If you don't see backend logs, you're probably still hitting production!

## Common Mistakes

### ❌ Mistake 1: Commented Out .env.local
```bash
# Wrong - this is commented out!
# NEXT_PUBLIC_API_URL=http://localhost:3000
```

✅ **Fix:** Uncomment the line:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### ❌ Mistake 2: No .env.local File
If `.env.local` doesn't exist, Next.js uses `.env` which has production URLs!

✅ **Fix:** Create `.env.local` with localhost URLs

### ❌ Mistake 3: Using Production URL in .env.local
```bash
# Wrong - this is production!
NEXT_PUBLIC_API_URL=https://api-dvzsjor7ja-uc.a.run.app
```

✅ **Fix:** Use localhost:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Environment Variables Priority

Next.js loads environment variables in this order:
1. `.env.local` (highest priority - use for local development)
2. `.env.development` (development mode)
3. `.env.production` (production mode)
4. `.env` (lowest priority - shared defaults)

**Always use `.env.local` for local development overrides!**

## Troubleshooting

### No backend logs when making requests
**Cause:** Frontend is calling production API, not local backend

**Fix:**
1. Check `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3000`
2. Restart Next.js dev server (`npm run dev`)
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
4. Check Network tab to confirm requests go to localhost

### Backend running but getting CORS errors
**Cause:** Frontend might be on wrong port

**Fix:**
1. Frontend should be on `http://localhost:3001`
2. Backend should be on `http://localhost:3000`
3. Check `.env.local` has correct ports

## Production Deployment

When deploying to production:
- `.env.local` is **NOT** deployed (it's in `.gitignore`)
- `.env` values are used (production URLs)
- No changes needed - automatic!

## Scripts

```bash
# Check environment configuration
npm run check-env

# Start development (runs check-env automatically)
npm run dev

# Start without env check (not recommended)
next dev -p 3001
```
