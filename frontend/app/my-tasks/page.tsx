'use client';

import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useTranslation } from '@/lib/i18n';

/**
 * My Tasks Page - Teacher Only
 * Displays a list of tasks created by the teacher
 */
export default function MyTasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  if (isLoading) {
    return <LoadingSpinner message={t('Loading...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  // TODO: Fetch tasks from backend API
  // const tasks = await apiService.getMyTasks();

  // Placeholder data for demonstration
  const hasNoTasks = true;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <AssignmentIcon color="primary" sx={{ fontSize: 40 }} />
            <Typography variant="h4" component="h1">
              {t('My Tasks')}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {t('View and manage all tasks you\'ve created')}
          </Typography>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 3 }}>
          {t('This page will display all educational tasks you have created. You\'ll be able to view, edit, and manage your tasks from here.')}
        </Alert>

        {/* Empty State or Task List */}
        {hasNoTasks ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
            }}
          >
            <AssignmentIcon
              sx={{
                fontSize: 100,
                color: 'text.secondary',
                opacity: 0.5,
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              {t('No Tasks Yet')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('You haven\'t created any tasks yet. Start by creating your first educational task!')}
            </Typography>
            <Button
              variant="primary"
              onClick={() => router.push('/task_creator')}
              startIcon={<AddIcon />}
            >
              {t('Create Your First Task')}
            </Button>
          </Box>
        ) : (
          <>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="primary"
                onClick={() => router.push('/task_creator')}
                startIcon={<AddIcon />}
              >
                {t('Create New Task')}
              </Button>
            </Box>

            {/* Task List (Placeholder) */}
            <Grid container spacing={3}>
              {/* Example task card - will be populated with real data */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Example Task Title
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      This is a placeholder for task description...
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label="Math" size="small" color="primary" />
                      <Chip label="Grade 9-10" size="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('Created')}: 2024-01-15
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="secondary" onClick={() => router.push('/')}>
            {t('Back to Home')}
          </Button>
          <Button variant="secondary" onClick={() => router.push('/profile')}>
            {t('View Profile')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
