'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, Paper } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { Button } from '@/components/atoms/Button';

/**
 * 403 Unauthorized page
 * Shown when a user tries to access a route they don't have permission for
 *
 * Common scenarios:
 * - Non-teacher trying to access /task_creator
 * - Unauthenticated user trying to access protected routes
 */
export default function Unauthorized() {
  const router = useRouter();

  return (
    <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 6 },
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <BlockIcon
              sx={{
                fontSize: 100,
                color: 'warning.main',
                opacity: 0.8,
              }}
            />
          </Box>
          <Typography variant="h1" component="h1" gutterBottom>
            403
          </Typography>
          <Typography variant="h5" component="div" color="text.secondary" paragraph>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don&apos;t have permission to access this page. This may be because:
          </Typography>
          <Box
            component="ul"
            sx={{
              textAlign: 'left',
              display: 'inline-block',
              color: 'text.secondary',
              mb: 3,
            }}
          >
            <li>You need to be logged in as a teacher to access this feature</li>
            <li>Your account type doesn&apos;t have access to this resource</li>
            <li>You need to log in first</li>
          </Box>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="large"
              onClick={() => router.back()}
            >
              Go Back
            </Button>
            <Link href="/" passHref legacyBehavior>
              <Button variant="primary" size="large">
                Go to Home
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
