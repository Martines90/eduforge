'use client';

import { Container, Typography, Box, Paper, CircularProgress, Alert } from '@mui/material';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import { useUser } from '@/lib/context';
import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Button } from '@/components/atoms/Button';
import * as subscriptionService from '@/lib/services/subscription.service';

function SuccessPageContent() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<string | null>(null);

  useEffect(() => {
    const processCheckout = async () => {
      const sessionId = searchParams.get('session_id');
      const isMock = searchParams.get('mock') === 'true';
      const tierParam = searchParams.get('tier');

      if (!sessionId) {
        setError('Missing session ID');
        setProcessing(false);
        return;
      }

      // Extract tier from session ID for mock payments (format: mock_session_timestamp_userId)
      // Or from URL parameter
      const extractedTier = tierParam || (sessionId.includes('mock') ? 'normal' : null);
      if (extractedTier) {
        setTier(extractedTier);
      }

      try {
        // For mock payments, we need to call the backend to activate
        if (isMock && user.profile?.token) {
          // In mock mode, we need userId and tier
          // Parse from sessionId or get from user
          const userId = user.profile.token; // We have the user's token

          await subscriptionService.handleCheckoutSuccess(
            sessionId,
            userId,
            extractedTier as any
          );

          // Wait for backend to process
          await new Promise(resolve => setTimeout(resolve, 1500));

          // The page will show success, user can refresh or navigate away
          setProcessing(false);
        } else {
          // Real Stripe - webhook will handle activation
          // Just show success message
          setProcessing(false);
        }
      } catch (err: any) {
        console.error('Checkout success error:', err);
        setError(err.message);
        setProcessing(false);
      }
    };

    // Only process if we have a session_id
    if (searchParams.get('session_id') && user.profile) {
      processCheckout();
    } else if (searchParams.get('session_id')) {
      // Wait for user to load
      const timer = setTimeout(() => {
        if (!user.profile) {
          setError('Please log in to complete subscription');
          setProcessing(false);
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setProcessing(false);
    }
  }, [searchParams, user.profile]);

  // Determine where to redirect based on subscription tier
  const getRedirectInfo = () => {
    const currentTier = user.subscription?.tier;

    switch (currentTier) {
      case 'basic':
        return {
          title: t('Explore EduForge'),
          description: t('Browse and download tasks from our extensive library'),
          buttonText: t('Get Started'),
          route: '/', // TODO: Change to '/tasks' when task library page is created
        };
      case 'normal':
        return {
          title: t('Create Your First Task'),
          description: t('Use your 1,000 credits to start generating custom tasks'),
          buttonText: t('Create Task'),
          route: '/task-generator',
        };
      case 'pro':
        return {
          title: t('Add Teachers to Your School'),
          description: t('Invite up to 10 teachers from your school to join'),
          buttonText: t('Add Teachers'),
          route: '/school/teachers', // Placeholder route
        };
      default:
        return {
          title: t('Get Started'),
          description: t('Explore EduForge features'),
          buttonText: t('Go to Dashboard'),
          route: '/',
        };
    }
  };

  const redirectInfo = getRedirectInfo();

  if (error) {
    return (
      <AuthenticatedPage>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
            <Button
              variant="primary"
              onClick={() => router.push('/my-subscription')}
            >
              {t('Back to Subscription')}
            </Button>
          </Paper>
        </Container>
      </AuthenticatedPage>
    );
  }

  if (processing) {
    return (
      <AuthenticatedPage>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              {t('Processing Your Subscription...')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('Please wait while we activate your subscription')}
            </Typography>
          </Paper>
        </Container>
      </AuthenticatedPage>
    );
  }

  return (
    <AuthenticatedPage>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'white', mb: 2 }} />
          </Box>

          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('Welcome to EduForge!')}
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, opacity: 0.9 }}>
            {t('Subscription Activated Successfully')}
          </Typography>

          <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
            {t('Your {{plan}} plan is now active', {
              plan: user.subscription?.tier === 'basic'
                ? t('Basic')
                : user.subscription?.tier === 'normal'
                ? t('Normal')
                : user.subscription?.tier === 'pro'
                ? t('Pro')
                : '',
            })}
          </Typography>

          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              p: 3,
              mb: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>
              {t('Your Credits')}
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
              {user.taskCredits?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('Task Generation Credits Available')}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {redirectInfo.title}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
              {redirectInfo.description}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="large"
              onClick={() => router.push(redirectInfo.route)}
              sx={{
                backgroundColor: 'white',
                color: '#667eea',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              {redirectInfo.buttonText}
            </Button>

            <Button
              variant="secondary"
              size="large"
              onClick={() => router.push('/my-subscription')}
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              {t('View Subscription')}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('Thank you for choosing EduForge. We sent a confirmation email to your inbox.')}
          </Typography>
        </Box>
      </Container>
    </AuthenticatedPage>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <AuthenticatedPage>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={60} />
          </Paper>
        </Container>
      </AuthenticatedPage>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}
