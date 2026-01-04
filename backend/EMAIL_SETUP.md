# Email Setup Guide for EduForger

This guide explains how to configure email sending for user verification codes.

## Overview

EduForger uses the Firebase Extension "Trigger Email from Firestore" to send verification emails. When a user registers, a verification code is generated and an email is queued in Firestore, which the extension automatically sends.

## Setup Steps

### 1. Choose an Email Provider

You need an SMTP server to send emails. Options include:

#### **Option A: Gmail (Easiest for testing)**
- Free for personal use
- Requires "App Password" (not your regular password)
- Limit: ~100 emails/day

#### **Option B: SendGrid (Recommended for production)**
- Free tier: 100 emails/day
- Professional email service
- Better deliverability

#### **Option C: Mailgun**
- Free tier: 100 emails/day
- Alternative to SendGrid

### 2. Get SMTP Credentials

#### For Gmail:
1. Go to Google Account settings: https://myaccount.google.com/
2. Enable 2-Factor Authentication (required)
3. Go to Security → 2-Step Verification → App passwords
4. Generate an app password for "Mail"
5. Copy the 16-character password (remove spaces)

Your SMTP URI will be:
```
smtps://your-email@gmail.com:your-16-char-app-password@smtp.gmail.com:465
```

#### For SendGrid:
1. Sign up at https://sendgrid.com/
2. Go to Settings → API Keys
3. Create an API Key
4. Copy the API key

Your SMTP URI will be:
```
smtps://apikey:YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

#### For Mailgun:
1. Sign up at https://www.mailgun.com/
2. Add and verify your domain
3. Get SMTP credentials from domain settings

Your SMTP URI will be:
```
smtps://postmaster@your-domain.mailgun.org:your-password@smtp.mailgun.org:465
```

### 3. Configure the Extension

1. Copy the example configuration:
   ```bash
   cd backend
   cp extensions/firestore-send-email.env.example extensions/firestore-send-email.env
   ```

2. Edit `extensions/firestore-send-email.env`:
   ```env
   # Replace with your SMTP URI from step 2
   SMTP_CONNECTION_URI=smtps://your-email@gmail.com:your-app-password@smtp.gmail.com:465

   # Set your "From" email address
   DEFAULT_FROM=noreply@eduforge.com

   # Collection name (leave as is)
   MAIL_COLLECTION=mail

   # Optional: for testing, send all emails to one address
   # TESTING_EMAIL=your-test-email@example.com
   ```

### 4. Deploy the Extension

```bash
cd backend
firebase deploy --only extensions
```

This will:
- Install the "Trigger Email from Firestore" extension
- Configure it with your SMTP settings
- Create a Cloud Function that monitors the `mail` collection

### 5. Test Email Sending

1. Register a new user through your frontend
2. Check the Firestore console → `mail` collection
3. You should see:
   - Initial document with email details
   - After a few seconds, it updates with `delivery.state: "SUCCESS"`
4. Check your email inbox for the verification code

### 6. Monitor Email Delivery

To check email delivery status:

1. Go to Firebase Console → Firestore
2. Open the `mail` collection
3. Each document shows:
   - `to`: Recipient email
   - `message`: Email content
   - `delivery.state`: SUCCESS, ERROR, or PENDING
   - `delivery.info`: Delivery details or error message

## Troubleshooting

### Emails not sending?

1. **Check Firestore `mail` collection**
   - Are documents being created?
   - What's the `delivery.state`?

2. **Check Firebase Extension logs**
   ```bash
   firebase functions:log --only ext-firestore-send-email-processQueue
   ```

3. **Common issues:**
   - **Invalid SMTP credentials**: Double-check your URI
   - **Gmail blocking**: Enable "Less secure app access" (if available) or use App Password
   - **Firewall**: Ensure Cloud Functions can reach your SMTP server
   - **Rate limits**: Gmail has ~100 emails/day limit

### Testing without sending real emails

Set `TESTING_EMAIL` in your `.env` file:
```env
TESTING_EMAIL=your-test-email@example.com
```

All emails will be redirected to this address instead of real recipients.

## Email Template

The verification email includes:
- Welcome message with user's name
- 6-digit verification code (large, centered)
- Expiration notice (15 minutes)
- Professional HTML styling

You can customize the template in:
`backend/src/services/auth.service.ts` → `createVerificationCode()` function

## Security Notes

⚠️ **Important:**
- Never commit `extensions/firestore-send-email.env` to git
- The file is already in `.gitignore`
- Rotate SMTP credentials if they're exposed
- Use App Passwords for Gmail (not your main password)
- Consider rate limiting registration attempts

## Cost

The Firebase Extension is free, but you pay for:
- Cloud Functions executions (~0.0001¢ per email)
- Firestore writes/reads (~0.00006¢ per email)
- Your SMTP provider's fees (if any)

**Estimated cost:** < $0.01 per 100 emails

## Production Recommendations

For production use:
1. ✅ Use SendGrid or Mailgun (not Gmail)
2. ✅ Set up a custom domain email (e.g., noreply@eduforge.com)
3. ✅ Configure SPF, DKIM, and DMARC records
4. ✅ Monitor bounce rates and spam complaints
5. ✅ Implement rate limiting on registration endpoint
6. ✅ Set up alerts for email delivery failures
