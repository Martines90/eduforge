'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button } from '@/components/atoms/Button';
import { TaskTreeView } from '@/components/organisms/TaskTreeView';
import { SubjectSelector } from '@/components/molecules/SubjectSelector';
import { TreeNode } from '@/types/task-tree';
import { Subject } from '@/types/i18n';
import { useTranslation } from '@/lib/i18n';
import { fetchTreeMap } from '@/lib/services/api.service';
import { useUser } from '@/lib/context/UserContext';
import { GradeLevel } from '@eduforger/shared';

/**
 * Tasks Page
 * Browse and search available educational tasks
 * Freely accessible to all users (guests and registered)
 * Individual task views are limited for guests (see /tasks/[id])
 */
export default function TasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, gradeSystem } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<Subject>('mathematics');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  // Dynamic tree data storage - one entry per grade level
  const [treeDataByGrade, setTreeDataByGrade] = useState<Record<string, TreeNode[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tree data from backend API - dynamically for all grades
  useEffect(() => {
    const fetchTreeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use user's country for curriculum
        const country = user.country;
        console.log('[Tasks Page] User country:', country, 'Available grades:', gradeSystem.gradeValues);

        // Determine which grades to fetch
        const gradesToFetch = filterGrade === 'all'
          ? gradeSystem.gradeValues
          : [filterGrade as GradeLevel];

        // Fetch all selected grades in parallel
        const fetchPromises = gradesToFetch.map(async (gradeLevel) => {
          const data = await fetchTreeMap(country, filterSubject, gradeLevel);
          return {
            gradeLevel,
            tree: data.success && data.data ? data.data.tree : [],
          };
        });

        const results = await Promise.all(fetchPromises);

        // Build tree data map
        const newTreeData: Record<string, TreeNode[]> = {};
        results.forEach(({ gradeLevel, tree }) => {
          newTreeData[gradeLevel] = tree;
        });

        setTreeDataByGrade(newTreeData);
      } catch (err: any) {
        console.error('[Tasks Page] Error fetching tree data:', err);
        setError(err.message || 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreeData();
  }, [filterSubject, filterGrade, user.country, gradeSystem.gradeValues]);

  // Check if all grades have no tasks
  const hasNoTasks = !isLoading && !error && Object.values(treeDataByGrade).every(tree => tree.length === 0);

  // Get grades to display (either all or just the filtered one)
  const gradesToDisplay = filterGrade === 'all'
    ? gradeSystem.availableGrades
    : gradeSystem.availableGrades.filter(g => g.value === filterGrade);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1">
          {t('Educational Tasks')}
        </Typography>
      </Box>

      {/* Subject Selector, Grade Filter and Search - Merged into one panel */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={4}>
            <SubjectSelector
              value={filterSubject}
              onChange={(subject) => setFilterSubject(subject as Subject)}
              label={t('Subject')}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>{t('Grade')}</InputLabel>
              <Select
                value={filterGrade}
                label={t('Grade')}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <MenuItem value="all">{t('All Grades')}</MenuItem>
                {gradeSystem.availableGrades.map((grade) => (
                  <MenuItem key={grade.value} value={grade.value}>
                    {grade.labelLocal}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder={t('Search in curriculum tree (min 3 characters)...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              helperText={searchQuery.length > 0 && searchQuery.length < 3 ? t('Please enter at least 3 characters') : ''}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" component="div" gutterBottom>
            {t('Loading tasks...')}
          </Typography>
        </Paper>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', backgroundColor: 'error.light' }}>
          <Typography variant="h6" component="div" gutterBottom color="error">
            Error: {error}
          </Typography>
          <Typography variant="body2">
            Using fallback sample data
          </Typography>
        </Paper>
      )}

      {/* Task List or Empty State */}
      {!isLoading && hasNoTasks ? (
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
          <Typography variant="h5" component="div" gutterBottom>
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
          {/* Dynamic Grade Blocks - One for each grade in the user's country */}
          {gradesToDisplay.map((grade) => {
            const treeData = treeDataByGrade[grade.value] || [];

            // Only show grade block if it has tasks
            if (treeData.length === 0) return null;

            return (
              <Box key={grade.value} sx={{ mb: 4 }}>
                <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                  {grade.labelLocal}
                </Typography>
                <TaskTreeView
                  data={treeData}
                  subject={filterSubject}
                  gradeLevel={grade.value}
                  searchQuery={searchQuery}
                  onTaskClick={(task) => {
                    console.log('Task clicked:', task);
                    router.push(`/tasks/${task.id}`);
                  }}
                />
              </Box>
            );
          })}
        </>
      )}
    </Container>
  );
}
