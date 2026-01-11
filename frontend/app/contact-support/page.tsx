"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/atoms/Button";
import { useUser } from "@/lib/context/UserContext";
import * as apiService from "@/lib/services/api.service";

const SUBJECT_OPTIONS = [
  "Technical Issue",
  "Billing Question",
  "Feature Request",
  "Account Problem",
  "Task Generation Issue",
  "Other",
];

export default function ContactSupportPage() {
  const router = useRouter();
  const { user } = useUser();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // reCAPTCHA state
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const handleSubmit = async () => {
    setError("");

    // Validation
    if (!subject) {
      setError("Please select a subject");
      return;
    }

    if (!message) {
      setError("Please enter your message");
      return;
    }

    if (message.length < 10) {
      setError("Message must be at least 10 characters long");
      return;
    }

    if (message.length > 5000) {
      setError("Message must be less than 5000 characters");
      return;
    }

    // Verify reCAPTCHA was completed
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification");
      return;
    }

    if (!user || !user.profile?.email || !user.profile?.name) {
      setError("User information not available. Please log in again.");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.submitContactSupport({
        userEmail: user.profile.email,
        userName: user.profile.name,
        subject,
        message,
      });
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || "Failed to submit message. Please try again.");
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSubject("");
    setMessage("");
    setError("");
    setIsSuccess(false);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
    setRecaptchaToken(null);
  };

  // Show loading state while checking authentication
  if (!user) {
    return null;
  }

  if (isSuccess) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{ p: 4, width: "100%", textAlign: "center" }}
          >
            <CheckCircleIcon
              sx={{ fontSize: 64, color: "success.main", mb: 2 }}
            />
            <Typography variant="h5" color="success.main" gutterBottom>
              Message Sent Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Thank you for contacting us. We&apos;ve received your message and will
              get back to you within 48 hours.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              You&apos;ll receive a confirmation email at{" "}
              <strong>{user.profile?.email}</strong>
            </Typography>

            <Box
              sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 3 }}
            >
              <Button variant="secondary" onClick={handleReset}>
                Send Another Message
              </Button>
              <Button variant="primary" onClick={() => router.push("/")}>
                Back to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
            <SupportAgentIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" component="h1">
              Contact Support
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph>
            Need help? Send us a message and we&apos;ll get back to you within 48
            hours.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Your Email:</strong> {user.profile?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Your Name:</strong> {user.profile?.name}
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="subject-label">Subject</InputLabel>
            <Select
              labelId="subject-label"
              value={subject}
              label="Subject"
              onChange={(e) => setSubject(e.target.value)}
              disabled={isLoading}
            >
              {SUBJECT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={8}
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            placeholder="Please describe your issue or question in detail..."
            helperText={`${message.length}/5000 characters`}
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 5000 }}
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
              onClick={() => router.push("/")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isLoading || !recaptchaToken || !subject || !message}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
