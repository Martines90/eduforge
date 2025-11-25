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
  Alert,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { UserProfile } from '@/types/i18n';
import { ProgressStepper, StepConfig } from '@/components/molecules/ProgressStepper';
import styles from './RegistrationModal.module.scss';

export interface RegistrationModalProps {
  open: boolean;
  onRegister: (profile: UserProfile & { password: string }) => void;
  onBack?: () => void;
}

const registrationSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const steps: StepConfig[] = [
  { label: 'Personal Info', description: 'Name and Email' },
  { label: 'Security', description: 'Set Password' },
];

/**
 * RegistrationModal Organism Component
 * Multi-step registration with Formik and Yup validation
 * Shows progress stepper and allows back navigation
 */
export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  open,
  onRegister,
  onBack,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleStepClick = (step: number) => {
    if (step < activeStep || completedSteps.includes(step)) {
      setActiveStep(step);
    }
  };

  const handleSubmit = (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const profile: UserProfile & { password: string } = {
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      registeredAt: new Date().toISOString(),
      password: values.password,
    };
    onRegister(profile);
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
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
        <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
          Join EduForge to create and manage educational tasks
        </Typography>
      </DialogTitle>

      <ProgressStepper
        steps={steps}
        activeStep={activeStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        allowBackNavigation={true}
      />

      <Formik
        initialValues={{
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={registrationSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, isValid, setFieldTouched }) => (
          <Form>
            <DialogContent className={styles.content}>
              <Alert severity="info" sx={{ mb: 3 }}>
                This is a simplified registration. In production, you would integrate with a proper authentication system.
              </Alert>

              {/* Step 1: Personal Info */}
              {activeStep === 0 && (
                <Box className={styles.stepContent}>
                  <Typography variant="h6" className={styles.stepTitle}>
                    Personal Information
                  </Typography>

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
                          label="Email Address"
                          variant="outlined"
                          type="email"
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          placeholder="your.email@example.com"
                          className={styles.textField}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>
              )}

              {/* Step 2: Security */}
              {activeStep === 1 && (
                <Box className={styles.stepContent}>
                  <Typography variant="h6" className={styles.stepTitle}>
                    Set Your Password
                  </Typography>

                  <Box className={styles.formContainer}>
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
                          autoFocus
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
                </Box>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                className={styles.helpText}
              >
                By registering, you agree to our Terms of Service and Privacy Policy
              </Typography>
            </DialogContent>

            <DialogActions className={styles.actions}>
              {/* Back Button */}
              {activeStep === 0 && onBack && (
                <Button
                  onClick={onBack}
                  variant="outlined"
                  className={styles.backButton}
                  startIcon={<ArrowBackIcon />}
                >
                  Back to Login
                </Button>
              )}

              {activeStep > 0 && (
                <Button
                  onClick={() => {
                    setActiveStep(activeStep - 1);
                  }}
                  variant="outlined"
                  className={styles.backButton}
                  startIcon={<ArrowBackIcon />}
                >
                  Back
                </Button>
              )}

              <Box sx={{ flex: 1 }} />

              {/* Next/Submit Button */}
              {activeStep < steps.length - 1 ? (
                <Button
                  onClick={() => {
                    // Touch fields to show validation
                    setFieldTouched('name', true);
                    setFieldTouched('email', true);

                    // Only proceed if step 1 fields are valid
                    if (values.name && values.email && !errors.name && !errors.email) {
                      setCompletedSteps([...completedSteps, activeStep]);
                      setActiveStep(activeStep + 1);
                    }
                  }}
                  variant="contained"
                  className={styles.nextButton}
                  endIcon={<ArrowForwardIcon />}
                  disabled={!values.name || !values.email || Boolean(errors.name) || Boolean(errors.email)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  className={styles.submitButton}
                  disabled={!isValid || !touched.password || !touched.confirmPassword}
                >
                  Create Account
                </Button>
              )}
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default RegistrationModal;
