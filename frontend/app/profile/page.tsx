'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Alert,
  Divider,
  Grid,
  Avatar,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PublicIcon from '@mui/icons-material/Public';
import SchoolIcon from '@mui/icons-material/School';
import LockIcon from '@mui/icons-material/Lock';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useUser } from '@/lib/context';
import { useTranslation } from '@/lib/i18n';

/**
 * User Profile Page
 * Displays user information and allows password change
 */
export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const { t } = useTranslation();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message={t('Loading profile...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const validatePasswordChange = () => {
    const { oldPassword, newPassword, confirmPassword } = passwordData;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('All password fields are required'));
      return false;
    }

    if (newPassword.length < 8) {
      setPasswordError(t('New password must be at least 8 characters long'));
      return false;
    }

    if (newPassword === oldPassword) {
      setPasswordError(t('New password must be different from old password'));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('New passwords do not match'));
      return false;
    }

    return true;
  };

  const handleSubmitPasswordChange = async () => {
    if (!validatePasswordChange()) {
      return;
    }

    setIsSubmitting(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // TODO: Implement backend API call for password change
      // const response = await apiService.changePassword({
      //   oldPassword: passwordData.oldPassword,
      //   newPassword: passwordData.newPassword,
      // });

      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setPasswordSuccess(t('Password changed successfully!'));
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsChangingPassword(false);

      // TODO: Remove this alert once backend is implemented
      alert(t('Password change functionality will be implemented with backend API'));
    } catch (error) {
      setPasswordError(t('Failed to change password. Please check your old password and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleDisplay = () => {
    if (user.identity === 'teacher') {
      return t('Teacher');
    }
    return t('Student / General User');
  };

  const getInitials = () => {
    if (user.profile?.name) {
      const names = user.profile.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    return user.profile?.email ? user.profile.email[0].toUpperCase() : 'U';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header with Avatar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: '2.5rem',
              bgcolor: 'primary.main',
              mb: 2,
            }}
          >
            {getInitials()}
          </Avatar>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('My Profile')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('View and manage your account information')}
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* User Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonIcon color="primary" />
            {t('Personal Information')}
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('Name')}
                </Typography>
              </Box>
              <Typography variant="body1">{user.profile?.name || t('Not provided')}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('Email')}
                </Typography>
              </Box>
              <Typography variant="body1">{user.profile?.email || t('Not provided')}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SchoolIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('Role')}
                </Typography>
              </Box>
              <Typography variant="body1">{getRoleDisplay()}</Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PublicIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {t('Country')}
                </Typography>
              </Box>
              <Typography variant="body1">{user.country || t('Not provided')}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Password Change Section */}
        <Box>
          <Typography variant="h6" component="div" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LockIcon color="primary" />
            {t('Password & Security')}
          </Typography>

          {!isChangingPassword ? (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                {t('Keep your account secure by changing your password regularly.')}
              </Typography>
              <Button
                variant="secondary"
                onClick={() => setIsChangingPassword(true)}
              >
                {t('Change Password')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}

              <TextField
                fullWidth
                type="password"
                label={t('Current Password')}
                value={passwordData.oldPassword}
                onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                disabled={isSubmitting}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="password"
                label={t('New Password')}
                value={passwordData.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                disabled={isSubmitting}
                helperText={t('Must be at least 8 characters long')}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                type="password"
                label={t('Confirm New Password')}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                disabled={isSubmitting}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="primary"
                  onClick={handleSubmitPasswordChange}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('Changing Password...') : t('Change Password')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({
                      oldPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  disabled={isSubmitting}
                >
                  {t('Cancel')}
                </Button>
              </Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="secondary" onClick={() => router.push('/')}>
            {t('Back to Home')}
          </Button>
          {user.identity === 'teacher' && (
            <Button variant="primary" onClick={() => router.push('/my-tasks')}>
              {t('View My Tasks')}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
