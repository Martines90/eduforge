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
  IconButton,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { ForgotPasswordModal } from '../ForgotPasswordModal';
import { useTranslation } from '@/lib/i18n';
import { Translations } from '@/types/i18n';
import styles from './LoginModal.module.scss';

export interface LoginModalProps {
  open: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateAccount: (isTeacher: boolean) => void;
  onClose?: () => void;
  promptMessage?: string;
}

// Schema will be created inside the component to access t() function
const createLoginSchema = (t: (key: keyof Translations, params?: Record<string, string | number>) => string) => Yup.object().shape({
  email: Yup.string()
    .email(t('Please enter a valid email address' as any))
    .required(t('Email is required' as any)),
  password: Yup.string()
    .min(6, t('Password must be at least 6 characters' as any))
    .required(t('Password is required' as any)),
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
  onClose,
  promptMessage,
}) => {
  const { t } = useTranslation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Create schema with translations
  const loginSchema = createLoginSchema(t);

  const handleSubmit = async (
    values: { email: string; password: string },
    { setSubmitting }: any
  ) => {
    try {
      setLoginError(null);
      await onLogin(values.email, values.password);
    } catch (error: any) {
      setLoginError(error.message || t('Login failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
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
          <LoginIcon sx={{ fontSize: 48 }} />
        </Box>
        <Typography variant="h4" component="div" className={styles.titleText}>
          {t('Welcome to EduForger')}
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
              {promptMessage && (
                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  {promptMessage}
                </Alert>
              )}

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
                      label={t('Email Address')}
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
                      label={t('Password')}
                      variant="outlined"
                      type="password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      placeholder={t('Enter your password')}
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
                  {t('Forgot password?')}
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
                {isSubmitting ? t('Signing in...') : t('Sign In')}
              </Button>
            </Form>
          )}
        </Formik>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('OR')}
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
            {t('Create Teacher Account')}
          </Button>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            className={styles.createAccountButton}
            onClick={() => onCreateAccount(false)}
            startIcon={<PersonAddIcon />}
          >
            {t('Create Account')}
          </Button>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          className={styles.helpText}
        >
          {t('By continuing, you agree to our Terms of Service and Privacy Policy')}
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
