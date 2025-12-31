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
import { TRIAL_START_CREDITS } from '@/lib/constants/credits';

export default function MySubscriptionPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-teachers to home
  useEffect(() => {
    if (user.isRegistered && user.identity !== 'teacher') {
      router.push('/');
    }
  }, [user.isRegistered, user.identity, router]);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await subscriptionService.getSubscriptionPlans();
        if (response.success) {
          setPlans(response.data.plans);
        }
      } catch (err: any) {
        console.error('Failed to fetch plans:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

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
    if (!subscription) return 'No Active Plan';
    switch (subscription.tier) {
      case 'trial':
        return 'Trial Plan';
      case 'basic':
        return 'Basic Plan';
      case 'normal':
        return 'Normal Plan';
      case 'pro':
        return 'Pro Plan';
      default:
        return 'No Active Plan';
    }
  };

  // Get status chip
  const getStatusChip = () => {
    if (!subscription) return null;
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

  // Handle upgrade click
  const handleUpgrade = async (tier: string) => {
    if (!user.profile?.token) {
      setError('Please log in to upgrade');
      return;
    }

    setCheckoutLoading(tier);
    setError(null);

    try {
      const response = await subscriptionService.createCheckoutSession(
        tier as any,
        user.profile.token
      );

      if (response.success) {
        // Redirect to checkout
        window.location.href = response.data.url;
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  // Get tier badge color
  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic':
        return '#4CAF50';
      case 'normal':
        return '#2196F3';
      case 'pro':
        return '#9C27B0';
      default:
        return '#757575';
    }
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
                  {t('You have {{count}} task generation credits remaining.').replace('{{count}}', credits.toString())}
                </Typography>
                {credits < TRIAL_START_CREDITS && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {t('Running low on credits? Upgrade your plan to get more!')}
                  </Alert>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Subscription Plans */}
          {subscription?.tier === 'trial' && (
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ mb: 3, mt: 2 }}>
                {t('Upgrade Your Plan')}
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {plans.map((plan) => (
                    <Grid item xs={12} md={4} key={plan.id}>
                      <Card
                        elevation={3}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          border: plan.id === 'normal' ? `2px solid ${getTierColor('normal')}` : 'none',
                        }}
                      >
                        {plan.id === 'normal' && (
                          <Chip
                            label={t('Most Popular')}
                            color="primary"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                            }}
                          />
                        )}
                        <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                          <Typography variant="h5" component="div" gutterBottom sx={{ color: getTierColor(plan.id) }}>
                            {plan.name}
                          </Typography>
                          <Typography variant="h3" component="div" sx={{ my: 2 }}>
                            €{plan.price}
                            <Typography variant="body2" component="span" color="text.secondary">
                              /{t('year')}
                            </Typography>
                          </Typography>

                          <List dense>
                            {plan.features.viewDownloadTasks && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('View/download task library')}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            )}

                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <CheckCircleIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={t('{{count}} custom task collections', {
                                  count: plan.features.customTaskCollections === 'unlimited'
                                    ? t('Unlimited')
                                    : plan.features.customTaskCollections.toString(),
                                })}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItem>

                            {plan.features.taskCreationCredits > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('{{count}} task generation credits', {
                                    count: plan.features.taskCreationCredits.toLocaleString(),
                                  })}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.emailSupport && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('{{time}} email support', {
                                    time: plan.features.supportResponseTime,
                                  })}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.creatorContests && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('Creator contests access')}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.discordAccess && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('Private Discord channel')}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.webstoreDiscount > 0 && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('{{discount}}% webstore discount', {
                                    discount: plan.features.webstoreDiscount,
                                  })}
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.schoolLicense && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('Add up to {{count}} teachers', {
                                    count: plan.features.additionalTeachers,
                                  })}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                                />
                              </ListItem>
                            )}

                            {plan.features.schoolContest && (
                              <ListItem sx={{ px: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={t('Best School of the Year contest')}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                                />
                              </ListItem>
                            )}
                          </List>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="primary"
                            size="large"
                            fullWidth
                            disabled={checkoutLoading !== null}
                            onClick={() => handleUpgrade(plan.id)}
                            sx={{
                              backgroundColor: getTierColor(plan.id),
                              '&:hover': {
                                backgroundColor: getTierColor(plan.id),
                                opacity: 0.9,
                              },
                            }}
                          >
                            {checkoutLoading === plan.id ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              t('Upgrade to {{name}}', { name: plan.name })
                            )}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </Grid>
      </Container>
    </AuthenticatedPage>
  );
}
