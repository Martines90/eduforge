'use client';

import { Container, Typography, Box, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Alert } from '@mui/material';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';
import { useUser } from '@/lib/context';
import { useTranslation } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { Button } from '@/components/atoms/Button';

export default function SchoolTeachersPage() {
  const { t } = useTranslation();
  const { user } = useUser();
  const router = useRouter();

  // Redirect non-pro users
  useEffect(() => {
    if (user.isRegistered && user.subscription?.tier !== 'pro') {
      router.push('/my-subscription');
    }
  }, [user.isRegistered, user.subscription, router]);

  if (!user.isRegistered || user.subscription?.tier !== 'pro') {
    return null;
  }

  const maxTeachers = 10;
  const currentTeachers = user.subscription?.associatedTeachers?.length || 0;

  return (
    <AuthenticatedPage>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <SchoolIcon sx={{ fontSize: 40, verticalAlign: 'middle', mr: 1 }} />
            {t('School Teachers Management')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Manage teachers from your school (Pro Plan)')}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          {t('This feature is coming soon! You will be able to add up to {{max}} teachers from your school.', { max: maxTeachers })}
        </Alert>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              {t('Teachers')} ({currentTeachers}/{maxTeachers})
            </Typography>
            <Button
              variant="primary"
              startIcon={<PersonAddIcon />}
              disabled
            >
              {t('Invite Teacher')}
            </Button>
          </Box>

          {user.subscription?.schoolName && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('School Name')}:
              </Typography>
              <Typography variant="h6">
                {user.subscription.schoolName}
              </Typography>
            </Box>
          )}

          {currentTeachers === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <SchoolIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('No teachers added yet')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Click "Invite Teacher" to add teachers from your school')}
              </Typography>
            </Box>
          ) : (
            <List>
              {/* Placeholder for future teacher list */}
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <SchoolIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Example Teacher"
                  secondary="teacher@school.edu"
                />
                <Chip label={t('Active')} color="success" size="small" />
              </ListItem>
            </List>
          )}
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('Pro Plan Benefits')}
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary={t('10,000 Task Generation Credits')}
                secondary={t('Shared across all teachers in your school')}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('Add Up to 10 Teachers')}
                secondary={t('Each teacher gets their own account')}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('School Contest Participation')}
                secondary={t('Compete for "Best School of the Year"')}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary={t('Priority 24-hour Support')}
                secondary={t('Fast response times for your school')}
              />
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => router.push('/my-subscription')}
          >
            {t('Back to Subscription')}
          </Button>
        </Box>
      </Container>
    </AuthenticatedPage>
  );
}
