# SendGrid Email Implementation - EduForger

## Overview
This document describes the SendGrid email implementation for EduForger, combining Firebase Extension for registration emails with direct SendGrid integration for password reset and contact support.

---

## Architecture

### Email Flow Types

1. **Registration Verification** - Firebase Extension
   - Uses Firestore `mail` collection
   - Queued and sent by Firebase Extension
   - Provides retry logic and audit trail

2. **Password Reset** - Direct SendGrid
   - Immediate email sending via SendGrid API
   - Token-based reset flow
   - 30-minute expiration

3. **Contact Support** - Direct SendGrid
   - Dual emails (user confirmation + support notification)
   - Messages stored in Firestore for tracking
   - Support inbox receives notifications

---

## Configuration

### Environment Variables

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=noreply@eduforger.com
SENDGRID_FROM_NAME=EduForger
SENDGRID_SUPPORT_EMAIL=support@eduforger.com
```

### Firebase Extension Configuration

Located in: `extensions/firestore-send-email.env`

```
AUTH_TYPE=API_Key
DEFAULT_FROM=noreply@eduforger.com
MAIL_COLLECTION=mail
SMTP_CONNECTION_URI=apikey://YOUR_SENDGRID_API_KEY@smtp.sendgrid.net:465
```

---

## API Endpoints

### Password Reset

#### 1. Request Password Reset
```
POST /api/password-reset/request
Content-Type: application/json

{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

#### 2. Verify Reset Token
```
GET /api/password-reset/verify/:token

Response:
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

#### 3. Reset Password
```
POST /api/password-reset/reset
Content-Type: application/json

{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}

Response:
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### Contact Support

#### 1. Submit Contact Message
```
POST /api/contact/submit
Content-Type: application/json

{
  "userEmail": "user@example.com",
  "userName": "John Doe",
  "subject": "Need help with...",
  "message": "Detailed message here"
}

Response:
{
  "success": true,
  "message": "Your message has been sent. We'll get back to you within 24-48 hours."
}
```

#### 2. Get All Messages (Admin Only)
```
GET /api/contact/messages?limit=50
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [...]
}
```

#### 3. Update Message Status (Admin Only)
```
PATCH /api/contact/messages/:messageId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_progress"  // or "new", "resolved"
}

Response:
{
  "success": true,
  "message": "Message status updated successfully"
}
```

---

## Email Templates

### 1. Verification Email (Firebase Extension)
- **Subject**: "EduForger - Email Verification Code"
- **Template**: Located in `auth.service.ts`
- **Expiry**: 15 minutes
- **Format**: 6-digit code

### 2. Password Reset Email (SendGrid Direct)
- **Subject**: "EduForger - Password Reset Request"
- **Template**: `email.service.ts::sendPasswordResetEmail()`
- **Expiry**: 30 minutes
- **Format**: Button link + fallback URL

### 3. Contact Support Confirmation (SendGrid Direct)
- **Subject**: "EduForger - Support Request Received"
- **Template**: `email.service.ts::sendContactSupportConfirmation()`
- **Contains**: Copy of user's message
- **Response Time**: 24-48 hours

### 4. Contact Support Notification (SendGrid Direct)
- **Subject**: "Support Request: [User's Subject]"
- **Template**: `email.service.ts::sendContactSupportNotification()`
- **Recipient**: Support team
- **Reply-To**: User's email

---

## Firestore Collections

### 1. `mail` (Firebase Extension)
- Used by Firebase Extension for queued emails
- Auto-deleted after sending
- Contains: `to`, `message` (subject, html, text)

### 2. `passwordResets`
- Document ID: Reset token (random 64-char hex)
- Fields:
  - `email`: User email
  - `token`: Reset token
  - `createdAt`: Timestamp
  - `expiresAt`: Timestamp (30 min from creation)
  - `used`: Boolean

### 3. `contactMessages`
- Fields:
  - `userEmail`: Sender email
  - `userName`: Sender name
  - `subject`: Message subject
  - `message`: Message content
  - `createdAt`: Timestamp
  - `status`: "new" | "in_progress" | "resolved"

---

## Testing

### Test Scripts

1. **Test SendGrid Basic Functionality**
   ```bash
   npx ts-node src/scripts/test-sendgrid.ts
   ```

2. **Test Password Reset**
   ```bash
   npx ts-node src/scripts/test-password-reset.ts
   ```

3. **Test Contact Support**
   ```bash
   npx ts-node src/scripts/test-contact-support.ts
   ```

### Expected Results
- All test scripts should complete successfully
- Emails should arrive within 1-2 minutes
- Check spam folder if not received

---

## SendGrid Dashboard

### Important Links
- **API Keys**: https://app.sendgrid.com/settings/api_keys
- **Sender Authentication**: https://app.sendgrid.com/settings/sender_auth
- **Email Activity**: https://app.sendgrid.com/email_activity
- **Suppressions**: https://app.sendgrid.com/suppressions

### Monitoring
- Check email delivery rates daily
- Monitor bounce/spam rates
- Review suppression lists weekly

---

## Security Best Practices

1. **API Key Protection**
   - Never commit API keys to version control
   - Rotate keys every 6 months
   - Use separate keys for dev/staging/production

2. **Password Reset Security**
   - Tokens expire after 30 minutes
   - One-time use only
   - Don't reveal if email exists (security)

3. **Rate Limiting**
   - Consider adding rate limits to prevent abuse
   - Especially for contact form and password reset

4. **Email Validation**
   - Always validate email format
   - Use CAPTCHA on public forms
   - Sanitize user input before sending

---

## Troubleshooting

### Email Not Received
1. Check SendGrid Activity dashboard
2. Verify sender email is authenticated
3. Check spam/junk folder
4. Review API key permissions

### 403 Forbidden Error
- Sender email not verified in SendGrid
- Go to Sender Authentication and verify domain/email

### Firebase Extension Not Sending
1. Check extension configuration
2. Verify `SMTP_CONNECTION_URI` format
3. Check Firestore `mail` collection for errors
4. Review Firebase Extension logs

---

## Future Enhancements

### Recommended Features
1. **Welcome Email** - After successful registration
2. **Email Change Confirmation** - When user updates email
3. **Subscription Notifications** - Trial expiring, payment failed, etc.
4. **Weekly Digest** - For teachers (optional)
5. **SendGrid Webhooks** - Track bounces, opens, clicks

### Optimization
1. Use SendGrid Dynamic Templates for easier template management
2. Implement email queueing for bulk sends
3. Add retry logic for failed sends
4. Track email metrics in database

---

## File Structure

```
backend/src/
├── services/
│   ├── email.service.ts              # SendGrid email functions
│   ├── password-reset.service.ts     # Password reset logic
│   ├── contact.service.ts            # Contact support logic
│   └── auth.service.ts               # Registration (Firebase Extension)
├── controllers/
│   ├── password-reset.controller.ts  # Password reset endpoints
│   └── contact.controller.ts         # Contact support endpoints
├── routes/
│   ├── password-reset.routes.ts      # Password reset routes
│   └── contact.routes.ts             # Contact support routes
├── types/
│   ├── email.types.ts                # Email type definitions
│   ├── password-reset.types.ts       # Password reset types
│   └── contact.types.ts              # Contact types
├── scripts/
│   ├── test-sendgrid.ts              # Basic SendGrid test
│   ├── test-password-reset.ts        # Password reset test
│   └── test-contact-support.ts       # Contact support test
├── config.ts                         # SendGrid configuration
└── extensions/
    └── firestore-send-email.env      # Firebase Extension config
```

---

## Support

For issues or questions:
- Check this documentation first
- Review SendGrid documentation: https://docs.sendgrid.com/
- Contact: marton.horvath@stocksaver.com
