'use client';

import { Container, Typography, Box, Paper, Grid, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import { useUser } from '@/lib/context';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button } from '@/components/atoms/Button';

export default function MySubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();

  // Redirect non-teachers to home
  useEffect(() => {
    if (user.isRegistered && user.identity !== 'teacher') {
      router.push('/');
    }
  }, [user.isRegistered, user.identity, router]);

  if (!user.isRegistered || user.identity !== 'teacher') {
    return null;
  }

  const subscription = user.subscription;
  const credits = user.taskCredits ?? 0;

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get plan display name
  const getPlanName = () => {
    if (!subscription) return t('No Active Plan');
    switch (subscription.plan) {
      case 'trial':
        return t('Trial Plan');
      case 'annual':
        return t('Annual Plan');
      default:
        return t('No Active Plan');
    }
  };

  // Get status display
  const getStatusChip = () => {
    if (!subscription) return null;
    let color: 'success' | 'error' | 'default' = 'default';
    let label = '';

    switch (subscription.status) {
      case 'active':
        color = 'success';
        label = t('Active');
        break;
      case 'expired':
        color = 'error';
        label = t('Expired');
        break;
      case 'cancelled':
        color = 'default';
        label = t('Cancelled');
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  return (
    <AuthenticatedPage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('Manage Your Subscription')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('View and manage your subscription plan and credits')}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Current Plan Card */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('Current Plan')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" color="primary" gutterBottom>
                  {getPlanName()}
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" component="span" sx={{ mr: 1 }}>
                    {t('Status')}:
                  </Typography>
                  {getStatusChip()}
                </Box>
                {subscription?.plan === 'trial' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('Trial Period')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Started')}:</strong> {formatDate(subscription.trialStartDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Expires')}:</strong> {formatDate(subscription.trialEndDate)}
                    </Typography>
                  </Box>
                )}
                {subscription?.plan === 'annual' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('Subscription Period')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Started')}:</strong> {formatDate(subscription.annualStartDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Expires')}:</strong> {formatDate(subscription.annualEndDate)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Task Credits Card */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {t('Task Generation Credits')}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h5" color="secondary" gutterBottom>
                  {t('Remaining Credits')}: {credits}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('You have {{count}} task generation credits remaining.').replace('{{count}}', credits.toString())}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Annual Subscription Upgrade Card */}
          {subscription?.plan === 'trial' && (
            <Grid item xs={12}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5" gutterBottom>
                      {t('Annual Subscription')}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {t('Subscribe to our annual plan for unlimited access to all features.')}
                    </Typography>
                    <List dense>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ color: 'white' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Unlimited task generation')}
                          primaryTypographyProps={{ color: 'inherit' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ color: 'white' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Priority support')}
                          primaryTypographyProps={{ color: 'inherit' }}
                        />
                      </ListItem>
                      <ListItem sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ color: 'white' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={t('Early access to new features')}
                          primaryTypographyProps={{ color: 'inherit' }}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
                    <Button
                      variant="primary"
                      size="large"
                      disabled
                      fullWidth
                      sx={{
                        backgroundColor: 'white',
                        color: '#667eea',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        }
                      }}
                    >
                      {t('Coming Soon')}
                    </Button>
                    <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.9 }}>
                      {t('Annual subscription will be available soon. Stay tuned!')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </AuthenticatedPage>
  );
}
