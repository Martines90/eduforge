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
  const [filterGrade, setFilterGrade] = useState('grade_9_10');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
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
        const data = await fetchTreeMap(country, filterSubject, filterGrade);
        if (data.success && data.data) {
          setTreeData(data.data.tree);
        } else {
          setError(data.message || 'Failed to load curriculum tree');
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

  const hasNoTasks = !isLoading && treeData.length === 0 && !error;
  const dataToDisplay = treeData.length > 0 ? treeData : [];

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
        <Grid container spacing={3} alignItems="center">
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
                <MenuItem value="mathematics">{t('Mathematics')}</MenuItem>
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
                <MenuItem value="grade_9_10">{t('Grade 9-10')}</MenuItem>
                <MenuItem value="grade_11_12">{t('Grade 11-12')}</MenuItem>
              </Select>
            </FormControl>
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
        <TaskTreeView
          data={dataToDisplay}
          subject={filterSubject}
          gradeLevel={filterGrade}
          onTaskClick={(task) => {
            console.log('Task clicked:', task);
            router.push(`/tasks/${task.id}`);
          }}
        />
      )}
    </Container>
  );
}
