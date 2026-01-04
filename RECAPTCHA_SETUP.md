# reCAPTCHA Setup Guide

This document explains how to set up Google reCAPTCHA v2 for the EduForger registration flow.

## Overview

reCAPTCHA protection has been added to the registration form to prevent automated spam registrations. The CAPTCHA challenge appears on **Step 2 (Personal Info)** before the verification email is sent.

## Features

- **Google reCAPTCHA v2 Checkbox**: User-friendly CAPTCHA challenge
- **Backend Verification**: The backend verifies the reCAPTCHA token before sending verification emails
- **Development Mode**: In development, reCAPTCHA verification is optional if keys are not configured
- **Production Mode**: In production, reCAPTCHA is required for all registrations

## Setup Instructions

### 1. Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click "Create" or "+" to register a new site
3. Fill in the form:
   - **Label**: EduForger (or your app name)
   - **reCAPTCHA type**: Select **reCAPTCHA v2** → **"I'm not a robot" Checkbox**
   - **Domains**: Add your domains (e.g., `localhost`, `eduforge.app`, etc.)
   - Accept the reCAPTCHA Terms of Service
4. Click **Submit**
5. You'll receive:
   - **Site Key** (public key - used in frontend)
   - **Secret Key** (private key - used in backend)

### 2. Configure Frontend

Add the site key to your frontend environment variables:

**File: `frontend/.env.local`** (create if it doesn't exist)
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_actual_site_key_here
```

The site key is already referenced in:
- `frontend/components/organisms/RegistrationModal/RegistrationModal.tsx`

### 3. Configure Backend

Add the secret key to your backend environment variables:

**File: `backend/.env`**
```bash
RECAPTCHA_SECRET_KEY=your_actual_secret_key_here
```

The secret key is already referenced in:
- `backend/src/utils/recaptcha.util.ts`

### 4. Test the Integration

1. **Start the backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test registration flow**:
   - Go to `http://localhost:3001` (or your frontend URL)
   - Click "Create Account"
   - Fill in Step 1 (Country & Subject)
   - Fill in Step 2 (Personal Info)
   - **Complete the reCAPTCHA checkbox**
   - Click "Create Account"
   - The "Create Account" button should be disabled until reCAPTCHA is completed

## Implementation Details

### Frontend Changes

**Files Modified:**
- `frontend/components/organisms/RegistrationModal/RegistrationModal.tsx`
  - Added `react-google-recaptcha` component
  - Added reCAPTCHA token state management
  - Validation to ensure reCAPTCHA is completed before submission
  - Auto-reset reCAPTCHA on error

- `frontend/lib/services/api.service.ts`
  - Updated `RegisterData` interface to include optional `recaptchaToken`

### Backend Changes

**Files Modified:**
- `backend/src/types/auth.types.ts`
  - Updated `RegisterRequest` interface to include optional `recaptchaToken`

- `backend/src/utils/recaptcha.util.ts` (NEW)
  - Utility function to verify reCAPTCHA tokens with Google's API
  - Uses axios to make POST request to Google's verification endpoint

- `backend/src/controllers/auth.controller.ts`
  - Added reCAPTCHA verification before sending verification email
  - In production, reCAPTCHA is required
  - In development, reCAPTCHA is optional (warning logged)

## Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
```

### Backend (.env)
```bash
RECAPTCHA_SECRET_KEY=your_secret_key_here
NODE_ENV=development  # or production
```

## Security Notes

1. **Never commit actual keys to version control**
   - Keys are stored in `.env` and `.env.local` files
   - These files are in `.gitignore`

2. **Production vs Development**
   - In production (`NODE_ENV=production`), reCAPTCHA is mandatory
   - In development, you can skip reCAPTCHA if keys are not configured

3. **Key Separation**
   - Frontend uses **Site Key** (public, safe to expose)
   - Backend uses **Secret Key** (private, must be kept secure)

## Troubleshooting

### reCAPTCHA not showing
- Check that `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set in `frontend/.env.local`
- Restart the Next.js dev server after adding environment variables
- Check browser console for errors

### "reCAPTCHA verification failed" error
- Ensure `RECAPTCHA_SECRET_KEY` is set correctly in `backend/.env`
- Verify that the site key and secret key are from the same reCAPTCHA site
- Check backend logs for detailed error messages

### Domain mismatch errors
- Add your domain to the reCAPTCHA site configuration in Google Admin Console
- For local development, make sure `localhost` is added to allowed domains

## API Flow

1. **User fills registration form** (frontend)
2. **User completes reCAPTCHA** (frontend)
3. **Frontend receives reCAPTCHA token** from Google
4. **Frontend sends registration request** with token to backend
5. **Backend verifies token** with Google's API
6. **Backend sends verification email** (only if reCAPTCHA is valid)
7. **User receives email** with verification code

## Additional Resources

- [reCAPTCHA Documentation](https://developers.google.com/recaptcha/docs/display)
- [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
- [react-google-recaptcha](https://github.com/dozoisch/react-google-recaptcha)
