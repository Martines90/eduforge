"use client";

import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardActionArea,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Alert,
  Snackbar,
  IconButton,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SchoolIcon from "@mui/icons-material/School";
import PeopleIcon from "@mui/icons-material/People";
import CloseIcon from "@mui/icons-material/Close";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";
import { CountryCode, UserIdentity, Subject, UserProfile } from "@/types/i18n";
import {
  ProgressStepper,
  StepConfig,
} from "@/components/molecules/ProgressStepper";
import { useTranslation } from "@/lib/i18n";
import { useUser, EducationalModel } from "@/lib/context/UserContext";
import { CountrySelect } from "@/components/molecules/CountrySelect";
import { SubjectSelect } from "@/components/molecules/SubjectSelect";
import { EducationalModelSelect } from "@/components/molecules/EducationalModelSelect";
import * as apiService from "@/lib/services/api.service";
import styles from "./RegistrationModal.module.scss";

export interface RegistrationModalProps {
  open: boolean;
  onRegister: (
    profile: UserProfile & {
      password: string;
      country: CountryCode;
      identity: UserIdentity;
      subject?: Subject;
      educationalModel?: EducationalModel;
    },
  ) => void;
  onBack?: () => void;
  onClose?: () => void;
  detectedCountry?: CountryCode;
  isTeacher: boolean;
  promptMessage?: string;
}

// Common personal email domains to block for teacher accounts
const PERSONAL_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "aol.com",
  "icloud.com",
  "mail.com",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "me.com",
  "msn.com",
];

const createPersonalInfoSchema = (isTeacher: boolean) =>
  Yup.object().shape({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Please enter a valid email address")
      .required("Email is required")
      .test(
        "work-email",
        "Please use a work or school email address, not a personal email",
        function (value) {
          if (!isTeacher || !value) return true;

          const domain = value.split("@")[1]?.toLowerCase();
          if (!domain) return true;

          return !PERSONAL_EMAIL_DOMAINS.includes(domain);
        },
      ),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Please confirm your password"),
  });

// Teacher flow: Country & Subject → Personal Info → Verification (3 steps)
// Non-teacher flow: Country → Personal Info → Verification (3 steps)
// Note: Steps use translation keys, but they're defined outside the component
// so we can't use the t() function here. They'll be translated in the component.

/**
 * RegistrationModal Organism Component
 * Multi-step registration with progress roadmap
 * Full screen on mobile devices
 */
export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onRegister,
  onBack,
  onClose,
  detectedCountry,
  isTeacher,
  promptMessage,
}) => {
  const { t } = useTranslation();
  const { setCountry: updateUserCountry } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Registration state
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(
    null,
  );
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedEducationalModel, setSelectedEducationalModel] = useState<
    EducationalModel | ""
  >("");

  // Verification state
  const [pendingUserData, setPendingUserData] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [verificationError, setVerificationError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // reCAPTCHA state
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Define steps with translations
  const teacherSteps: StepConfig[] = [
    { label: t("Country & Subject"), description: t("Location and expertise") },
    { label: t("Personal Info"), description: t("Name and Email") },
    { label: t("Verify Email"), description: t("Enter verification code") },
  ];

  const nonTeacherSteps: StepConfig[] = [
    { label: t("Country"), description: t("Select your location") },
    { label: t("Personal Info"), description: t("Name and Email") },
    { label: t("Verify Email"), description: t("Enter verification code") },
  ];

  const steps = isTeacher ? teacherSteps : nonTeacherSteps;

  const handleStepClick = (step: number) => {
    if (step < activeStep || completedSteps.includes(step)) {
      setActiveStep(step);
    }
  };

  // Step 1: Country Selection (and Subject for teachers)
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    // Update user country in context to trigger translation changes immediately
    updateUserCountry(country);
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleNext = () => {
    setCompletedSteps([...completedSteps, 0]);
    setActiveStep(1);
  };

  const isStep1Complete = isTeacher
    ? selectedCountry !== null &&
      selectedSubject !== null &&
      selectedEducationalModel !== ""
    : selectedCountry !== null;

  // Step 2: Personal Info Submission - Register user and move to verification step
  const handleSubmit = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (!selectedCountry) return;
    if (isTeacher && !selectedSubject) return;

    // Verify reCAPTCHA was completed
    if (!recaptchaToken) {
      setError(t("Please complete the reCAPTCHA verification"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Store data temporarily
      const userData = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      };
      setPendingUserData(userData);

      // Initiate registration - sends verification code (no user created yet)
      const role: "teacher" | "general_user" = isTeacher
        ? "teacher"
        : "general_user";
      await apiService.registerUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role,
        country: selectedCountry,
        recaptchaToken,
        ...(isTeacher && selectedSubject ? { subject: selectedSubject } : {}),
        ...(isTeacher && selectedEducationalModel
          ? { educationalModel: selectedEducationalModel as string }
          : {}),
      });

      // Move to verification step
      setCompletedSteps([...completedSteps, 1]);
      setActiveStep(2);
    } catch (err: any) {
      console.error("Error registering user:", err);
      setError(err.message || t("Failed to register user. Please try again."));
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verification Code Submission - Verify code and complete login
  const handleVerification = async () => {
    if (!pendingUserData || !selectedCountry) return;

    // Validate code format
    if (verificationCode.length !== 6) {
      setVerificationError(t("Please enter a valid 6-digit code"));
      return;
    }

    setLoading(true);
    setVerificationError("");
    setError("");

    try {
      // Verify code with backend API (this creates the user account)
      const response = await apiService.verifyEmail(
        pendingUserData.email,
        verificationCode,
      );

      // Code is valid - user is now created and verified
      const identity: UserIdentity = isTeacher ? "teacher" : "non-teacher";

      const profile: UserProfile & {
        password: string;
        country: CountryCode;
        identity: UserIdentity;
        subject?: Subject;
        educationalModel?: EducationalModel;
      } = {
        name: pendingUserData.name,
        email: pendingUserData.email,
        registeredAt: new Date().toISOString(),
        password: pendingUserData.password,
        country: selectedCountry,
        identity: identity,
        ...(isTeacher && selectedSubject ? { subject: selectedSubject } : {}),
        ...(isTeacher && selectedEducationalModel
          ? { educationalModel: selectedEducationalModel as EducationalModel }
          : {}),
      };

      // Store token if provided
      if (response.data?.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      // Set flag for trial subscription message (only for teachers)
      if (isTeacher && typeof window !== 'undefined') {
        sessionStorage.setItem('showTrialMessage', 'true');
      }

      // Show success toast
      setShowSuccessToast(true);

      // Wait for user to see the success message before proceeding
      await new Promise((resolve) => setTimeout(resolve, 1500));

      onRegister(profile);
    } catch (err: any) {
      console.error("Error verifying code:", err);
      setVerificationError(
        err.message || t("Failed to verify code. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  // Reset modal state when it closes to prevent focus trap issues
  React.useEffect(() => {
    if (!open) {
      // Reset all state when modal closes
      setActiveStep(0);
      setCompletedSteps([]);
      setSelectedCountry(null);
      setSelectedSubject(null);
      setSelectedEducationalModel("");
      setPendingUserData(null);
      setVerificationCode("");
      setVerificationError("");
      setLoading(false);
      setError("");
      // Reset reCAPTCHA
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
      // Don't reset showSuccessToast here - let it display
    }
  }, [open]);

  const handleCloseToast = () => {
    setShowSuccessToast(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        disableRestoreFocus={false}
        className={styles.dialog}
        PaperProps={{
          className: styles.paper,
        }}
      >
        <DialogTitle className={styles.title}>
          {onClose && (
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
          <Box className={styles.iconContainer}>
            <PersonAddIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h4" component="div" className={styles.titleText}>
            {t("Create Your Account")}
          </Typography>
        </DialogTitle>

        <ProgressStepper
          steps={steps}
          activeStep={activeStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          allowBackNavigation={true}
        />

        <DialogContent className={styles.content}>
          {promptMessage && (
            <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
              {promptMessage}
            </Alert>
          )}

          {/* Step 1: Country Selection (+ Subject for teachers) */}
          {activeStep === 0 && (
            <Box className={styles.stepContent}>
              <Typography
                variant="h6"
                component="div"
                className={styles.stepTitle}
              >
                {isTeacher
                  ? t("Select Your Country & Subject")
                  : t("Select Your Country")}
              </Typography>

              <CountrySelect
                value={selectedCountry || ""}
                onChange={handleCountrySelect}
                label={t("Country")}
                className={styles.formControl}
                data-testid="country-select"
              />

              {isTeacher && selectedCountry && (
                <>
                  <SubjectSelect
                    value={selectedSubject || ""}
                    onChange={handleSubjectSelect}
                    country={selectedCountry}
                    label={t("Subject")}
                    className={styles.formControl}
                    data-testid="subject-select"
                    sx={{ mt: 3 }}
                  />

                  <EducationalModelSelect
                    value={selectedEducationalModel}
                    onChange={(model) =>
                      setSelectedEducationalModel(model as EducationalModel)
                    }
                    country={selectedCountry}
                    label={t("Educational Model")}
                    className={styles.formControl}
                    data-testid="educational-model-select"
                    showPlaceholder={true}
                    placeholderText={t("Select educational model")}
                    sx={{ mt: 3 }}
                  />
                </>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                className={styles.helpText}
              >
                {isTeacher
                  ? t("Choose your location and primary teaching subject")
                  : t("Choose your country to personalize your experience")}
              </Typography>
            </Box>
          )}

          {/* Step 2: Personal Info */}
          {activeStep === 1 && (
            <Box className={styles.stepContent}>
              <Typography
                variant="h6"
                component="div"
                className={styles.stepTitle}
              >
                {isTeacher ? t("Your Work Information") : t("Your Information")}
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Formik
                initialValues={{
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                }}
                validationSchema={createPersonalInfoSchema(isTeacher)}
                onSubmit={handleSubmit}
              >
                {({ errors, touched, isValid, values }) => (
                  <Form>
                    <Box className={styles.formContainer}>
                      <Field name="name">
                        {({ field }: any) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t("Full Name")}
                            variant="outlined"
                            error={touched.name && Boolean(errors.name)}
                            helperText={touched.name && errors.name}
                            placeholder={t("Enter your full name")}
                            className={styles.textField}
                            sx={{ mb: 2 }}
                            autoFocus
                          />
                        )}
                      </Field>

                      <Field name="email">
                        {({ field }: any) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={
                              isTeacher
                                ? t("Work Email Address")
                                : t("Email Address")
                            }
                            variant="outlined"
                            type="email"
                            error={touched.email && Boolean(errors.email)}
                            helperText={touched.email && errors.email}
                            placeholder={
                              isTeacher
                                ? "your.name@school.edu"
                                : "your.email@example.com"
                            }
                            className={styles.textField}
                            sx={{ mb: 2 }}
                          />
                        )}
                      </Field>

                      <Field name="password">
                        {({ field }: any) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t("Password")}
                            variant="outlined"
                            type="password"
                            error={touched.password && Boolean(errors.password)}
                            helperText={touched.password && errors.password}
                            placeholder={t("At least 6 characters")}
                            className={styles.textField}
                            sx={{ mb: 2 }}
                          />
                        )}
                      </Field>

                      <Field name="confirmPassword">
                        {({ field }: any) => (
                          <TextField
                            {...field}
                            fullWidth
                            label={t("Confirm Password")}
                            variant="outlined"
                            type="password"
                            error={
                              touched.confirmPassword &&
                              Boolean(errors.confirmPassword)
                            }
                            helperText={
                              touched.confirmPassword && errors.confirmPassword
                            }
                            placeholder={t("Re-enter your password")}
                            className={styles.textField}
                          />
                        )}
                      </Field>

                      {/* reCAPTCHA */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          mt: 3,
                          mb: 2,
                        }}
                      >
                        <ReCAPTCHA
                          ref={recaptchaRef}
                          sitekey={
                            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ""
                          }
                          onChange={(token) => {
                            setRecaptchaToken(token);
                            setError("");
                          }}
                          onExpired={() => setRecaptchaToken(null)}
                          onErrored={() => {
                            setRecaptchaToken(null);
                            setError(
                              t(
                                "reCAPTCHA verification failed. Please try again.",
                              ),
                            );
                          }}
                        />
                      </Box>
                    </Box>

                    <DialogActions className={styles.actions}>
                      <Button
                        onClick={handleBack}
                        variant="outlined"
                        className={styles.backButton}
                        startIcon={<ArrowBackIcon />}
                      >
                        {t("Back")}
                      </Button>

                      <Box sx={{ flex: 1 }} />

                      <Button
                        type="submit"
                        variant="contained"
                        className={styles.submitButton}
                        disabled={
                          !isValid ||
                          !values.name ||
                          !values.email ||
                          !values.password ||
                          !recaptchaToken ||
                          loading
                        }
                        startIcon={
                          loading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : undefined
                        }
                      >
                        {loading ? t("Sending Code...") : t("Create Account")}
                      </Button>
                    </DialogActions>
                  </Form>
                )}
              </Formik>
            </Box>
          )}

          {/* Step 3: Email Verification */}
          {activeStep === 2 && (
            <Box className={styles.stepContent}>
              <Typography
                variant="h6"
                component="div"
                className={styles.stepTitle}
              >
                {t("Verify Your Email")}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3, textAlign: "center" }}
              >
                {t("We've sent a 6-digit verification code to")}{" "}
                <strong>{pendingUserData?.email}</strong>
              </Typography>

              <Box className={styles.verificationContainer}>
                <Box className={styles.codeInputGroup}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <TextField
                      key={index}
                      id={`code-input-${index}`}
                      className={styles.codeInput}
                      variant="outlined"
                      inputProps={{
                        maxLength: 1,
                        style: {
                          textAlign: "center",
                          fontSize: "24px",
                          fontWeight: "bold",
                        },
                      }}
                      value={verificationCode[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!/^\d*$/.test(value)) return; // Only digits

                        const newCode = verificationCode.split("");
                        newCode[index] = value;
                        setVerificationCode(newCode.join(""));
                        setVerificationError("");

                        // Auto-focus next input
                        if (value && index < 5) {
                          const nextInput = document.getElementById(
                            `code-input-${index + 1}`,
                          );
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace
                        if (
                          e.key === "Backspace" &&
                          !verificationCode[index] &&
                          index > 0
                        ) {
                          const prevInput = document.getElementById(
                            `code-input-${index - 1}`,
                          );
                          prevInput?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData =
                          e.clipboardData.getData("text/plain");

                        // Extract only digits from pasted content
                        const digits = pastedData.replace(/\D/g, "");

                        if (digits.length > 0) {
                          // Take up to 6 digits
                          const code = digits.substring(0, 6);
                          setVerificationCode(code);
                          setVerificationError("");

                          // Focus the last filled input or the next empty one
                          const nextIndex = Math.min(code.length, 5);
                          const nextInput = document.getElementById(
                            `code-input-${nextIndex}`,
                          );
                          nextInput?.focus();
                        }
                      }}
                      error={Boolean(verificationError)}
                    />
                  ))}
                </Box>

                {verificationError && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 1, display: "block", textAlign: "center" }}
                  >
                    {verificationError}
                  </Typography>
                )}

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 2, display: "block", textAlign: "center" }}
                >
                  {t(
                    "Check the console for your verification code (email sending not yet implemented)",
                  )}
                </Typography>
              </Box>

              <DialogActions className={styles.actions}>
                <Button
                  onClick={handleBack}
                  variant="outlined"
                  className={styles.backButton}
                  startIcon={<ArrowBackIcon />}
                >
                  {t("Back")}
                </Button>

                <Box sx={{ flex: 1 }} />

                <Button
                  onClick={handleVerification}
                  variant="contained"
                  className={styles.submitButton}
                  disabled={verificationCode.length !== 6 || loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : undefined
                  }
                >
                  {loading ? t("Verifying...") : t("Verify & Create Account")}
                </Button>
              </DialogActions>
            </Box>
          )}

          {/* Navigation for non-form steps */}
          {activeStep === 0 && (
            <DialogActions className={styles.actions}>
              <Button
                onClick={handleBack}
                variant="outlined"
                className={styles.backButton}
                startIcon={<ArrowBackIcon />}
              >
                {t("Back to Login")}
              </Button>

              <Box sx={{ flex: 1 }} />

              <Button
                onClick={handleNext}
                variant="contained"
                className={styles.nextButton}
                disabled={!isStep1Complete}
                endIcon={<ArrowForwardIcon />}
              >
                {t("Next")}
              </Button>
            </DialogActions>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Toast - Outside Dialog so it persists after modal closes */}
      <Snackbar
        open={showSuccessToast}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity="success"
          sx={{ width: "100%" }}
        >
          {t("Registration successful! Welcome to EduForger.")}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RegistrationModal;
