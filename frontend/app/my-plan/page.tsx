'use client';

import { Container, Typography, Box, Paper, Grid, Chip, List, ListItem, ListItemIcon, ListItemText, Card, CardContent, CardActions, Alert, CircularProgress } from '@mui/material';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import { useUser } from '@/lib/context';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button } from '@/components/atoms/Button';
import * as subscriptionService from '@/lib/services/subscription.service';
import type { SubscriptionPlan } from '@/types/subscription';

/**
 * My Plan Page - For Non-Teacher Users (Parents/Students)
 * Non-teachers can only subscribe to the BASIC plan
 * They get 100 free task generation credits
 */
export default function MyPlanPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const [basicPlan, setBasicPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect teachers to /my-subscription
  useEffect(() => {
    if (user.isRegistered && user.identity === 'teacher') {
      router.push('/my-subscription');
    }
  }, [user.isRegistered, user.identity, router]);

  // Fetch ONLY the basic plan
  useEffect(() => {
    const fetchBasicPlan = async () => {
      try {
        const response = await subscriptionService.getSubscriptionPlans();
        if (response.success) {
          // Filter to only show Basic plan
          const basic = response.data.plans.find(p => p.id === 'basic');
          setBasicPlan(basic || null);
        }
      } catch (err: any) {
        console.error('Failed to fetch plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBasicPlan();
  }, []);

  if (!user.isRegistered || user.identity === 'teacher') {
    return null;
  }

  const subscription = user.subscription;
  const credits = user.taskCredits ?? 100; // Non-teachers get 100 free credits

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get plan display name
  const getPlanName = () => {
    if (!subscription) return 'Free Plan';
    return 'Basic Plan';
  };

  // Get status chip
  const getStatusChip = () => {
    if (!subscription) {
      return <Chip label="Free" color="default" size="small" />;
    }

    let color: 'success' | 'error' | 'warning' | 'default' = 'default';
    let label = '';

    switch (subscription.status) {
      case 'active':
        color = 'success';
        label = 'Active';
        break;
      case 'expired':
        color = 'error';
        label = 'Expired';
        break;
      case 'cancelled':
        color = 'warning';
        label = 'Cancelled';
        break;
      case 'past_due':
        color = 'warning';
        label = 'Past Due';
        break;
    }

    return <Chip label={label} color={color} size="small" />;
  };

  // Handle subscribe click
  const handleSubscribe = async () => {
    if (!user.profile?.token) {
      setError('Please log in to subscribe');
      return;
    }

    if (!basicPlan) {
      setError('Basic plan not available');
      return;
    }

    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await subscriptionService.createCheckoutSession(
        'basic',
        user.profile.token
      );

      if (response.success) {
        // Redirect to checkout
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
      setCheckoutLoading(false);
    }
  };

  return (
    <AuthenticatedPage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('My Plan')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage your subscription and credits')}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

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
                {subscription && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('Subscription Period')}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Started')}:</strong> {formatDate(subscription.startDate)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>{t('Expires')}:</strong> {formatDate(subscription.endDate)}
                    </Typography>
                    {subscription.cancelAtPeriodEnd && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        {t('Subscription will be cancelled at the end of the current period')}
                      </Alert>
                    )}
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
                  {t('You started with 100 free task generation credits.')}
                </Typography>
                {credits < 20 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t('Running low on credits? Subscribe to Basic plan for unlimited browsing!')}
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Basic Plan Subscription - Only show if not subscribed */}
          {!subscription && (
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 3, mt: 2 }}>
                {t('Upgrade to Basic Plan')}
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : basicPlan ? (
                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} md={6}>
                    <Card
                      elevation={3}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '2px solid #4CAF50',
                      }}
                    >
                      <Chip
                        label={t('Recommended')}
                        color="success"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                        }}
                      />
                      <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                        <Typography variant="h5" component="div" gutterBottom sx={{ color: '#4CAF50' }}>
                          {basicPlan.name}
                        </Typography>
                        <Typography variant="h3" component="div" sx={{ my: 2 }}>
                          €{basicPlan.price}
                          <Typography variant="body2" component="span" color="text.secondary">
                            /{t('year')}
                          </Typography>
                        </Typography>

                        <List dense>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t('Unlimited task browsing')}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            />
                          </ListItem>

                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t('Download tasks as PDF')}
                              primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                            />
                          </ListItem>

                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t('Access to all subjects')}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>

                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t('All difficulty levels')}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>

                          <ListItem sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={t('Email support')}
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItem>
                        </List>

                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>{t('Note')}:</strong> {t('This plan is for browsing and downloading tasks only. Task generation credits are not included.')}
                          </Typography>
                        </Alert>
                      </CardContent>
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="primary"
                          size="large"
                          fullWidth
                          disabled={checkoutLoading}
                          onClick={handleSubscribe}
                          sx={{
                            backgroundColor: '#4CAF50',
                            '&:hover': {
                              backgroundColor: '#4CAF50',
                              opacity: 0.9,
                            },
                          }}
                        >
                          {checkoutLoading ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            t('Subscribe to Basic Plan')
                          )}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="warning">
                  {t('Basic plan is currently unavailable. Please try again later.')}
                </Alert>
              )}
            </Grid>
          )}
        </Grid>
      </Container>
    </AuthenticatedPage>
  );
}
