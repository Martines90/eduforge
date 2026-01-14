'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Card,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useTranslation } from '@/lib/i18n';
import { fetchMyTasks } from '@/lib/services/api.service';

interface Task {
  id: string;
  title: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  isPublished: boolean;
  createdAt: any;
  created_at?: string;
  tags?: string[];
  viewCount: number;
  ratingAverage: number;
  ratingCount: number;
  curriculum_path?: string;
  subjectMappingPath?: string;
}

interface GroupedTasks {
  [subjectGrade: string]: {
    [topicPath: string]: Task[];
  };
}

/**
 * My Tasks Page - Teacher Only
 * Displays a list of tasks created by the teacher
 */
export default function MyTasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthorized, isLoading: authLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Helper functions defined first
  const formatSubjectGrade = (subject: string, gradeLevel: string): string => {
    // Format: "Mathematics Grade 9-10"
    const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);
    const gradeName = gradeLevel.replace('grade_', 'Grade ').replace('_', '-');
    return `${subjectName} ${gradeName}`;
  };

  const formatDate = (task: Task) => {
    const timestamp = task.createdAt || task.created_at;
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[MyTasks] Starting to fetch tasks...');
      const response = await fetchMyTasks({ sort: 'recent' });
      console.log('[MyTasks] API Response:', response);
      console.log('[MyTasks] Tasks received:', response.tasks);
      console.log('[MyTasks] Number of tasks:', response.tasks?.length || 0);
      setTasks(response.tasks || []);

      // Expand all groups by default
      const allGroups = new Set<string>();
      (response.tasks || []).forEach((task: Task) => {
        const subjectGrade = formatSubjectGrade(task.subject, task.gradeLevel);
        allGroups.add(subjectGrade);
      });
      setExpandedGroups(allGroups);
    } catch (err: any) {
      console.error('[MyTasks] Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadTasks();
    }
  }, [isAuthorized]);

  if (authLoading || isLoading) {
    return <LoadingSpinner message={t('Loading...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  const hasNoTasks = tasks.length === 0;

  const getTopicPath = (task: Task): string => {
    // Get topic path without subject and grade
    if (task.curriculum_path) {
      const parts = task.curriculum_path.split(':');
      // Skip first 2 parts (subject and grade), return the rest
      if (parts.length > 2) {
        return parts.slice(2).join(' > ');
      }
      return 'General';
    }
    if (task.subjectMappingPath) {
      return task.subjectMappingPath;
    }
    return 'General';
  };

  const groupTasksBySubjectAndTopic = (tasks: Task[]): GroupedTasks => {
    const grouped: GroupedTasks = {};

    tasks.forEach(task => {
      const subjectGrade = formatSubjectGrade(task.subject, task.gradeLevel);
      const topicPath = getTopicPath(task);

      if (!grouped[subjectGrade]) {
        grouped[subjectGrade] = {};
      }
      if (!grouped[subjectGrade][topicPath]) {
        grouped[subjectGrade][topicPath] = [];
      }
      grouped[subjectGrade][topicPath].push(task);
    });

    // Sort tasks within each group by creation date (newest first)
    Object.keys(grouped).forEach(subjectGrade => {
      Object.keys(grouped[subjectGrade]).forEach(topicPath => {
        grouped[subjectGrade][topicPath].sort((a, b) => {
          const aTime = a.createdAt || a.created_at;
          const bTime = b.createdAt || b.created_at;

          if (!aTime) return 1;
          if (!bTime) return -1;

          const aDate = aTime.toDate ? aTime.toDate() : new Date(aTime);
          const bDate = bTime.toDate ? bTime.toDate() : new Date(bTime);

          return bDate.getTime() - aDate.getTime();
        });
      });
    });

    return grouped;
  };

  const groupedTasks = groupTasksBySubjectAndTopic(tasks);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.isPublished) {
      setError('Cannot delete published tasks');
      return;
    }
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      if (!token) {
        setError('Authentication required');
        return;
      }

      const { buildApiUrl } = await import('@/lib/config/urls');
      const response = await fetch(buildApiUrl(`/api/v2/tasks/${taskToDelete.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete task');
      }

      // Remove task from state
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {t('My Tasks')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('View and manage all tasks you\'ve created')}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Empty State or Task List */}
        {hasNoTasks ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
            }}
          >
            <Typography variant="h6" component="div" gutterBottom>
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

            {/* Task List - Grouped by Subject/Grade and Topics */}
            <Box>
              {Object.entries(groupedTasks).map(([subjectGrade, topics]) => {
                const isExpanded = expandedGroups.has(subjectGrade);
                const totalTasks = Object.values(topics).reduce((sum, tasks) => sum + tasks.length, 0);

                return (
                  <Box key={subjectGrade} sx={{ mb: 3 }}>
                    {/* Subject/Grade Header - Collapsible */}
                    <Box
                      onClick={() => toggleGroup(subjectGrade)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{ color: 'inherit', mr: 1 }}
                      >
                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                      <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        {subjectGrade}
                      </Typography>
                      <Chip
                        label={`${totalTasks} ${totalTasks === 1 ? 'task' : 'tasks'}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                      />
                    </Box>

                    {/* Topics and Tasks */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2, ml: 2 }}>
                        {Object.entries(topics).map(([topicPath, topicTasks]) => (
                          <Box key={topicPath} sx={{ mb: 3 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                mb: 1,
                                pb: 0.5,
                                borderBottom: 1,
                                borderColor: 'divider',
                                fontWeight: 600,
                                color: 'text.secondary'
                              }}
                            >
                              {topicPath}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                              {topicTasks.map((task) => (
                                <Card
                                  key={task.id}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 1.5,
                                    '&:hover': {
                                      bgcolor: 'action.hover',
                                      cursor: 'pointer'
                                    }
                                  }}
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                                >
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                      {task.title}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {t('Created')}: {formatDate(task)}
                                    </Typography>
                                  </Box>
                                  <CardActions sx={{ gap: 1 }}>
                                    <Button
                                      variant="secondary"
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/tasks/${task.id}`);
                                      }}
                                      startIcon={<VisibilityIcon />}
                                    >
                                      {t('View')}
                                    </Button>
                                    {!task.isPublished && (
                                      <>
                                        <Button
                                          variant="primary"
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/task_creator?edit=${task.id}`);
                                          }}
                                          startIcon={<EditIcon />}
                                        >
                                          {t('Edit')}
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="small"
                                          onClick={(e) => handleDeleteClick(task, e)}
                                          startIcon={<DeleteIcon />}
                                          sx={{ color: 'error.main' }}
                                        >
                                          {t('Delete')}
                                        </Button>
                                      </>
                                    )}
                                  </CardActions>
                                </Card>
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>{t('Delete Task')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Are you sure you want to delete this task? This action cannot be undone.')}
            {taskToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {taskToDelete.title}
                </Typography>
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={handleDeleteCancel}>
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteConfirm}
            sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
          >
            {t('Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
