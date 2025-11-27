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
  Divider,
  Link as MuiLink,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { ForgotPasswordModal } from '../ForgotPasswordModal';
import styles from './LoginModal.module.scss';

export interface LoginModalProps {
  open: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateAccount: (isTeacher: boolean) => void;
}

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

/**
 * LoginModal Organism Component
 * First screen shown to non-authenticated users
 * Offers login or account creation
 */
export const LoginModal: React.FC<LoginModalProps> = ({
  open,
  onLogin,
  onCreateAccount,
}) => {
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: any
  ) => {
    try {
      setLoginError(null);
      await onLogin(values.email, values.password);
    } catch (error: any) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        className={styles.dialog}
        PaperProps={{
          className: styles.paper,
        }}
      >
      <DialogTitle className={styles.title}>
        <Box className={styles.iconContainer}>
          <LoginIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="div" className={styles.titleText}>
          Welcome to EduForge
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              {loginError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {loginError}
                </Alert>
              )}

              <Box className={styles.formContainer}>
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
                      placeholder="Enter your password"
                      className={styles.textField}
                    />
                  )}
                </Field>
              </Box>

              <Box className={styles.forgotPassword}>
                <MuiLink
                  component="button"
                  type="button"
                  variant="body2"
                  className={styles.link}
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotPasswordOpen(true);
                  }}
                >
                  Forgot password?
                </MuiLink>
              </Box>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                className={styles.loginButton}
                disabled={isSubmitting}
                startIcon={<LoginIcon />}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form>
          )}
        </Formik>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            OR
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            className={styles.createTeacherButton}
            onClick={() => onCreateAccount(true)}
            startIcon={<PersonAddIcon />}
          >
            Create Teacher Account
          </Button>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            className={styles.createAccountButton}
            onClick={() => onCreateAccount(false)}
            startIcon={<PersonAddIcon />}
          >
            Create Account
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          className={styles.helpText}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </DialogContent>
    </Dialog>

    <ForgotPasswordModal
      open={forgotPasswordOpen}
      onClose={() => setForgotPasswordOpen(false)}
    />
    </>
  );
};

export default LoginModal;
