'use client';

import Link from 'next/link';
import { Container, Typography, Box, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Button } from '@/components/atoms/Button';

/**
 * 404 Not Found page
 * Automatically shown by Next.js when a route doesn't exist
 */
export default function NotFound() {
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
            <ErrorOutlineIcon
              sx={{
                fontSize: 100,
                color: 'error.main',
                opacity: 0.8,
              }}
            />
          </Box>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            The page you are looking for doesn&apos;t exist or has been moved.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Link href="/" passHref legacyBehavior>
              <Button variant="primary" size="large">
                Go to Home
              </Button>
            </Link>
            <Link href="/task_creator" passHref legacyBehavior>
              <Button variant="secondary" size="large">
                Go to Task Creator
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
