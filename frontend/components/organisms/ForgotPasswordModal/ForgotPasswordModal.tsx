"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/atoms/Button";
import * as apiService from "@/lib/services/api.service";

interface ForgotPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Forgot Password Modal
 * Simplified flow: User enters email + CAPTCHA → Email with reset link is sent
 */
export function ForgotPasswordModal({
  open,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // reCAPTCHA state
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleClose = () => {
    // Reset state when closing
    setEmail("");
    setError("");
    setIsLoading(false);
    setIsSuccess(false);
    // Reset reCAPTCHA
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRecaptchaToken(null);
    onClose();
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetLink = async () => {
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    // Verify reCAPTCHA was completed
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.requestPasswordReset(email);
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to send reset link. Please try again.");
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockResetIcon color="primary" />
            <Typography variant="h6" component="div">
              Reset Password
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isSuccess ? (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your email address and we&apos;ll send you a link to reset your
              password.
            </Typography>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
              autoFocus
            />

            {/* reCAPTCHA */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""}
                onChange={(token) => {
                  setRecaptchaToken(token);
                  setError("");
                }}
                onExpired={() => setRecaptchaToken(null)}
                onErrored={() => {
                  setRecaptchaToken(null);
                  setError("reCAPTCHA verification failed. Please try again.");
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendResetLink}
                disabled={isLoading || !recaptchaToken}
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon
              sx={{ fontSize: 64, color: "success.main", mb: 2 }}
            />
            <Typography
              variant="h6"
              component="div"
              color="success.main"
              gutterBottom
            >
              Reset Link Sent!
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If an account exists with <strong>{email}</strong>, you will
              receive an email with instructions to reset your password.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The link will expire in 30 minutes.
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 2 }}
            >
              Don&apos;t forget to check your spam folder if you don&apos;t see the email.
            </Typography>

            <Button variant="primary" onClick={handleClose} sx={{ mt: 3 }}>
              Close
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
