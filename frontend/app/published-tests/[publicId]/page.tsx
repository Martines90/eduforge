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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { useTranslation } from '@/lib/i18n';
import { fetchPublishedTest } from '@/lib/services/test.service';
import { PublishedTest } from '@/types/test.types';

/**
 * Published Test View Page - Public Access
 * Anyone with the link can view this page (no authentication required)
 */
export default function PublishedTestPage() {
  const params = useParams();
  const router = useRouter();
  const publicId = params?.publicId as string;
  const { t } = useTranslation();

  const [test, setTest] = useState<PublishedTest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTest = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('[PublishedTest] Loading test:', publicId);
        const response = await fetchPublishedTest(publicId);
        console.log('[PublishedTest] Test loaded:', response);
        setTest(response.test);
      } catch (err: any) {
        console.error('[PublishedTest] Error loading test:', err);
        setError(err.message || 'Failed to load test');
      } finally {
        setIsLoading(false);
      }
    };

    if (publicId) {
      loadTest();
    }
  }, [publicId]);

  if (isLoading) {
    return <LoadingSpinner message={t('Loading test...')} fullScreen />;
  }

  if (error || !test) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || t('Test not found')}
        </Alert>
        <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={() => router.push('/')}>
          {t('Back to Home')}
        </Button>
      </Container>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleDownloadPDF = () => {
    if (test.pdfUrl) {
      window.open(test.pdfUrl, '_blank');
    } else {
      alert(t('PDF is not available for this test'));
    }
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {t('Created by')} {test.creatorName} • {t('Published')} {formatDate(test.publishedAt)}
              </Typography>
            </Box>

            {test.viewCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {test.viewCount} {test.viewCount === 1 ? 'view' : 'views'}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={() => router.push('/')}>
            {t('Back to Home')}
          </Button>
          {test.pdfUrl && (
            <Button
              variant="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleDownloadPDF}
            >
              {t('Download PDF')}
            </Button>
          )}
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

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('This is a publicly shared test. You can create your own tests at')}{' '}
          <a href="/" style={{ color: 'inherit' }}>
            EduForge
          </a>
        </Typography>
      </Box>
    </Container>
  );
}
