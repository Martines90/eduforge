'use client';

import React, { useState } from 'react';
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
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { CountryCode, UserIdentity, Subject, UserProfile } from '@/types/i18n';
import { ProgressStepper, StepConfig } from '@/components/molecules/ProgressStepper';
import { countries } from '@/lib/i18n/countries';
import { SUBJECTS, getSubjectsForCountry } from '@/lib/data/subjects';
import styles from './RegistrationModal.module.scss';

export interface RegistrationModalProps {
  open: boolean;
  onRegister: (profile: UserProfile & { password: string; country: CountryCode; identity: UserIdentity; subject?: Subject }) => void;
  onBack?: () => void;
  detectedCountry?: CountryCode;
  isTeacher: boolean;
}

// Common personal email domains to block for teacher accounts
const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
  'me.com',
  'msn.com',
];

const createPersonalInfoSchema = (isTeacher: boolean) => Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required')
    .test('work-email', 'Please use a work or school email address, not a personal email', function(value) {
      if (!isTeacher || !value) return true;

      const domain = value.split('@')[1]?.toLowerCase();
      if (!domain) return true;

      return !PERSONAL_EMAIL_DOMAINS.includes(domain);
    }),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

// Teacher flow: Country & Subject → Personal Info (2 steps)
// Non-teacher flow: Country → Personal Info (2 steps)
const teacherSteps: StepConfig[] = [
  { label: 'Country & Subject', description: 'Location and expertise' },
  { label: 'Personal Info', description: 'Name and Email' },
];

const nonTeacherSteps: StepConfig[] = [
  { label: 'Country', description: 'Select your location' },
  { label: 'Personal Info', description: 'Name and Email' },
];

/**
 * RegistrationModal Organism Component
 * Multi-step registration with progress roadmap
 * Full screen on mobile devices
 */
export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onRegister,
  onBack,
  detectedCountry,
  isTeacher,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Registration state
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const steps = isTeacher ? teacherSteps : nonTeacherSteps;

  const handleStepClick = (step: number) => {
    if (step < activeStep || completedSteps.includes(step)) {
      setActiveStep(step);
    }
  };

  // Step 1: Country Selection (and Subject for teachers)
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
  };

  const handleSubjectSelect = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleNext = () => {
    setCompletedSteps([...completedSteps, 0]);
    setActiveStep(1);
  };

  const isStep1Complete = isTeacher
    ? selectedCountry !== null && selectedSubject !== null
    : selectedCountry !== null;

  // Final Step: Personal Info Submission
  const handleSubmit = (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (!selectedCountry) return;
    if (isTeacher && !selectedSubject) return;

    const identity: UserIdentity = isTeacher ? 'teacher' : 'non-teacher';

    const profile: UserProfile & { password: string; country: CountryCode; identity: UserIdentity; subject?: Subject } = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      registeredAt: new Date().toISOString(),
      password: values.password,
      country: selectedCountry,
      identity: identity,
      ...(isTeacher && selectedSubject ? { subject: selectedSubject } : {}),
    };

    onRegister(profile);
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      className={styles.dialog}
      PaperProps={{
        className: styles.paper,
      }}
    >
      <DialogTitle className={styles.title}>
        <Box className={styles.iconContainer}>
          <PersonAddIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="h2" className={styles.titleText}>
          Create Your Account
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
        {/* Step 1: Country Selection (+ Subject for teachers) */}
        {activeStep === 0 && (
          <Box className={styles.stepContent}>
            <Typography variant="h6" className={styles.stepTitle}>
              {isTeacher ? 'Select Your Country & Subject' : 'Select Your Country'}
            </Typography>

            <FormControl fullWidth className={styles.formControl}>
              <InputLabel>Country</InputLabel>
              <Select
                value={selectedCountry || ''}
                onChange={(e) => handleCountrySelect(e.target.value as CountryCode)}
                label="Country"
                className={styles.select}
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span style={{ fontSize: '1.5rem' }}>{country.flag}</span>
                      <span>{country.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isTeacher && selectedCountry && (
              <FormControl fullWidth className={styles.formControl} sx={{ mt: 2 }}>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={selectedSubject || ''}
                  onChange={(e) => handleSubjectSelect(e.target.value as Subject)}
                  label="Subject"
                  className={styles.select}
                >
                  {getSubjectsForCountry(selectedCountry).map((subject) => (
                    <MenuItem key={subject.value} value={subject.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span style={{ fontSize: '1.5rem' }}>{subject.emoji}</span>
                        <span>{subject.label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              className={styles.helpText}
            >
              {isTeacher
                ? 'Choose your location and primary teaching subject'
                : 'Choose your country to personalize your experience'}
            </Typography>
          </Box>
        )}

        {/* Step 2: Personal Info */}
        {activeStep === 1 && (
          <Box className={styles.stepContent}>
            <Typography variant="h6" className={styles.stepTitle}>
              {isTeacher ? 'Your Work Information' : 'Your Information'}
            </Typography>

            <Formik
              initialValues={{
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
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
                          label="Full Name"
                          variant="outlined"
                          error={touched.name && Boolean(errors.name)}
                          helperText={touched.name && errors.name}
                          placeholder="Enter your full name"
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
                          label={isTeacher ? 'Work Email Address' : 'Email Address'}
                          variant="outlined"
                          type="email"
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          placeholder={isTeacher ? 'your.name@school.edu' : 'your.email@example.com'}
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
                          label="Password"
                          variant="outlined"
                          type="password"
                          error={touched.password && Boolean(errors.password)}
                          helperText={touched.password && errors.password}
                          placeholder="At least 6 characters"
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
                          label="Confirm Password"
                          variant="outlined"
                          type="password"
                          error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          placeholder="Re-enter your password"
                          className={styles.textField}
                        />
                      )}
                    </Field>
                  </Box>

                  <DialogActions className={styles.actions}>
                    <Button
                      onClick={handleBack}
                      variant="outlined"
                      className={styles.backButton}
                      startIcon={<ArrowBackIcon />}
                    >
                      Back
                    </Button>

                    <Box sx={{ flex: 1 }} />

                    <Button
                      type="submit"
                      variant="contained"
                      className={styles.submitButton}
                      disabled={!isValid || !values.name || !values.email || !values.password}
                    >
                      Create Account
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
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
              Back to Login
            </Button>

            <Box sx={{ flex: 1 }} />

            <Button
              onClick={handleNext}
              variant="contained"
              className={styles.nextButton}
              disabled={!isStep1Complete}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          </DialogActions>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationModal;
