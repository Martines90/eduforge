'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ShareIcon from '@mui/icons-material/Share';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useTranslation } from '@/lib/i18n';
import { CustomTaskDialog } from '@/components/organisms/CustomTaskDialog';
import {
  fetchTestById,
  updateTest,
  deleteTestTask,
  updateTestTask,
  publishTestToPublic,
  addTaskToTest,
  reorderTestTasks,
  uploadTestPDF,
} from '@/lib/services/test.service';
import { fetchTaskById } from '@/lib/services/api.service';
import { generateTestPDF, TestPDFData } from '@/lib/utils/pdf-generator';
import { Test, UpdateTestRequest } from '@/types/test.types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TestTask {
  id: string;
  taskId: string | null;
  customTitle?: string;
  customText?: string;
  customQuestions?: Array<{ question: string; score?: number }>;
  overrideTitle?: string;
  overrideText?: string;
  showImage: boolean;
  score?: number;
  orderIndex: number;
  addedAt: string;
}

/**
 * Sortable Task Item Component
 */
interface SortableTaskItemProps {
  task: TestTask;
  index: number;
  getTaskTitle: (task: TestTask) => string;
  getTaskDescription: (task: TestTask) => string;
  handleToggleImage: (task: TestTask) => void;
  handleDeleteTaskClick: (task: TestTask) => void;
  resolvedTaskData: { [key: string]: any };
  t: any;
  setError: (error: string) => void;
}

function SortableTaskItem({
  task,
  index,
  getTaskTitle,
  getTaskDescription,
  handleToggleImage,
  handleDeleteTaskClick,
  resolvedTaskData,
  t,
  setError,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} sx={{ p: 2, cursor: isDragging ? 'grabbing' : 'default' }}>
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Drag Handle */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
          {...attributes}
          {...listeners}
        >
          <DragIndicatorIcon sx={{ color: 'text.disabled' }} />
          <Typography variant="h6" sx={{ ml: 1, minWidth: 30 }}>
            {index + 1}.
          </Typography>
        </Box>

        {/* Task Content */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {getTaskTitle(task)}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
            dangerouslySetInnerHTML={{
              __html: getTaskDescription(task).substring(0, 150) + (getTaskDescription(task).length > 150 ? '...' : ''),
            }}
          />

          <Box sx={{ display: 'flex', gap: 1 }}>
            {task.taskId && (
              <Chip label="Library Task" size="small" color="primary" variant="outlined" />
            )}
            {task.customTitle && (
              <Chip label="Custom Task" size="small" color="secondary" variant="outlined" />
            )}
            {task.score && <Chip label={`${task.score} points`} size="small" />}
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {task.taskId && resolvedTaskData[task.id]?.content?.images?.length > 0 && (
            <Tooltip title={task.showImage ? 'Hide image' : 'Show image'}>
              <IconButton
                size="small"
                onClick={() => handleToggleImage(task)}
                color={task.showImage ? 'primary' : 'default'}
              >
                {task.showImage ? <VisibilityIcon /> : <VisibilityOffIcon />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit task">
            <IconButton
              size="small"
              onClick={() => {
                // TODO: Open edit task dialog
                setError('Task editing coming soon!');
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove from test">
            <IconButton
              size="small"
              onClick={() => handleDeleteTaskClick(task)}
              sx={{ color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.dark' } }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Card>
  );
}

/**
 * Test Editor Page - Teacher Only
 * Edit test metadata and manage tasks in the test
 */
export default function TestEditorPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params?.id as string;
  const { t } = useTranslation();
  const { isAuthorized, isLoading: authLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  const [test, setTest] = useState<Test | null>(null);
  const [tasks, setTasks] = useState<TestTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit test metadata dialog
  const [editMetadataOpen, setEditMetadataOpen] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  // Delete task confirmation
  const [deleteTaskDialogOpen, setDeleteTaskDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TestTask | null>(null);

  // Publishing
  const [isPublishing, setIsPublishing] = useState(false);
  const [publicLinkDialogOpen, setPublicLinkDialogOpen] = useState(false);

  // Custom task dialog
  const [customTaskDialogOpen, setCustomTaskDialogOpen] = useState(false);

  // PDF generation
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Resolved task data for display
  const [resolvedTaskData, setResolvedTaskData] = useState<{ [key: string]: any }>({});

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadTest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[TestEditor] Loading test:', testId);
      const response = await fetchTestById(testId);
      console.log('[TestEditor] Test loaded:', response);
      setTest(response.test);
      setTasks(response.tasks || []);

      // Load library task data for tasks that reference library tasks
      const taskData: { [key: string]: any } = {};
      for (const task of response.tasks || []) {
        if (task.taskId) {
          try {
            const libraryTask = await fetchTaskById(task.taskId);
            taskData[task.id] = libraryTask.data;
          } catch (err) {
            console.error('[TestEditor] Error loading library task:', task.taskId, err);
          }
        }
      }
      setResolvedTaskData(taskData);
    } catch (err: any) {
      console.error('[TestEditor] Error loading test:', err);
      setError(err.message || 'Failed to load test');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && testId) {
      loadTest();
    }
  }, [isAuthorized, testId]);

  if (authLoading || isLoading) {
    return <LoadingSpinner message={t('Loading...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  if (!test) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{t('Test not found')}</Alert>
      </Container>
    );
  }

  const handleEditMetadataOpen = () => {
    setEditedName(test.name);
    setEditedDescription(test.description || '');
    setEditMetadataOpen(true);
  };

  const handleEditMetadataClose = () => {
    setEditMetadataOpen(false);
    setEditedName('');
    setEditedDescription('');
  };

  const handleSaveMetadata = async () => {
    try {
      const updates: UpdateTestRequest = {};
      if (editedName !== test.name) {
        updates.name = editedName;
      }
      if (editedDescription !== test.description) {
        updates.description = editedDescription || undefined;
      }

      if (Object.keys(updates).length > 0) {
        await updateTest(testId, updates);
        setTest({ ...test, ...updates });
        setSuccess('Test metadata updated successfully');
      }

      handleEditMetadataClose();
    } catch (err: any) {
      console.error('Error updating test metadata:', err);
      setError(err.message || 'Failed to update test metadata');
    }
  };

  const handleDeleteTaskClick = (task: TestTask) => {
    setTaskToDelete(task);
    setDeleteTaskDialogOpen(true);
  };

  const handleDeleteTaskConfirm = async () => {
    if (!taskToDelete) return;

    try {
      await deleteTestTask(testId, taskToDelete.id);
      setTasks(tasks.filter(t => t.id !== taskToDelete.id));
      setTest({ ...test, taskCount: test.taskCount - 1 });
      setSuccess('Task removed from test');
      setDeleteTaskDialogOpen(false);
      setTaskToDelete(null);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to remove task from test');
    }
  };

  const handleToggleImage = async (task: TestTask) => {
    try {
      const newShowImage = !task.showImage;
      await updateTestTask(testId, task.id, { showImage: newShowImage });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, showImage: newShowImage } : t));
      setSuccess(`Image ${newShowImage ? 'shown' : 'hidden'}`);
    } catch (err: any) {
      console.error('Error toggling image:', err);
      setError(err.message || 'Failed to toggle image');
    }
  };

  const handlePublishToPublic = async () => {
    try {
      setIsPublishing(true);
      setError(null);

      // Publish test first
      const response = await publishTestToPublic(testId);

      // Generate and upload PDF in the background
      if (tasks.length > 0) {
        console.log('[TestEditor] Generating PDF for published test...');

        try {
          const pdfData: TestPDFData = {
            id: testId,
            name: test.name,
            subject: test.subject,
            gradeLevel: test.gradeLevel,
            description: test.description,
            tasks: tasks.map((task) => {
              const title = getTaskTitle(task);
              const description = getTaskDescription(task);
              const libraryTask = task.taskId ? resolvedTaskData[task.id] : null;

              return {
                title,
                description,
                images: task.showImage && libraryTask?.content?.images ? libraryTask.content.images : [],
                questions: task.customQuestions,
                score: task.score,
                showImage: task.showImage,
              };
            }),
          };

          const pdfDataUri = await generateTestPDF(pdfData);
          const pdfResponse = await uploadTestPDF(testId, pdfDataUri, test.name);

          console.log('[TestEditor] PDF generated and uploaded:', pdfResponse.pdfUrl);

          setTest({
            ...test,
            publicLink: response.publicLink,
            publishedTestId: response.publicId,
            lastPublishedAt: new Date().toISOString(),
            pdfUrl: pdfResponse.pdfUrl,
            lastPdfGeneratedAt: new Date().toISOString(),
          });
        } catch (pdfErr) {
          console.error('[TestEditor] PDF generation failed, but test was published:', pdfErr);
          setTest({
            ...test,
            publicLink: response.publicLink,
            publishedTestId: response.publicId,
            lastPublishedAt: new Date().toISOString(),
          });
        }
      } else {
        setTest({
          ...test,
          publicLink: response.publicLink,
          publishedTestId: response.publicId,
          lastPublishedAt: new Date().toISOString(),
        });
      }

      setPublicLinkDialogOpen(true);
      setSuccess('Test published successfully!');
    } catch (err: any) {
      console.error('Error publishing test:', err);
      setError(err.message || 'Failed to publish test');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyPublicLink = () => {
    if (test.publicLink) {
      const fullUrl = `${window.location.origin}${test.publicLink}`;
      navigator.clipboard.writeText(fullUrl);
      setSuccess('Public link copied to clipboard!');
    }
  };

  const handleCreateCustomTask = async (data: {
    customTitle: string;
    customText: string;
    customQuestions?: Array<{ question: string; score?: number }>;
    score?: number;
  }) => {
    try {
      await addTaskToTest(testId, data);
      // Reload test to get updated tasks
      await loadTest();
      setSuccess('Custom task added successfully!');
    } catch (err: any) {
      console.error('Error creating custom task:', err);
      throw err; // Re-throw to let dialog handle it
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reorderedTasks);

    try {
      // Update order indices in backend
      const taskOrders = reorderedTasks.map((task, index) => ({
        testTaskId: task.id,
        orderIndex: index,
      }));

      await reorderTestTasks(testId, { taskOrders });
      setSuccess('Tasks reordered successfully!');
    } catch (err: any) {
      console.error('Error reordering tasks:', err);
      setError(err.message || 'Failed to reorder tasks');
      // Revert on error
      await loadTest();
    }
  };

  const getTaskTitle = (task: TestTask): string => {
    if (task.overrideTitle) return task.overrideTitle;
    if (task.customTitle) return task.customTitle;
    if (task.taskId && resolvedTaskData[task.id]) {
      return resolvedTaskData[task.id].title || 'Untitled Task';
    }
    return 'Untitled Task';
  };

  const getTaskDescription = (task: TestTask): string => {
    if (task.overrideText) return task.overrideText;
    if (task.customText) return task.customText;
    if (task.taskId && resolvedTaskData[task.id]) {
      return resolvedTaskData[task.id].content?.description || '';
    }
    return '';
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setError(null);

      if (tasks.length === 0) {
        setError('Cannot generate PDF - test has no tasks');
        return;
      }

      console.log('[TestEditor] Starting PDF generation...');

      // Prepare test data for PDF generation
      const pdfData: TestPDFData = {
        id: testId,
        name: test.name,
        subject: test.subject,
        gradeLevel: test.gradeLevel,
        description: test.description,
        tasks: tasks.map((task) => {
          const title = getTaskTitle(task);
          const description = getTaskDescription(task);
          const libraryTask = task.taskId ? resolvedTaskData[task.id] : null;

          return {
            title,
            description,
            images: task.showImage && libraryTask?.content?.images ? libraryTask.content.images : [],
            questions: task.customQuestions,
            score: task.score,
            showImage: task.showImage,
          };
        }),
      };

      console.log('[TestEditor] Generating PDF with data:', pdfData);

      // Generate PDF
      const pdfDataUri = await generateTestPDF(pdfData);

      console.log('[TestEditor] PDF generated, uploading to backend...');

      // Upload to backend
      const response = await uploadTestPDF(testId, pdfDataUri, test.name);

      console.log('[TestEditor] PDF uploaded successfully:', response.pdfUrl);

      // Update test with PDF URL
      setTest({ ...test, pdfUrl: response.pdfUrl, lastPdfGeneratedAt: new Date().toISOString() });
      setSuccess('PDF generated and saved successfully!');

      // Open PDF in new tab
      window.open(response.pdfUrl, '_blank');
    } catch (err: any) {
      console.error('[TestEditor] Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" component="h1">
              {test.name}
            </Typography>
            <IconButton onClick={handleEditMetadataOpen} color="primary">
              <EditIcon />
            </IconButton>
          </Box>

          {test.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {test.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={test.subject.charAt(0).toUpperCase() + test.subject.slice(1)} color="primary" />
            {test.gradeLevel && (
              <Chip label={test.gradeLevel.replace('grade_', 'Grade ').replace('_', '-')} />
            )}
            <Chip label={`${test.taskCount} tasks`} />
            {test.totalScore && <Chip label={`${test.totalScore} points`} />}
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Publishing Section */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {test.publicLink ? t('Published') : t('Publish to Public')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {test.publicLink
                  ? t('This test is publicly accessible')
                  : t('Share this test with a public link')}
              </Typography>
              {test.publicLink && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1, borderRadius: 1 }}>
                    {window.location.origin}{test.publicLink}
                  </Typography>
                  <Tooltip title="Copy link">
                    <IconButton size="small" onClick={handleCopyPublicLink}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
            <Button
              variant="primary"
              startIcon={<ShareIcon />}
              onClick={handlePublishToPublic}
              disabled={isPublishing}
            >
              {isPublishing
                ? t('Publishing...')
                : test.publicLink
                ? t('Republish Latest Version')
                : t('Publish to Public')}
            </Button>
          </Box>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Tasks Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">Tasks</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="secondary"
                startIcon={<AddIcon />}
                onClick={() => router.push('/tasks')}
              >
                {t('Add from Library')}
              </Button>
              <Button
                variant="primary"
                startIcon={<AddIcon />}
                onClick={() => setCustomTaskDialogOpen(true)}
              >
                {t('Add Custom Task')}
              </Button>
            </Box>
          </Box>

          {tasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('No tasks yet')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('Add tasks from the library or create custom tasks')}
              </Typography>
            </Box>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {tasks.map((task, index) => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      index={index}
                      getTaskTitle={getTaskTitle}
                      getTaskDescription={getTaskDescription}
                      handleToggleImage={handleToggleImage}
                      handleDeleteTaskClick={handleDeleteTaskClick}
                      resolvedTaskData={resolvedTaskData}
                      t={t}
                      setError={setError}
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          )}
        </Box>

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={() => router.push('/my-tests')}>
            {t('Back to My Tests')}
          </Button>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="secondary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || tasks.length === 0}
            >
              {isGeneratingPDF ? t('Generating...') : t('Generate PDF')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Edit Metadata Dialog */}
      <Dialog open={editMetadataOpen} onClose={handleEditMetadataClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('Edit Test Details')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('Test Name')}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label={t('Description')}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={handleEditMetadataClose}>
            {t('Cancel')}
          </Button>
          <Button variant="primary" onClick={handleSaveMetadata}>
            {t('Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={deleteTaskDialogOpen} onClose={() => setDeleteTaskDialogOpen(false)}>
        <DialogTitle>{t('Remove Task')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('Are you sure you want to remove this task from the test?')}
          </Typography>
          {taskToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {getTaskTitle(taskToDelete)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setDeleteTaskDialogOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteTaskConfirm}
            sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
          >
            {t('Remove')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Public Link Dialog */}
      <Dialog open={publicLinkDialogOpen} onClose={() => setPublicLinkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon color="success" />
            {t('Test Published!')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {t('Your test is now publicly accessible at:')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              value={test.publicLink ? `${window.location.origin}${test.publicLink}` : ''}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
            />
            <Tooltip title="Copy link">
              <IconButton onClick={handleCopyPublicLink}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('Anyone with this link can view your test. You can republish to update the public version with any changes.')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="primary" onClick={() => setPublicLinkDialogOpen(false)}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Custom Task Dialog */}
      <CustomTaskDialog
        open={customTaskDialogOpen}
        onClose={() => setCustomTaskDialogOpen(false)}
        onSave={handleCreateCustomTask}
      />
    </Container>
  );
}
