'use client';

import { Container, Typography, Box, Paper, Alert } from '@mui/material';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import CancelIcon from '@mui/icons-material/Cancel';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Button } from '@/components/atoms/Button';

function CancelPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if it's a payment failure or user cancellation
  const errorMessage = searchParams.get('error');
  const isCancelled = searchParams.get('cancelled') === 'true';

  return (
    <AuthenticatedPage>
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
          }}
        >
          <Box sx={{ mb: 3 }}>
            {isCancelled ? (
              <CancelIcon sx={{ fontSize: 80, color: '#ff9800', mb: 2 }} />
            ) : (
              <ErrorOutlineIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
            )}
          </Box>

          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#424242' }}>
            {isCancelled ? t('Payment Cancelled') : t('Payment Failed')}
          </Typography>

          <Typography variant="h6" sx={{ mb: 3, color: '#616161' }}>
            {isCancelled
              ? t('You cancelled the payment process')
              : t('There was a problem processing your payment')}
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{t('Error Details')}:</strong> {errorMessage}
              </Typography>
            </Alert>
          )}

          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: 2,
              p: 3,
              mb: 4,
            }}
          >
            <Typography variant="h6" gutterBottom color="text.primary">
              {isCancelled ? t('What happened?') : t('What went wrong?')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {isCancelled
                ? t('You chose to cancel the subscription checkout process. No charges were made to your account.')
                : t('The payment could not be completed. This might be due to:')}
            </Typography>
            {!isCancelled && (
              <Box component="ul" sx={{ textAlign: 'left', pl: 4 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    {t('Insufficient funds in your account')}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    {t('Card details were entered incorrectly')}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    {t('Your bank declined the transaction')}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    {t('Technical issue with the payment provider')}
                  </Typography>
                </li>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="primary"
              size="large"
              onClick={() => router.push('/my-subscription')}
              sx={{
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#5568d3',
                },
              }}
            >
              {t('Try Again')}
            </Button>

            <Button
              variant="secondary"
              size="large"
              onClick={() => router.push('/')}
              sx={{
                backgroundColor: 'white',
                color: '#424242',
                border: '2px solid #e0e0e0',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              {t('Go to Home')}
            </Button>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t('Need help? Contact our support team at')}{' '}
              <a href="mailto:support@eduforge.com" style={{ color: '#667eea', textDecoration: 'none' }}>
                support@eduforge.com
              </a>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </AuthenticatedPage>
  );
}

export default function SubscriptionCancelPage() {
  return (
    <Suspense fallback={
      <AuthenticatedPage>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5">{}</Typography>
          </Paper>
        </Container>
      </AuthenticatedPage>
    }>
      <CancelPageContent />
    </Suspense>
  );
}
