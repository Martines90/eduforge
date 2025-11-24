'use client';

import Link from 'next/link';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';

export default function Home() {
  const { t } = useTranslation();

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
          <Typography variant="h1" component="h1" gutterBottom>
            EduForge
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            {t('Task Creator')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('Create educational tasks based on curriculum topics for grades 9-12')}
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Link href="/task_creator" passHref legacyBehavior>
              <Button variant="primary" size="large">
                {t('Go to Task Creator')}
              </Button>
            </Link>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
