'use client';

import Link from 'next/link';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

export default function Home() {
  const { t } = useTranslation();
  const { user } = useUser();

  const isTeacher = user.identity === 'teacher';
  const isNonTeacher = user.identity === 'non-teacher';

  return (
    <AuthenticatedPage>
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
        <Typography variant="h1" component="h1" gutterBottom textAlign="center">
          EduForge
        </Typography>
        <Typography variant="h5" component="div" color="text.secondary" paragraph textAlign="center" mb={4}>
          {t('Educational Task Platform')}
        </Typography>

        <Grid container spacing={3} maxWidth={800}>
          {/* Create Task Card - Only for teachers */}
          {isTeacher && (
            <Grid item xs={12} md={6}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h5" component="h2" gutterBottom>
                    {t('Create Task')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {t('Create educational tasks based on curriculum topics for grades 9-12')}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Link href="/task_creator" passHref legacyBehavior>
                    <Button variant="primary" size="large" fullWidth>
                      {t('Go to Task Creator')}
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Search Tasks Card - For both teachers and non-teachers */}
          {(isTeacher || isNonTeacher) && (
            <Grid item xs={12} md={isTeacher ? 6 : 12}>
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <SearchIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h5" component="h2" gutterBottom>
                    {t('Search Tasks')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {t('Browse and discover educational tasks created by teachers')}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Link href="/tasks" passHref legacyBehavior>
                    <Button variant="secondary" size="large" fullWidth>
                      {t('Browse Tasks')}
                    </Button>
                  </Link>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
    </AuthenticatedPage>
  );
}
