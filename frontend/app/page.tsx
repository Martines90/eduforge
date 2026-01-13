'use client';

import Link from 'next/link';
import { Container, Typography, Box, Paper, Grid, Alert } from '@mui/material';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useEffect, useState, useMemo } from 'react';

export default function Home() {
  const { t } = useTranslation();
  const { user, gradeSystem } = useUser();
  const [showTrialMessage, setShowTrialMessage] = useState(false);

  const isGuest = !user.isRegistered;
  const isTeacher = user.identity === 'teacher';
  const isNonTeacher = user.identity === 'non-teacher';

  // Get teacher's grade level label based on their teacherRole preference
  const teacherGradeLabel = useMemo(() => {
    if (!isTeacher || !user.teacherRole) {
      return t('grade 1-12'); // Default fallback for all grades
    }
    const gradeConfig = gradeSystem.getGrade(user.teacherRole);
    return gradeConfig ? `${t('grade')} ${gradeConfig.gradeRange}` : t('grade 1-12');
  }, [isTeacher, user.teacherRole, gradeSystem, t]);

  // Check if we should show the trial subscription message
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const showMessage = sessionStorage.getItem('showTrialMessage');
    if (showMessage === 'true' && isTeacher) {
      setShowTrialMessage(true);
      // Clear the flag so it only shows once
      sessionStorage.removeItem('showTrialMessage');
    }
  }, [isTeacher]);

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
        <Typography variant="h1" component="h1" gutterBottom textAlign="center">
          EduForger
        </Typography>
        <Typography variant="h5" component="div" color="text.secondary" paragraph textAlign="center" mb={4}>
          {t('Educational Task Platform')}
        </Typography>

        {/* One-time success message after registration */}
        {showTrialMessage && (
          <Box sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
            <Alert
              severity="success"
              onClose={() => setShowTrialMessage(false)}
              sx={{ fontSize: '1rem' }}
            >
              {t('Registration successful, your 3-month free trial subscription just started!')}
            </Alert>
          </Box>
        )}

        {/* Non-Logged In Users - Show Introduction */}
        {isGuest && (
          <Box sx={{ width: '100%', maxWidth: 900, mb: 4 }}>
            {/* Introduction Section */}
            <Paper elevation={2} sx={{ p: 5, mb: 4, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
              <Typography variant="h4" component="h2" gutterBottom textAlign="center" sx={{ mb: 3, fontWeight: 600 }}>
                {t('Welcome to EduForger')}
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, textAlign: 'center', mb: 3 }}>
                {t('EduForger is a subject and curriculum-specific real-world inspired engaging story/scenario-driven task generator and task library platform for teachers (creators), schools, and for parents/students.')}
              </Typography>
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.8, textAlign: 'center', mb: 3 }}>
                {t('As a teacher you can generate any curriculum-specific EduForger task within 10-20 seconds. The tasks will be based on fun/exciting/adventurous/high-stake situations that your class will love for sure!')}
              </Typography>
            </Paper>

            {/* Call to Action Cards */}
            <Grid container spacing={3}>
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
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box>
                    <AutoAwesomeIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" component="h3" gutterBottom>
                      {t('Try It as a Teacher')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {t('Generate engaging, curriculum-aligned tasks in seconds!')}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/task_generator" passHref legacyBehavior>
                      <Button variant="primary" size="large" fullWidth>
                        {t('Start Generating')}
                      </Button>
                    </Link>
                  </Box>
                </Paper>
              </Grid>
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
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box>
                    <SearchIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h5" component="h3" gutterBottom>
                      {t('Discover Our Task Library')}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      {t('Browse tasks that fit your curriculum section and pick what you like!')}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/tasks" passHref legacyBehavior>
                      <Button variant="secondary" size="large" fullWidth>
                        {t('Browse Task Library')}
                      </Button>
                    </Link>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Registered Users - Show Dashboard */}
        {!isGuest && (
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
                        {t('Create educational tasks based on curriculum topics for')} {teacherGradeLabel}
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
        )}
      </Box>
    </Container>
  );
}
