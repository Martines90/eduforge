'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockResetIcon from '@mui/icons-material/LockReset';
import { Button } from '@/components/atoms/Button';

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'code' | 'newPassword' | 'success';

/**
 * Forgot Password Modal
 * Handles the password reset flow:
 * 1. Enter email
 * 2. Enter verification code sent to email
 * 3. Set new password
 */
export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    // Reset state when closing
    setCurrentStep('email');
    setEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setIsLoading(false);
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendCode = async () => {
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement backend API call
      // await apiService.sendPasswordResetCode(email);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep('code');
      alert('Password reset functionality will be implemented with backend API. For now, use code: 123456');
    } catch (error) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');

    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement backend API call
      // await apiService.verifyPasswordResetCode(email, verificationCode);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep('newPassword');
    } catch (error) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Implement backend API call
      // await apiService.resetPassword(email, verificationCode, newPassword);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentStep('success');
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIndex = (): number => {
    switch (currentStep) {
      case 'email':
        return 0;
      case 'code':
        return 1;
      case 'newPassword':
        return 2;
      case 'success':
        return 3;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" component="div">Reset Password</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Progress Stepper */}
        <Stepper activeStep={getStepIndex()} sx={{ mb: 3 }}>
          <Step>
            <StepLabel>Email</StepLabel>
          </Step>
          <Step>
            <StepLabel>Verify Code</StepLabel>
          </Step>
          <Step>
            <StepLabel>New Password</StepLabel>
          </Step>
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Step 1: Enter Email */}
        {currentStep === 'email' && (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your email address and we&apos;ll send you a verification code to reset your password.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 3 }}
              autoFocus
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSendCode} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Code'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Enter Verification Code */}
        {currentStep === 'code' && (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              We&apos;ve sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below.
            </Typography>

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              disabled={isLoading}
              sx={{ mb: 3 }}
              autoFocus
              inputProps={{ maxLength: 6 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
              <Button
                variant="text"
                onClick={() => setCurrentStep('email')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="secondary" onClick={handleSendCode} disabled={isLoading}>
                  Resend Code
                </Button>
                <Button variant="primary" onClick={handleVerifyCode} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 3: Set New Password */}
        {currentStep === 'newPassword' && (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your new password. Make sure it&apos;s at least 8 characters long.
            </Typography>

            <TextField
              fullWidth
              type="password"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
              autoFocus
            />

            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleResetPassword} disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" component="div" color="success.main" gutterBottom>
              Password Reset Successful!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Your password has been reset successfully. You can now log in with your new password.
            </Typography>

            <Button variant="primary" onClick={handleClose} sx={{ mt: 2 }}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
