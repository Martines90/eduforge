# Password Reset reCAPTCHA Integration

This document describes how to implement reCAPTCHA verification for the password reset flow.

## Frontend Implementation ✅ COMPLETED

The `ForgotPasswordModal` component has been updated with reCAPTCHA protection on Step 1 (Email entry).

**File**: `frontend/components/organisms/ForgotPasswordModal/ForgotPasswordModal.tsx`

### Changes Made:
1. Added reCAPTCHA component before the "Send Code" button
2. Button is disabled until reCAPTCHA is completed
3. reCAPTCHA token is sent with the password reset request
4. Auto-resets reCAPTCHA on errors

## Backend Implementation 🚧 TODO

When you implement the password reset API endpoints, add reCAPTCHA verification similar to the registration flow.

### Recommended API Endpoints:

#### 1. Send Password Reset Code
**Endpoint**: `POST /api/auth/forgot-password`

**Request Body**:
```typescript
{
  email: string;
  recaptchaToken: string;
}
```

**Implementation**:
```typescript
// Example controller implementation
export async function sendPasswordResetCode(req: Request, res: Response): Promise<void> {
  try {
    const { email, recaptchaToken } = req.body;

    // Validate email
    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      });
      return;
    }

    // Verify reCAPTCHA token
    if (recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
      if (!isRecaptchaValid) {
        res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.',
          error: 'Invalid reCAPTCHA token',
        });
        return;
      }
    } else {
      // If no reCAPTCHA token provided and we're in production, reject the request
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification is required',
          error: 'Missing reCAPTCHA token',
        });
        return;
      }
      console.warn('[Auth] No reCAPTCHA token provided (development mode)');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code in Firestore with expiration (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await db.collection('passwordResetCodes').doc(email.toLowerCase()).set({
      email: email.toLowerCase(),
      code,
      createdAt: new Date(),
      expiresAt: expiresAt,
      attempts: 0,
    });

    // Send verification code via email
    await db.collection('mail').add({
      to: email.toLowerCase(),
      message: {
        subject: 'EduForger - Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1976d2;">Password Reset Request</h2>
            <p>You requested to reset your password. Please use the following verification code:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #1976d2; margin: 0; font-size: 32px; letter-spacing: 5px;">${code}</h1>
            </div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        `,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Password reset code sent to email',
    });
  } catch (error: any) {
    console.error('Send password reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send password reset code',
      error: error.message,
    });
  }
}
```

#### 2. Verify Code and Reset Password
**Endpoint**: `POST /api/auth/reset-password`

**Request Body**:
```typescript
{
  email: string;
  code: string;
  newPassword: string;
}
```

**Implementation** (no reCAPTCHA needed here - already verified in step 1):
```typescript
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;

    // Validate inputs
    if (!email || !code || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Email, code, and new password are required',
      });
      return;
    }

    // Get password reset code
    const codeDoc = await db.collection('passwordResetCodes').doc(email.toLowerCase()).get();

    if (!codeDoc.exists) {
      res.status(400).json({
        success: false,
        message: 'No password reset request found for this email',
      });
      return;
    }

    const codeData = codeDoc.data();

    // Check if code is expired
    const now = new Date();
    const expiresAt = codeData.expiresAt.toDate();

    if (now > expiresAt) {
      await db.collection('passwordResetCodes').doc(email.toLowerCase()).delete();
      res.status(400).json({
        success: false,
        message: 'Verification code has expired',
      });
      return;
    }

    // Check max attempts
    if (codeData.attempts >= 5) {
      res.status(400).json({
        success: false,
        message: 'Too many failed attempts',
      });
      return;
    }

    // Verify code
    if (codeData.code !== code) {
      // Increment attempts
      await db.collection('passwordResetCodes').doc(email.toLowerCase()).update({
        attempts: codeData.attempts + 1,
      });
      res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
      return;
    }

    // Find user
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (userSnapshot.empty) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const userDoc = userSnapshot.docs[0];
    const user = userDoc.data();

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password in userCredentials collection
    await db.collection('userCredentials').doc(user.uid).update({
      hashedPassword,
      updatedAt: new Date(),
    });

    // Delete password reset code
    await db.collection('passwordResetCodes').doc(email.toLowerCase()).delete();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message,
    });
  }
}
```

## Frontend API Service

When implementing the backend, update `frontend/lib/services/api.service.ts`:

```typescript
/**
 * Send password reset code
 */
export async function sendPasswordResetCode(
  email: string,
  recaptchaToken: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, recaptchaToken }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to send reset code');
  }

  return result;
}

/**
 * Reset password with verification code
 */
export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to reset password');
  }

  return result;
}
```

## Update ForgotPasswordModal

Replace the TODO comments in `ForgotPasswordModal.tsx` with actual API calls:

```typescript
// In handleSendCode function:
try {
  await apiService.sendPasswordResetCode(email, recaptchaToken);
  setCurrentStep('code');
} catch (error) {
  setError('Failed to send verification code. Please try again.');
  // Reset reCAPTCHA on error
  if (recaptchaRef.current) {
    recaptchaRef.current.reset();
  }
  setRecaptchaToken(null);
}
```

## Security Benefits

Adding reCAPTCHA to password reset prevents:
1. **Automated password reset attacks** - Bots can't spam reset requests
2. **Email bombing** - Prevents attackers from flooding users with reset emails
3. **Account enumeration** - Makes it harder to discover which emails are registered
4. **Denial of service** - Limits automated abuse of the password reset system

## Testing

After implementation, test:
1. ✅ reCAPTCHA appears on password reset form
2. ✅ "Send Code" button is disabled until CAPTCHA is completed
3. ✅ Backend rejects requests without valid reCAPTCHA token (in production)
4. ✅ Email is sent with 6-digit verification code
5. ✅ Code verification works correctly
6. ✅ Password is successfully reset
