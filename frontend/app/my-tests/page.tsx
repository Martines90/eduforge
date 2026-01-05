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
  Chip,
  TextField,
  MenuItem, // Still used for Grade Level dropdown
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { Pagination } from '@/components/molecules/Pagination';
import { SubjectSelector } from '@/components/molecules/SubjectSelector/SubjectSelector';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useTranslation } from '@/lib/i18n';
import { fetchMyTests, deleteTest, createTest, fetchTestById, uploadTestPDF } from '@/lib/services/test.service';
import { fetchTaskById } from '@/lib/services/api.service';
import { Test, CreateTestRequest } from '@/types/test.types';
import { Subject } from '@/types/i18n';
import { generateTestPDF, TestPDFData } from '@/lib/utils/pdf-generator';
import QRCode from 'qrcode';

/**
 * My Tests/Worksheets Page - Teacher Only
 * Displays a list of tests created by the teacher
 */
export default function MyTestsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthorized, isLoading: authLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // PDF generation state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [testForPdf, setTestForPdf] = useState<Test | null>(null);
  const [includeImages, setIncludeImages] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [testToShare, setTestToShare] = useState<Test | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state for creating new test
  const [newTestName, setNewTestName] = useState('');
  const [newTestSubject, setNewTestSubject] = useState<Subject>('mathematics');
  const [newTestGradeLevel, setNewTestGradeLevel] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');

  const formatDate = (dateValue: any) => {
    // Handle Firestore Timestamp objects which come as { _seconds, _nanoseconds }
    let date: Date;

    if (dateValue && typeof dateValue === 'object' && '_seconds' in dateValue) {
      // Firestore Timestamp object
      date = new Date(dateValue._seconds * 1000);
    } else if (typeof dateValue === 'string') {
      // ISO string
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      // Already a Date object
      date = dateValue;
    } else {
      // Fallback
      return 'Invalid Date';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return date.toLocaleDateString();
  };

  const loadTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[MyTests] Starting to fetch tests...');
      const response = await fetchMyTests({ sort: 'recent' });
      console.log('[MyTests] API Response:', response);
      console.log('[MyTests] Tests received:', response.tests);
      console.log('[MyTests] Number of tests:', response.tests?.length || 0);
      setTests(response.tests || []);
    } catch (err: any) {
      console.error('[MyTests] Error loading tests:', err);
      setError(err.message || 'Failed to load tests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadTests();
    }
  }, [isAuthorized]);

  if (authLoading || isLoading) {
    return <LoadingSpinner message={t('Loading...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  const hasNoTests = tests.length === 0;

  // Calculate paginated tests
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTests = tests.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of test list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (test: Test, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestToDelete(test);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!testToDelete) return;

    try {
      await deleteTest(testToDelete.id);
      const updatedTests = tests.filter(t => t.id !== testToDelete.id);
      setTests(updatedTests);

      // Reset to page 1 if current page would be empty after deletion
      const newTotalPages = Math.ceil(updatedTests.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      } else if (updatedTests.length === 0) {
        setCurrentPage(1);
      }

      setDeleteConfirmOpen(false);
      setTestToDelete(null);
    } catch (err: any) {
      console.error('Error deleting test:', err);
      setError(err.message || 'Failed to delete test');
      setDeleteConfirmOpen(false);
      setTestToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setTestToDelete(null);
  };

  const handleCreateDialogOpen = () => {
    setNewTestName('');
    setNewTestSubject('mathematics');
    setNewTestGradeLevel('');
    setNewTestDescription('');
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setNewTestName('');
    setNewTestSubject('mathematics');
    setNewTestGradeLevel('');
    setNewTestDescription('');
  };

  const handleCreateTest = async () => {
    if (!newTestName.trim()) {
      setError('Test name is required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const testData: CreateTestRequest = {
        name: newTestName.trim(),
        subject: newTestSubject,
        gradeLevel: newTestGradeLevel || undefined,
        description: newTestDescription || undefined,
      };

      const response = await createTest(testData);

      // Navigate to test editor
      router.push(`/tests/${response.test.id}/edit`);
    } catch (err: any) {
      console.error('Error creating test:', err);
      setError(err.message || 'Failed to create test');
      setIsCreating(false);
    }
  };

  const handlePdfClick = (test: Test, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestForPdf(test);
    setIncludeImages(true);
    setPdfDialogOpen(true);
  };

  const handleGeneratePDF = async () => {
    if (!testForPdf) return;

    try {
      setIsGeneratingPDF(true);
      setError(null);

      // Fetch test with tasks
      const testData = await fetchTestById(testForPdf.id);

      if (testData.tasks.length === 0) {
        setError('Cannot generate PDF - test has no tasks');
        setIsGeneratingPDF(false);
        return;
      }

      console.log('[MyTests] Starting PDF generation...');

      // Resolve task data for library tasks
      const resolvedTaskData: { [key: string]: any } = {};
      for (const task of testData.tasks) {
        if (task.taskId) {
          try {
            const libraryTask = await fetchTaskById(task.taskId);
            resolvedTaskData[task.id] = libraryTask.data;
          } catch (err) {
            console.error('[MyTests] Error loading library task:', task.taskId, err);
          }
        }
      }

      // Helper functions
      const getTaskTitle = (task: any): string => {
        if (task.overrideTitle) return task.overrideTitle;
        if (task.customTitle) return task.customTitle;
        if (task.taskId && resolvedTaskData[task.id]) {
          return resolvedTaskData[task.id].title || 'Untitled Task';
        }
        return 'Untitled Task';
      };

      const getTaskDescription = (task: any): string => {
        if (task.overrideText) return task.overrideText;
        if (task.customText) return task.customText;
        if (task.taskId && resolvedTaskData[task.id]) {
          return resolvedTaskData[task.id].content?.description || '';
        }
        return '';
      };

      // Prepare test data for PDF generation
      const pdfData: TestPDFData = {
        id: testForPdf.id,
        name: testForPdf.name,
        subject: testForPdf.subject,
        gradeLevel: testForPdf.gradeLevel,
        description: testForPdf.description,
        tasks: testData.tasks.map((task: any) => {
          const title = getTaskTitle(task);
          const description = getTaskDescription(task);
          const libraryTask = task.taskId ? resolvedTaskData[task.id] : null;

          return {
            title,
            description,
            images: includeImages && task.showImage && libraryTask?.content?.images ? libraryTask.content.images : [],
            questions: task.customQuestions,
            score: task.score,
            showImage: includeImages && task.showImage,
          };
        }),
      };

      console.log('[MyTests] Generating PDF with data:', pdfData);

      // Generate PDF
      const pdfDataUri = await generateTestPDF(pdfData);

      // Create download link
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${testForPdf.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setPdfDialogOpen(false);
      setTestForPdf(null);
    } catch (err: any) {
      console.error('[MyTests] Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareClick = async (test: Test, e: React.MouseEvent) => {
    e.stopPropagation();
    setTestToShare(test);

    try {
      // Generate QR code for the test link
      // Note: This generates a unique link based on test ID, not the public link
      const shareUrl = test.publicLink
        ? `${window.location.origin}${test.publicLink}`
        : `${window.location.origin}/tests/${test.id}/view`;

      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
      setShareDialogOpen(true);
    } catch (err) {
      console.error('[MyTests] Error generating QR code:', err);
      setError('Failed to generate QR code');
    }
  };

  const handleCopyShareLink = () => {
    if (!testToShare) return;

    const shareUrl = testToShare.publicLink
      ? `${window.location.origin}${testToShare.publicLink}`
      : `${window.location.origin}/tests/${testToShare.id}/view`;

    navigator.clipboard.writeText(shareUrl);
    setError(null);
    // Show success feedback
    const successDiv = document.createElement('div');
    successDiv.textContent = 'Link copied to clipboard!';
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 12px 24px; border-radius: 4px; z-index: 9999;';
    document.body.appendChild(successDiv);
    setTimeout(() => document.body.removeChild(successDiv), 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {t('My Tests/Worksheets')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('View and manage all tests and worksheets you\'ve created')}
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Empty State or Test List */}
        {hasNoTests ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              px: 2,
            }}
          >
            <Typography variant="h6" component="div" gutterBottom>
              {t('No Tests Yet')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {t('You haven\'t created any tests yet. Start by creating your first test/worksheet!')}
            </Typography>
            <Button
              variant="primary"
              onClick={handleCreateDialogOpen}
              startIcon={<AddIcon />}
            >
              {t('Create Your First Test')}
            </Button>
          </Box>
        ) : (
          <>
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="primary"
                onClick={handleCreateDialogOpen}
                startIcon={<AddIcon />}
              >
                {t('Create New Test')}
              </Button>
            </Box>

            {/* Test List */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {paginatedTests.map((test) => (
                <Card
                  key={test.id}
                  sx={{
                    p: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => router.push(`/tests/${test.id}/edit`)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Test Icon */}
                    <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main', mt: 0.5 }} />

                    {/* Test Info */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {test.name}
                      </Typography>

                      {test.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {test.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={test.subject.charAt(0).toUpperCase() + test.subject.slice(1)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {test.gradeLevel && (
                          <Chip
                            label={test.gradeLevel.replace('grade_', 'Grade ').replace('_', '-')}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={`${test.taskCount} ${test.taskCount === 1 ? 'task' : 'tasks'}`}
                          size="small"
                          variant="outlined"
                        />
                        {test.totalScore && (
                          <Chip
                            label={`${test.totalScore} points`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {t('Created')}: {formatDate(test.createdAt)} | {t('Updated')}: {formatDate(test.updatedAt)}
                      </Typography>

                      {test.publicLink && (
                        <Box sx={{ mt: 1 }}>
                          <Chip
                            icon={<ShareIcon />}
                            label="Published"
                            size="small"
                            color="success"
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Actions */}
                    <CardActions sx={{ gap: 1, flexDirection: 'column', alignItems: 'stretch' }}>
                      <Button
                        variant="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/tests/${test.id}/edit`);
                        }}
                        startIcon={<EditIcon />}
                      >
                        {t('Edit')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={(e) => handlePdfClick(test, e)}
                        startIcon={<PictureAsPdfIcon />}
                      >
                        {t('PDF')}
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={(e) => handleShareClick(test, e)}
                        startIcon={<ShareIcon />}
                      >
                        Share
                      </Button>
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={(e) => handleDeleteClick(test, e)}
                        startIcon={<DeleteIcon />}
                        sx={{
                          '&:hover': {
                            bgcolor: 'error.light',
                            borderColor: 'error.main',
                            '& .MuiSvgIcon-root': { color: 'error.dark' }
                          }
                        }}
                      >
                        {t('Delete')}
                      </Button>
                    </CardActions>
                  </Box>
                </Card>
              ))}
            </Box>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={tests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </>
        )}

      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>{t('Delete Test')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('Are you sure you want to delete this test? This action cannot be undone.')}
            {testToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {testToDelete.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {testToDelete.taskCount} {testToDelete.taskCount === 1 ? 'task' : 'tasks'}
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

      {/* Create Test Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={handleCreateDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('Create New Test')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('Test Name')}
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="e.g., Algebra Quiz #1, Final Exam"
            />

            <SubjectSelector
              label={t('Subject')}
              value={newTestSubject}
              onChange={(subject) => setNewTestSubject(subject as Subject)}
              type="select"
              required
              fullWidth
            />

            <TextField
              label={t('Grade Level (optional)')}
              value={newTestGradeLevel}
              onChange={(e) => setNewTestGradeLevel(e.target.value)}
              select
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="grade_1_4">Grade 1-4</MenuItem>
              <MenuItem value="grade_5_8">Grade 5-8</MenuItem>
              <MenuItem value="grade_9_10">Grade 9-10</MenuItem>
              <MenuItem value="grade_11_12">Grade 11-12</MenuItem>
            </TextField>

            <TextField
              label={t('Description (optional)')}
              value={newTestDescription}
              onChange={(e) => setNewTestDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              placeholder="Add a brief description of this test..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={handleCreateDialogClose} disabled={isCreating}>
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateTest}
            disabled={isCreating || !newTestName.trim()}
          >
            {isCreating ? t('Creating...') : t('Create & Edit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Generation Dialog */}
      <Dialog
        open={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdfIcon color="primary" />
            {t('Download PDF')}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Configure PDF settings for: <strong>{testForPdf?.name}</strong>
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                disabled={isGeneratingPDF}
              />
            }
            label="Include images in PDF"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {includeImages
              ? 'Images will be included in the PDF'
              : 'PDF will be generated without images'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setPdfDialogOpen(false)} disabled={isGeneratingPDF}>
            {t('Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            startIcon={<PictureAsPdfIcon />}
          >
            {isGeneratingPDF ? t('Generating...') : t('Download PDF')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog with QR Code */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShareIcon color="primary" />
            Share Test
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {testToShare?.publicLink
              ? 'This test has been published. Share the public link:'
              : 'Share a unique link to this test (teacher access only):'}
          </Typography>

          {/* Share Link */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {testToShare?.publicLink ? t('Public Link') : 'Unique Link'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={
                  testToShare?.publicLink
                    ? `${window.location.origin}${testToShare.publicLink}`
                    : testToShare
                    ? `${window.location.origin}/tests/${testToShare.id}/view`
                    : ''
                }
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: '0.9rem' },
                }}
              />
              <Tooltip title="Copy link">
                <IconButton onClick={handleCopyShareLink}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* QR Code */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              QR Code
            </Typography>
            {qrCodeDataUrl && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                />
              </Box>
            )}
            <Typography variant="body2" color="text.secondary">
              Scan this QR code to access the test
            </Typography>
          </Box>

          {!testToShare?.publicLink && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This is a private link. To create a public link, edit the test and use the &quot;Publish to Public&quot; button.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setShareDialogOpen(false)}>
            {t('Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
