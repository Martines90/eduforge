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
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { processLatexInHtml } from '@/lib/utils/latex-converter';
import { useTranslation } from '@/lib/i18n';
import { fetchTaskById } from '@/lib/services/api.service';
import { useUser } from '@/lib/context/UserContext';
import { useSnackbar } from 'notistack';
import { LoginModal } from '@/components/organisms/LoginModal';
import { RegistrationModal } from '@/components/organisms/RegistrationModal';
import { useGuestTaskViewLimit } from '@/lib/hooks/useGuestTaskViewLimit';
import { TRIAL_START_CREDITS } from '@/lib/constants/credits';

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
  educationalModel: string;
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
  const { user, registerUser, loginUser, setCountry, setIdentity, setSubject, setEducationalModel } = useUser();
  const { enqueueSnackbar } = useSnackbar();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [latexReady, setLatexReady] = useState(false);

  // Registration modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  const isGuest = !user.isRegistered;

  // Guest task view limit
  const guestViewLimit = useGuestTaskViewLimit();

  const descriptionRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  // Track guest task views on mount
  useEffect(() => {
    if (isGuest && taskId) {
      console.log('[Task Detail] Guest task view detected for task:', taskId);
      guestViewLimit.incrementView();
      console.log('[Task Detail] Total views:', guestViewLimit.totalViews + 1, 'Remaining:', guestViewLimit.viewsRemaining - 1);
    }
  }, []); // Only run once on mount

  // Clear guest views when user registers
  useEffect(() => {
    if (!isGuest) {
      guestViewLimit.clearViews();
    }
  }, [isGuest, guestViewLimit]);

  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      setError(null);

      // Check guest view limit BEFORE fetching task
      if (isGuest && !guestViewLimit.canViewTasks) {
        console.log('[Task Detail] Guest has reached view limit, blocking task fetch');
        setIsLoading(false);
        setError('VIEW_LIMIT_REACHED');
        return;
      }

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
  }, [taskId, isGuest, guestViewLimit.canViewTasks]);

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
    if (!task) return;

    // Block PDF download for guests
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    // Check if PDF already exists in the task document
    if ((task as any).pdfUrl) {
      console.log('[PDF] Using existing PDF URL:', (task as any).pdfUrl);
      // Direct download from Firebase Storage
      window.open((task as any).pdfUrl, '_blank');
      return;
    }

    try {
      console.log('[PDF] Starting PDF generation...');
      console.log('[PDF] Task data:', {
        id: task.id,
        title: task.title,
        hasDescription: !!task.content?.description,
        hasImages: !!task.content?.images,
        imageCount: task.content?.images?.length || 0
      });

      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      // Create a temporary container for PDF rendering
      // IMPORTANT: Must be visible for html2canvas to capture content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'fixed';
      pdfContainer.style.top = '-10000px'; // Off-screen but still rendered
      pdfContainer.style.left = '0';
      pdfContainer.style.width = '210mm'; // A4 width
      pdfContainer.style.padding = '20mm';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.fontSize = '14px';
      pdfContainer.style.lineHeight = '1.6';
      pdfContainer.style.color = '#333';
      pdfContainer.style.visibility = 'visible'; // Must be visible for canvas capture
      pdfContainer.style.opacity = '1'; // Must be fully opaque for canvas capture
      pdfContainer.style.pointerEvents = 'none';

      // Process image placeholders with PDF-optimized styling
      const processImagePlaceholdersForPDF = (html: string, images: any[]): string => {
        console.log('[PDF] Processing image placeholders:', { imagesCount: images?.length || 0 });
        if (!images || images.length === 0) return html;

        // Filter out invalid images
        const validImages = images.filter((img: any) => {
          const url = typeof img === 'string' ? img : img?.url;
          return url && url.trim() !== '';
        });

        console.log('[PDF] Valid images:', validImages.length);
        if (validImages.length === 0) return html;

        let processedHtml = html;
        validImages.forEach((image: any, index: number) => {
          const placeholder = `[IMAGE_${index + 1}]`;
          let imageUrl = typeof image === 'string' ? image : image.url;

          // Decode HTML entities in URL (fixes &amp; in Azure Blob Storage URLs)
          imageUrl = decodeHtmlEntities(imageUrl);
          console.log(`[PDF] Processing image ${index + 1}:`, imageUrl);

          // PDF-optimized: centered, full width (max 600px), no float
          const imgTag = `<img src="${imageUrl}" crossorigin="anonymous" alt="Task illustration ${index + 1}" style="display: block; width: 100%; max-width: 600px; height: auto; margin: 20px auto; border-radius: 8px;" class="task-image task-image-${index + 1}" />`;
          processedHtml = processedHtml.replace(placeholder, imgTag);
        });
        return processedHtml;
      };

      // Build the PDF content with task description
      const descriptionWithImages = processImagePlaceholdersForPDF(
        task.content.description || task.description,
        task.content.images
      );

      console.log('[PDF] Description HTML length:', descriptionWithImages.length);
      console.log('[PDF] Description HTML snippet:', descriptionWithImages.substring(0, 200));

      pdfContainer.innerHTML = `
        <div style="padding: 10px;">
          <div style="font-size: 14px; line-height: 1.8;">
            ${processLatexInHtml(descriptionWithImages)}
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);
      console.log('[PDF] Container added to DOM, innerHTML length:', pdfContainer.innerHTML.length);

      // Process all images to ensure they're loaded
      const images = pdfContainer.getElementsByTagName('img');
      console.log(`[PDF] Found ${images.length} img tags in container`);

      const imagePromises = Array.from(images).map((img, idx) => {
        return new Promise((resolve) => {
          console.log(`[PDF] Checking image ${idx + 1}:`, img.src);
          if (img.complete && img.naturalHeight !== 0) {
            console.log(`[PDF] Image ${idx + 1} already loaded`);
            resolve(null);
          } else {
            const timeout = setTimeout(() => {
              console.warn(`[PDF] Image ${idx + 1} load timeout: ${img.src}`);
              resolve(null);
            }, 15000); // Increased timeout to 15 seconds

            img.onload = () => {
              clearTimeout(timeout);
              console.log(`[PDF] Image ${idx + 1} loaded successfully`);
              resolve(null);
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error(`[PDF] Failed to load image ${idx + 1}: ${img.src}`, error);
              resolve(null);
            };
          }
        });
      });

      // Wait for all images to load (or timeout)
      console.log(`[PDF] Waiting for ${images.length} image(s) to load...`);
      await Promise.all(imagePromises);
      console.log(`[PDF] All images processed`);

      // Render LaTeX if available with better waiting mechanism
      if (typeof window !== 'undefined' && (window as any).S2Latex && typeof (window as any).S2Latex.processTree === 'function') {
        console.log('[PDF] Processing LaTeX...');
        (window as any).S2Latex.processTree(pdfContainer);

        // Wait for LaTeX rendering with timeout
        await new Promise(resolve => {
          let checks = 0;
          const maxChecks = 20;

          const checkInterval = setInterval(() => {
            checks++;
            const latexElements = pdfContainer.querySelectorAll('[class*="latex"], [class*="katex"]');
            if (latexElements.length > 0 || checks >= maxChecks) {
              clearInterval(checkInterval);
              console.log(`[PDF] LaTeX rendering complete (checks: ${checks})`);
              resolve(null);
            }
          }, 100);
        });
      }

      // Configure PDF options - simplified for debugging
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `task_${taskId}.pdf`,
        image: {
          type: 'jpeg' as const,
          quality: 0.95
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0,
          windowWidth: pdfContainer.scrollWidth,
          windowHeight: pdfContainer.scrollHeight,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      // Give browser time to fully render everything
      console.log('[PDF] Waiting for final rendering...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('[PDF] Starting PDF conversion...');
      console.log('[PDF] Container dimensions:', {
        width: pdfContainer.offsetWidth,
        height: pdfContainer.offsetHeight,
        scrollHeight: pdfContainer.scrollHeight
      });

      // Generate and download PDF using direct html2canvas + jsPDF approach
      try {
        // Import html2canvas and jsPDF directly
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');

        console.log('[PDF] Capturing canvas with html2canvas...');

        // Capture the container as a canvas
        const canvas = await html2canvas(pdfContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
          backgroundColor: '#ffffff',
          windowWidth: pdfContainer.scrollWidth,
          windowHeight: pdfContainer.scrollHeight,
        });

        console.log('[PDF] Canvas captured:', {
          width: canvas.width,
          height: canvas.height
        });

        // Convert canvas to image
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        console.log('[PDF] Image data length:', imgData.length);

        // Calculate PDF dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth - 20; // 10mm margins on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        console.log('[PDF] Adding image to PDF:', { pdfWidth, pdfHeight, imgWidth, imgHeight });

        let heightLeft = imgHeight;
        let position = 10; // top margin

        // Add image to first page
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Add new pages if content is longer than one page
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        // Save the PDF
        pdf.save(`task_${taskId}.pdf`);
        console.log('[PDF] PDF saved successfully!');
      } catch (pdfError) {
        console.error('[PDF] PDF generation error:', pdfError);
        throw pdfError;
      }

      // Remove temporary container after a short delay
      setTimeout(() => {
        if (document.body.contains(pdfContainer)) {
          document.body.removeChild(pdfContainer);
          console.log('[PDF] Container removed');
        }
      }, 500);
    } catch (error) {
      console.error('PDF generation error:', error);

      let errorMessage = t('An error occurred while generating the PDF.');

      if (error instanceof Error) {
        console.error('[PDF] Error details:', {
          message: error.message,
          stack: error.stack
        });

        if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
          errorMessage = t('Image loading failed due to CORS restrictions. The images may not be accessible from this domain.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('Network error while loading images. Please check your internet connection.');
        } else if (error.message.includes('timeout')) {
          errorMessage = t('Image loading timed out. Please try again or check image URLs.');
        }
      }

      alert(`${errorMessage}\n\n${t('Please try again or contact support if the problem persists.')}`);
    }
  };

  const handleBack = () => {
    router.push('/tasks');
  };

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      await loginUser(email, password);
      setShowLoginModal(false);
    } catch (error) {
      throw error;
    }
  };

  // Handle registration
  const handleRegister = async (profile: any) => {
    try {
      const userProfile = {
        name: profile.name,
        email: profile.email,
        registeredAt: new Date().toISOString(),
        token: localStorage.getItem('authToken') || '',
      };

      registerUser(userProfile);
      setCountry(profile.country);
      setIdentity(profile.identity);

      if (profile.subject) {
        setSubject(profile.subject);
      }

      if (profile.educationalModel) {
        setEducationalModel(profile.educationalModel);
      }

      setShowRegisterModal(false);

      // Show success message
      enqueueSnackbar(t('Registration successful! Enjoy your free 3-month trial!'), {
        variant: 'success',
        autoHideDuration: 5000,
      });

      // Stay on current page
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  };

  const handleCreateAccountClick = (isTeacherAccount: boolean) => {
    setIsTeacher(isTeacherAccount);
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleBackToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading task..." fullScreen />;
  }

  // Show registration prompt if guest has reached view limit
  if (error === 'VIEW_LIMIT_REACHED') {
    return (
      <>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Button variant="secondary" startIcon={<ArrowBackIcon />} onClick={handleBack}>
              {t('Back to Tasks')}
            </Button>
          </Box>

          <Paper
            elevation={3}
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: 'background.paper',
              maxWidth: 700,
              mx: 'auto',
            }}
          >
            <AssignmentIcon
              sx={{
                fontSize: 100,
                color: 'primary.main',
                mb: 3,
              }}
            />
            <Typography variant="h4" component="h2" gutterBottom>
              {t('Registration Required')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', mb: 3 }}>
              {t('To have access to the tasks you need to register!')}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ fontSize: '1.1rem', mb: 4 }}>
              {t('Try our FREE 3-month trial mode and unlock unlimited access to thousands of educational tasks.')}
            </Typography>
            <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{t('You\'ve used your 3 free task views.')}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {t('Register now to get:')}
              </Typography>
              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>{t('Unlimited task viewing')}</li>
                <li>{t('{{count}} free task generation credits', { count: TRIAL_START_CREDITS })}</li>
                <li>{t('3 months free trial subscription')}</li>
                <li>{t('Download tasks as PDF')}</li>
              </ul>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="large"
                onClick={() => setShowLoginModal(true)}
              >
                {t('Login / Register')}
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => router.push('/')}
              >
                {t('Back to Home')}
              </Button>
            </Box>
          </Paper>
        </Container>

        {/* Login Modal */}
        <LoginModal
          open={showLoginModal}
          onLogin={handleLogin}
          onCreateAccount={handleCreateAccountClick}
        />

        {/* Registration Modal */}
        <RegistrationModal
          open={showRegisterModal}
          onRegister={handleRegister}
          onBack={handleBackToLogin}
          detectedCountry={user.country}
          isTeacher={isTeacher}
        />
      </>
    );
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

  // Helper to decode HTML entities in URLs (fixes &amp; issue with Azure Blob Storage)
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Process image placeholders to inject actual image tags
  const processImagePlaceholders = (html: string, images: any[]): string => {
    if (!images || images.length === 0) return html;

    // Filter out invalid images
    const validImages = images.filter((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      return url && url.trim() !== '';
    });

    if (validImages.length === 0) return html;

    let processedHtml = html;
    validImages.forEach((image: any, index: number) => {
      const placeholder = `[IMAGE_${index + 1}]`;
      let imageUrl = typeof image === 'string' ? image : image.url;

      // Decode HTML entities in URL (fixes &amp; in Azure Blob Storage URLs)
      imageUrl = decodeHtmlEntities(imageUrl);

      const imgTag = `<img src="${imageUrl}" crossorigin="anonymous" alt="Task illustration ${index + 1}" style="width: 100%; max-width: 50%; height: auto; margin: 10px 0 10px 20px; border-radius: 8px; float: right; clear: right;" class="task-image task-image-${index + 1}" />`;
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

      {/* Guest Task View Limit Banner */}
      {isGuest && guestViewLimit.canViewTasks && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body1" component="div">
            <strong>👁️ Free Task Views: {guestViewLimit.viewsRemaining} view{guestViewLimit.viewsRemaining !== 1 ? 's' : ''} remaining</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Register for unlimited task viewing and {TRIAL_START_CREDITS} free task generation credits!
          </Typography>
        </Alert>
      )}

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
            label={task.educationalModel}
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

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onLogin={handleLogin}
        onCreateAccount={handleCreateAccountClick}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Registration Modal */}
      <RegistrationModal
        open={showRegisterModal}
        onRegister={handleRegister}
        onBack={handleBackToLogin}
        onClose={() => setShowRegisterModal(false)}
        detectedCountry={user.country}
        isTeacher={isTeacher}
      />
    </Container>
    </>
  );
}
