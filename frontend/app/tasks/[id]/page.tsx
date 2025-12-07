'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Script from 'next/script';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Alert,
  IconButton,
  Snackbar,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { processLatexInHtml } from '@/lib/utils/latex-converter';
import { useTranslation } from '@/lib/i18n';
import { fetchTaskById } from '@/lib/services/api.service';

interface TaskData {
  id: string;
  title: string;
  description: string;
  content: {
    description: string;
    solution: string;
    images: string[];
  };
  subject: string;
  gradeLevel: string;
  schoolSystem: string;
  difficultyLevel: string;
  created_at: string;
  creatorName: string;
  ratingAverage: number;
  ratingCount: number;
  viewCount: number;
  subjectMappingPath?: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [latexReady, setLatexReady] = useState(false);

  const descriptionRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // NOTE: Backend must extract country from task ID or query string
        // and fetch from: countries/{country}/tasks/{taskId}
        // See DATABASE_STRUCTURE.md for details
        const data = await fetchTaskById(taskId, true);

        if (data.success && data.data) {
          setTask(data.data);
        } else {
          setError(data.message || 'Task not found');
        }
      } catch (err: any) {
        console.error('Error fetching task:', err);
        setError(err.message || 'Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // Process LaTeX after content loads and latex.js is loaded
  useEffect(() => {
    if (!latexReady || !task) {
      retryCountRef.current = 0;
      return;
    }

    const processLatex = () => {
      if (typeof window !== 'undefined' && (window as any).S2Latex && typeof (window as any).S2Latex.processTree === 'function') {
        try {
          retryCountRef.current = 0;
          if (descriptionRef.current) {
            (window as any).S2Latex.processTree(descriptionRef.current);
          }
          if (solutionRef.current) {
            (window as any).S2Latex.processTree(solutionRef.current);
          }
          console.log('✅ LaTeX rendering completed successfully');
        } catch (error) {
          console.error('LaTeX processing error:', error);
        }
      } else if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`S2Latex not available yet, retry ${retryCountRef.current}/${maxRetries}...`);
        setTimeout(processLatex, 500);
      } else {
        console.error('S2Latex failed to load after maximum retries. LaTeX rendering unavailable.');
      }
    };

    const timer = setTimeout(processLatex, 200);
    return () => {
      clearTimeout(timer);
      retryCountRef.current = 0;
    };
  }, [task, latexReady]);

  const handleCopyShareLink = async () => {
    const shareLink = `${window.location.origin}/tasks/${taskId}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShowCopySuccess(true);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownloadPDF = async () => {
    // TODO: Implement PDF generation
    alert('PDF download functionality will be implemented soon!');
  };

  const handleBack = () => {
    router.push('/tasks');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task..." fullScreen />;
  }

  if (error || !task) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Task not found'}
        </Alert>
        <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t('Back to Tasks')}
        </Button>
      </Container>
    );
  }

  // Process image placeholders to inject actual image tags
  const processImagePlaceholders = (html: string, images: any[]): string => {
    if (!images || images.length === 0) return html;

    let processedHtml = html;
    images.forEach((image, index) => {
      const placeholder = `[IMAGE_${index + 1}]`;
      const imageUrl = typeof image === 'string' ? image : image.url;
      const imgTag = `<img src="${imageUrl}" alt="Task illustration ${index + 1}" style="width: 100%; max-width: 50%; height: auto; margin: 10px 0 10px 20px; border-radius: 8px; float: right; clear: right;" class="task-image task-image-${index + 1}" />`;
      processedHtml = processedHtml.replace(placeholder, imgTag);
    });
    return processedHtml;
  };

  const descriptionWithImages = processImagePlaceholders(
    task.content.description || task.description,
    task.content.images
  );
  const processedDescription = processLatexInHtml(descriptionWithImages);
  const processedSolution = processLatexInHtml(task.content.solution);

  return (
    <>
      <Script
        src="/lib/utils/latex.js"
        strategy="afterInteractive"
        onLoad={() => setLatexReady(true)}
      />
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
          {t('Back to Tasks')}
        </Button>
      </Box>

      {/* Task Header */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
          <Chip
            icon={<SchoolIcon />}
            label={task.gradeLevel.replace('grade_', 'Grade ').replace('_', '-')}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={task.subject}
            color="secondary"
            variant="outlined"
          />
          <Chip
            label={`${t('Difficulty')}: ${task.difficultyLevel}`}
            variant="outlined"
          />
          <Chip
            label={task.schoolSystem}
            variant="outlined"
          />
        </Stack>

        {task.subjectMappingPath && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {task.subjectMappingPath}
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
          <CalendarTodayIcon fontSize="small" />
          {t('Created by')} {task.creatorName} on {new Date(task.created_at).toLocaleDateString()}
        </Typography>

        {/* Task Statistics */}
        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarIcon sx={{ fontSize: 20, color: 'warning.main' }} />
            <Typography variant="body2" fontWeight={600}>
              {task.ratingAverage > 0 ? task.ratingAverage.toFixed(1) : 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({task.ratingCount} {task.ratingCount === 1 ? t('review') : t('reviews')})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <VisibilityIcon sx={{ fontSize: 20, color: 'info.main' }} />
            <Typography variant="body2" fontWeight={600}>
              {task.viewCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('Views')}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="primary"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyShareLink}
          >
            {t('Copy Share Link')}
          </Button>
          <Button
            variant="secondary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            {t('Download PDF')}
          </Button>
        </Stack>
      </Paper>

      {/* Task Description */}
      <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={600}>
          {t('Task')}
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box
          ref={descriptionRef}
          sx={{
            '& h1': { fontSize: '1.75rem', fontWeight: 600, mb: 2 },
            '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 2, mt: 3 },
            '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1.5, mt: 2 },
            '& p': { mb: 2, lineHeight: 1.7 },
            '& ol, & ul': { mb: 2, pl: 3 },
            '& li': { mb: 1 },
            '& .story': {
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              p: 3,
              borderRadius: 2,
              mb: 3,
              borderLeft: '4px solid',
              borderColor: 'primary.main'
            },
            '& .task-image': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              '@media (max-width: 768px)': {
                maxWidth: '100% !important',
                float: 'none !important',
                margin: '1rem 0 !important',
              }
            },
          }}
          dangerouslySetInnerHTML={{ __html: processedDescription }}
        />
      </Paper>

      {/* Solution Section (Collapsible) */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Accordion defaultExpanded={false}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {t('Solution')}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 4 }}>
            <Box
              ref={solutionRef}
              sx={{
                '& h1': { fontSize: '1.75rem', fontWeight: 600, mb: 2 },
                '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 2, mt: 3 },
                '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1.5, mt: 2 },
                '& p': { mb: 2, lineHeight: 1.7 },
                '& ol, & ul': { mb: 2, pl: 3 },
                '& li': { mb: 1 },
                '& .solution-step': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)',
                  p: 3,
                  borderRadius: 2,
                  mb: 3,
                  borderLeft: '4px solid',
                  borderColor: 'secondary.main',
                },
                '& strong': { fontWeight: 600 },
                '& em': { fontStyle: 'italic', color: 'text.secondary' },
              }}
              dangerouslySetInnerHTML={{ __html: processedSolution }}
            />
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={showCopySuccess}
        autoHideDuration={3000}
        onClose={() => setShowCopySuccess(false)}
        message={t('Share link copied to clipboard!')}
      />
    </Container>
    </>
  );
}
