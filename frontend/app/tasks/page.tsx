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
import { TreeNode } from '@/types/task-tree';
import { useTranslation } from '@/lib/i18n';
import { fetchTreeMap } from '@/lib/services/api.service';
import { useUser } from '@/lib/context/UserContext';

/**
 * Tasks Page
 * Browse and search available educational tasks
 * Freely accessible to all users (guests and registered)
 * Individual task views are limited for guests (see /tasks/[id])
 */
export default function TasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('mathematics');
  const [filterGrade, setFilterGrade] = useState('all');
  const [treeDataGrade9_10, setTreeDataGrade9_10] = useState<TreeNode[]>([]);
  const [treeDataGrade11_12, setTreeDataGrade11_12] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tree data from backend API
  useEffect(() => {
    const fetchTreeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use user's country for curriculum, fallback to HU if not set
        const country = user.isRegistered && user.country ? user.country : 'HU';
        console.log('[Tasks Page] User country:', user.country, 'isRegistered:', user.isRegistered, 'Using country:', country);

        // Fetch both grade levels if 'all' is selected, otherwise fetch only the selected one
        if (filterGrade === 'all') {
          const [data9_10, data11_12] = await Promise.all([
            fetchTreeMap(country, filterSubject, 'grade_9_10'),
            fetchTreeMap(country, filterSubject, 'grade_11_12'),
          ]);

          if (data9_10.success && data9_10.data) {
            setTreeDataGrade9_10(data9_10.data.tree);
          }
          if (data11_12.success && data11_12.data) {
            setTreeDataGrade11_12(data11_12.data.tree);
          }
        } else if (filterGrade === 'grade_9_10') {
          const data = await fetchTreeMap(country, filterSubject, 'grade_9_10');
          if (data.success && data.data) {
            setTreeDataGrade9_10(data.data.tree);
            setTreeDataGrade11_12([]);
          }
        } else if (filterGrade === 'grade_11_12') {
          const data = await fetchTreeMap(country, filterSubject, 'grade_11_12');
          if (data.success && data.data) {
            setTreeDataGrade11_12(data.data.tree);
            setTreeDataGrade9_10([]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching tree data:', err);
        setError(err.message || 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreeData();
  }, [filterSubject, filterGrade, user.country, user.isRegistered]);

  const hasNoTasks = !isLoading && treeDataGrade9_10.length === 0 && treeDataGrade11_12.length === 0 && !error;

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
            <FormControl fullWidth>
              <InputLabel>{t('Subject')}</InputLabel>
              <Select
                value={filterSubject}
                label={t('Subject')}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <MenuItem value="mathematics">{t('Mathematics')}</MenuItem>
                <MenuItem value="physics">{t('Physics')}</MenuItem>
                <MenuItem value="chemistry">{t('Chemistry')}</MenuItem>
                <MenuItem value="biology">{t('Biology')}</MenuItem>
                <MenuItem value="geography">{t('Geography')}</MenuItem>
              </Select>
            </FormControl>
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
                <MenuItem value="grade_9_10">{t('Grade 9-10')}</MenuItem>
                <MenuItem value="grade_11_12">{t('Grade 11-12')}</MenuItem>
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
          {/* Grade 9-10 Block */}
          {(filterGrade === 'all' || filterGrade === 'grade_9_10') && treeDataGrade9_10.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                {t('Grade 9-10')}
              </Typography>
              <TaskTreeView
                data={treeDataGrade9_10}
                subject={filterSubject}
                gradeLevel="grade_9_10"
                searchQuery={searchQuery}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                  router.push(`/tasks/${task.id}`);
                }}
              />
            </Box>
          )}

          {/* Grade 11-12 Block */}
          {(filterGrade === 'all' || filterGrade === 'grade_11_12') && treeDataGrade11_12.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
                {t('Grade 11-12')}
              </Typography>
              <TaskTreeView
                data={treeDataGrade11_12}
                subject={filterSubject}
                gradeLevel="grade_11_12"
                searchQuery={searchQuery}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                  router.push(`/tasks/${task.id}`);
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
