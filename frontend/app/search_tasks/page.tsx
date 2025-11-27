'use client';

import { Container, Typography, Box, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useUser } from '@/lib/context';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner/LoadingSpinner';

export default function SearchTasks() {
  const { user } = useUser();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
  });

  const subjectLabels: Record<string, string> = {
    'mathematics': 'Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'history': 'History',
    'geography': 'Geography',
    'literature': 'Literature',
    'english': 'English',
    'computer-science': 'Computer Science',
    'arts': 'Arts',
    'music': 'Music',
    'physical-education': 'Physical Education',
  };

  const subjectLabel = user.subject ? subjectLabels[user.subject] : 'All Subjects';

  // Show loading state while checking authorization
  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // If not authorized, the hook will redirect - show loading
  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

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
            maxWidth: 800,
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <SearchIcon
              sx={{
                fontSize: 80,
                color: 'primary.main',
                opacity: 0.7,
              }}
            />
          </Box>
          <Typography variant="h1" component="h1" gutterBottom>
            Search {subjectLabel} Tasks
          </Typography>
          <Typography variant="h6" component="div" color="text.secondary" paragraph sx={{ mt: 2 }}>
            Coming Soon!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This feature will allow you to browse and search through existing educational tasks
            created by the community.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, fontStyle: 'italic' }}>
            In the meantime, you can create new tasks using the Task Creator.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
