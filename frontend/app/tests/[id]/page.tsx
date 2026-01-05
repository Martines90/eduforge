'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Chip,
  Divider,
  Card,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ShareIcon from '@mui/icons-material/Share';
import QrCodeIcon from '@mui/icons-material/QrCode';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useTranslation } from '@/lib/i18n';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { fetchPublishedTest, createTest, addTaskToTest, uploadTestPDF } from '@/lib/services/test.service';
import { PublishedTest } from '@/types/test.types';
import { generateTestPDF, TestPDFData } from '@/lib/utils/pdf-generator';
import QRCode from 'qrcode';

/**
 * Test View Page - For viewing tests from Test Library (Teachers Only)
 * Shows test details with options to: Add to My Tests, Download PDF, Share with QR
 */
export default function TestViewPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  const { t } = useTranslation();
  const { isAuthorized, isLoading: authLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });

  const [test, setTest] = useState<PublishedTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // PDF generation state
  const [includeImages, setIncludeImages] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Share dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  // Add to My Tests state
  const [isAddingToMyTests, setIsAddingToMyTests] = useState(false);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[TestView] Loading test:', testId);
        const response = await fetchPublishedTest(testId);
        console.log('[TestView] Test loaded:', response);
        setTest(response.test);
      } catch (err: any) {
        console.error('[TestView] Error loading test:', err);
        setError(err.message || 'Failed to load test');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthorized && testId) {
      loadTest();
    }
  }, [isAuthorized, testId]);

  if (authLoading || isLoading) {
    return <LoadingSpinner message={t('Loading test...')} fullScreen />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message={t('Redirecting...')} fullScreen />;
  }

  if (error || !test) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || t('Test not found')}
        </Alert>
        <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={() => router.push('/test-library')}>
          Back to Test Library
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleAddToMyTests = async () => {
    try {
      setIsAddingToMyTests(true);
      setError(null);

      // Create a new test
      const createResponse = await createTest({
        name: test.name,
        subject: test.subject,
        gradeLevel: test.gradeLevel,
        description: test.description,
      });

      const newTestId = createResponse.test.id;

      // Add all tasks to the new test
      for (const task of test.tasks) {
        await addTaskToTest(newTestId, {
          taskId: task.originalTaskId || undefined,
          customTitle: !task.originalTaskId ? task.title : undefined,
          customText: !task.originalTaskId ? task.text : undefined,
          customQuestions: !task.originalTaskId ? task.questions : undefined,
          showImage: !!task.imageUrl,
          score: task.score,
        });
      }

      setSuccess('Test added to My Tests successfully!');

      // Redirect to the new test editor after a short delay
      setTimeout(() => {
        router.push(`/tests/${newTestId}/edit`);
      }, 1500);
    } catch (err: any) {
      console.error('[TestView] Error adding test to My Tests:', err);
      setError(err.message || 'Failed to add test to My Tests');
    } finally {
      setIsAddingToMyTests(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setError(null);

      if (test.tasks.length === 0) {
        setError('Cannot generate PDF - test has no tasks');
        return;
      }

      console.log('[TestView] Starting PDF generation...');

      // Prepare test data for PDF generation
      const pdfData: TestPDFData = {
        id: test.publicId,
        name: test.name,
        subject: test.subject,
        gradeLevel: test.gradeLevel,
        description: test.description,
        tasks: test.tasks.map((task) => ({
          title: task.title,
          description: task.text,
          images: includeImages && task.imageUrl ? [task.imageUrl] : [],
          questions: task.questions,
          score: task.score,
          showImage: includeImages && !!task.imageUrl,
        })),
      };

      console.log('[TestView] Generating PDF with data:', pdfData);

      // Generate PDF
      const pdfDataUri = await generateTestPDF(pdfData);

      // Create download link
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${test.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('PDF downloaded successfully!');
    } catch (err: any) {
      console.error('[TestView] Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareClick = async () => {
    try {
      // Generate QR code for the public link
      const publicUrl = `${window.location.origin}/published-tests/${test.publicId}`;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
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
      console.error('[TestView] Error generating QR code:', err);
      setError('Failed to generate QR code');
    }
  };

  const handleCopyPublicLink = () => {
    const publicUrl = `${window.location.origin}/published-tests/${test.publicId}`;
    navigator.clipboard.writeText(publicUrl);
    setSuccess('Public link copied to clipboard!');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <DescriptionIcon sx={{ fontSize: 50, color: 'primary.main' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
              {test.name}
            </Typography>

            {test.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {test.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              <Chip
                icon={<SchoolIcon />}
                label={test.subject.charAt(0).toUpperCase() + test.subject.slice(1)}
                color="primary"
              />
              {test.gradeLevel && (
                <Chip
                  label={test.gradeLevel.replace('grade_', 'Grade ').replace('_', '-')}
                  variant="outlined"
                />
              )}
              <Chip
                label={`${test.taskCount} ${test.taskCount === 1 ? 'task' : 'tasks'}`}
                variant="outlined"
              />
              {test.totalScore && (
                <Chip
                  label={`${test.totalScore} points`}
                  variant="outlined"
                />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary">
              {t('Created by')} {test.creatorName} • {t('Published')} {formatDate(test.publishedAt)}
            </Typography>

            {test.viewCount > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {test.viewCount} {test.viewCount === 1 ? 'view' : 'views'}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/test-library')}
          >
            Back to Library
          </Button>

          <Button
            variant="primary"
            startIcon={<AddIcon />}
            onClick={handleAddToMyTests}
            disabled={isAddingToMyTests}
          >
            {isAddingToMyTests ? t('Adding...') : 'Add to My Tests'}
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="secondary"
            startIcon={<ShareIcon />}
            onClick={handleShareClick}
          >
            Share Test
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  disabled={isGeneratingPDF}
                />
              }
              label="Include Images"
            />
            <Button
              variant="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? t('Generating...') : t('Download PDF')}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tasks List */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        {t('Tasks')}
      </Typography>

      {test.tasks.length === 0 ? (
        <Alert severity="info">{t('This test has no tasks')}</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {test.tasks.map((task, index) => (
            <Card key={index} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Typography variant="h6" sx={{ minWidth: 40 }}>
                  {index + 1}.
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {task.title}
                  </Typography>

                  {task.text && (
                    <Box
                      sx={{
                        mb: 2,
                        '& p': { mb: 1 },
                        '& h1, & h2, & h3': { fontWeight: 600, mb: 1 },
                        '& ul, & ol': { mb: 1, pl: 3 },
                      }}
                      dangerouslySetInnerHTML={{ __html: task.text }}
                    />
                  )}

                  {task.imageUrl && (
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={task.imageUrl}
                        alt={`Task ${index + 1} illustration`}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Box>
                  )}

                  {task.questions && task.questions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        {t('Questions')}:
                      </Typography>
                      <Box component="ol" sx={{ pl: 3, mb: 0 }}>
                        {task.questions.map((q, qIndex) => (
                          <Box component="li" key={qIndex} sx={{ mb: 1 }}>
                            <Typography variant="body2">
                              {q.question}
                              {q.score && (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{ ml: 1, color: 'primary.main', fontWeight: 600 }}
                                >
                                  ({q.score} {q.score === 1 ? 'point' : 'points'})
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {task.score && (
                    <Chip
                      label={`${task.score} ${task.score === 1 ? 'point' : 'points'}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      )}

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
            Share this test with a public link or QR code:
          </Typography>

          {/* Public Link */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('Public Link')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                value={`${window.location.origin}/published-tests/${test.publicId}`}
                fullWidth
                InputProps={{
                  readOnly: true,
                  sx: { fontSize: '0.9rem' },
                }}
              />
              <Tooltip title="Copy link">
                <IconButton onClick={handleCopyPublicLink}>
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
