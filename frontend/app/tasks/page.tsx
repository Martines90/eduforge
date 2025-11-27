'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';

/**
 * Tasks Page
 * Browse and search available educational tasks
 * Accessible to all users (no authentication required)
 */
export default function TasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');

  // TODO: Fetch tasks from backend API
  // const tasks = await apiService.getTasks({ search, subject, grade });

  // Placeholder data for demonstration
  const hasNoTasks = true;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('Educational Tasks')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Browse and explore educational tasks for grades 9-12')}
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={t('Search tasks...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Subject')}</InputLabel>
              <Select
                value={filterSubject}
                label={t('Subject')}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <MenuItem value="all">{t('All Subjects')}</MenuItem>
                <MenuItem value="math">{t('Mathematics')}</MenuItem>
                <MenuItem value="physics">{t('Physics')}</MenuItem>
                <MenuItem value="chemistry">{t('Chemistry')}</MenuItem>
                <MenuItem value="biology">{t('Biology')}</MenuItem>
                <MenuItem value="geography">{t('Geography')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Grade')}</InputLabel>
              <Select
                value={filterGrade}
                label={t('Grade')}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <MenuItem value="all">{t('All Grades')}</MenuItem>
                <MenuItem value="9-10">{t('Grade 9-10')}</MenuItem>
                <MenuItem value="11-12">{t('Grade 11-12')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Task List or Empty State */}
      {hasNoTasks ? (
        <Paper
          elevation={1}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'background.default',
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
          <Typography variant="h5" gutterBottom>
            {t('No Tasks Available Yet')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('Educational tasks will appear here once teachers start creating them. Check back soon!')}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button variant="primary" onClick={() => router.push('/')}>
              {t('Back to Home')}
            </Button>
          </Box>
        </Paper>
      ) : (
        <>
          {/* Task Grid (Placeholder for when tasks exist) */}
          <Grid container spacing={3}>
            {/* Example task card - will be populated with real data */}
            <Grid item xs={12} md={6} lg={4}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label="Math" size="small" color="primary" />
                    <Chip label="Grade 9-10" size="small" />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Solving Linear Equations
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Practice solving linear equations with real-world applications...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Difficulty: Medium • 15 min
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button variant="primary" size="small" fullWidth>
                    {t('Start Task')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* More task cards will be rendered here */}
          </Grid>
        </>
      )}
    </Container>
  );
}
