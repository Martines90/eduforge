'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { GeneratedTask } from '@/types/task';
import { Button } from '@/components/atoms/Button';
import { processLatexInHtml } from '@/lib/utils/latex-converter';
import { validateCharacterLength, TASK_CHARACTER_LENGTH } from '@/lib/config/task-generation.config';
import { useTranslation } from '@/lib/i18n';
import styles from './TaskResult.module.scss';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export interface TaskResultProps {
  task: GeneratedTask | null;
  loading?: boolean;
  loadingMessage?: string;
  loadingProgress?: number;
  error?: string;
  onClose?: () => void;
  onSave?: (editedTask: GeneratedTask) => void;
  onSaveToDatabase?: () => void;
  isSaving?: boolean;
  /**
   * Guest mode - if true, Save/Download buttons will trigger registration prompt
   */
  isGuestMode?: boolean;
  /**
   * Callback when guest tries to save/download and needs to register
   */
  onGuestPrompt?: (action: 'save' | 'download') => void;
  /**
   * Whether there are unsaved changes to the task
   */
  hasUnsavedChanges?: boolean;
  /**
   * Callback to view task info modal (after save)
   */
  onViewTaskInfo?: () => void;
  /**
   * Saved task info for showing VIEW button
   */
  savedTaskInfo?: { taskId: string; publicShareLink: string; pdfUrl?: string } | null;
}

/**
 * TaskResult Organism Component
 * Displays generated task with editable rich text content
 */
export const TaskResult: React.FC<TaskResultProps> = ({
  task,
  loading = false,
  loadingMessage,
  loadingProgress = 0,
  error,
  onClose,
  onSave,
  onSaveToDatabase,
  isSaving = false,
  isGuestMode = false,
  onGuestPrompt,
  hasUnsavedChanges = false,
  onViewTaskInfo,
  savedTaskInfo,
}) => {
  const { t } = useTranslation();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSolution, setEditedSolution] = useState('');
  const [latexReady, setLatexReady] = useState(false);
  const [descriptionValidation, setDescriptionValidation] = useState(validateCharacterLength(''));

  // Helper to decode HTML entities in URLs (fixes &amp; issue with Azure Blob Storage)
  const decodeHtmlEntities = (text: string): string => {
    if (typeof document === 'undefined') return text; // SSR safety
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Process HTML to inject image URLs in place of [IMAGE_X] placeholders
  const processImagePlaceholders = (html: string, images: { id: string; url: string }[], forPdf = false): string => {
    console.log('[TaskResult] Processing image placeholders:', {
      imagesCount: images?.length || 0,
      images,
      htmlLength: html?.length || 0,
      htmlSnippet: html?.substring(0, 200),
      forPdf
    });

    if (!images || images.length === 0) {
      console.log('[TaskResult] No images to process, returning original HTML');
      return html;
    }

    // Filter out invalid images
    const validImages = images.filter(img => img && img.url && img.url.trim() !== '');
    if (validImages.length === 0) {
      console.warn('[TaskResult] No valid image URLs found');
      return html;
    }

    let processedHtml = html;
    validImages.forEach((image, index) => {
      const placeholder = `[IMAGE_${index + 1}]`;

      // Decode HTML entities in URL (fixes &amp; in Azure Blob Storage URLs)
      const imageUrl = decodeHtmlEntities(image.url);

      // Different styles for PDF vs screen display
      const imgStyle = forPdf
        ? 'display: block; width: 100%; max-width: 600px; height: auto; margin: 20px auto; border-radius: 8px;'
        : 'width: 100%; max-width: 50%; height: auto; margin: 10px 0 10px 20px; border-radius: 8px; float: right; clear: right;';

      const imgTag = `<img src="${imageUrl}" crossorigin="anonymous" alt="Task illustration ${index + 1}" style="${imgStyle}" class="task-image task-image-${index + 1}" />`;
      console.log(`[TaskResult] Replacing "${placeholder}" with img tag, URL: ${imageUrl}`);
      // Replace only the FIRST occurrence (not global) to avoid duplicates
      processedHtml = processedHtml.replace(placeholder, imgTag);
    });

    console.log('[TaskResult] Processed HTML snippet:', processedHtml.substring(0, 300));
    return processedHtml;
  };

  const descriptionPreviewRef = useRef<HTMLDivElement>(null);
  const solutionPreviewRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  useEffect(() => {
    if (task) {
      // Store the raw description with placeholders for editing
      setEditedDescription(task.description);
      setEditedSolution(task.solution);
      setDescriptionValidation(validateCharacterLength(task.description));
    }
  }, [task]);

  // Get the display version of description (with images injected)
  const getDisplayDescription = (forPdf = false): string => {
    if (!task) return '';
    return processImagePlaceholders(editedDescription || task.description, task.images, forPdf);
  };

  // Validate description length whenever it changes
  useEffect(() => {
    setDescriptionValidation(validateCharacterLength(editedDescription));
  }, [editedDescription]);

  // Process LaTeX after content changes and latex.js is loaded
  useEffect(() => {
    if (!latexReady || isEditingDescription || isEditingSolution) {
      retryCountRef.current = 0; // Reset retry count
      return;
    }

    const processLatex = () => {
      if (typeof window !== 'undefined' && window.S2Latex && typeof window.S2Latex.processTree === 'function') {
        try {
          retryCountRef.current = 0; // Reset on success
          if (descriptionPreviewRef.current) {
            window.S2Latex.processTree(descriptionPreviewRef.current);
          }
          if (solutionPreviewRef.current) {
            window.S2Latex.processTree(solutionPreviewRef.current);
          }
          console.log('✅ LaTeX rendering completed successfully');
        } catch (error) {
          console.error('LaTeX processing error:', error);
        }
      } else if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`S2Latex not available yet, retry ${retryCountRef.current}/${maxRetries}...`);
        // Retry after a delay if not ready
        setTimeout(processLatex, 500);
      } else {
        console.error('S2Latex failed to load after maximum retries. LaTeX rendering unavailable.');
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(processLatex, 200);
    return () => {
      clearTimeout(timer);
      retryCountRef.current = 0; // Reset on cleanup
    };
  }, [task, latexReady, isEditingDescription, isEditingSolution]);

  const handleEditDescription = () => {
    setIsEditingDescription(true);
  };

  const handleEditSolution = () => {
    setIsEditingSolution(true);
  };

  const handleCancelDescription = () => {
    if (task) {
      setEditedDescription(task.description);
    }
    setIsEditingDescription(false);
  };

  const handleCancelSolution = () => {
    if (task) {
      setEditedSolution(task.solution);
    }
    setIsEditingSolution(false);
  };

  const handleSaveDescription = () => {
    // Validate character length before saving
    if (!descriptionValidation.isValid) {
      if (descriptionValidation.isTooShort) {
        alert(
          t('Task description is too short! At least {{min}} characters required. Current: {{count}} characters.')
            .replace('{{min}}', String(descriptionValidation.min))
            .replace('{{count}}', String(descriptionValidation.count))
        );
      } else if (descriptionValidation.isTooLong) {
        alert(
          t('Task description is too long! Maximum {{max}} characters allowed. Current: {{count}} characters.')
            .replace('{{max}}', String(descriptionValidation.max))
            .replace('{{count}}', String(descriptionValidation.count))
        );
      }
      return;
    }

    if (task && onSave) {
      onSave({
        ...task,
        description: editedDescription,
      });
    }
    setIsEditingDescription(false);
  };

  const handleSaveSolution = () => {
    if (task && onSave) {
      onSave({
        ...task,
        solution: editedSolution,
      });
    }
    setIsEditingSolution(false);
  };

  const handleDownloadPDF = async () => {
    if (!task) return;

    // If guest mode, trigger prompt instead of downloading
    if (isGuestMode && onGuestPrompt) {
      onGuestPrompt('download');
      return;
    }

    try {
      console.log('[PDF] Starting PDF generation...');
      console.log('[PDF] Task data:', {
        id: task.id,
        hasDescription: !!task.description,
        hasImages: !!task.images,
        imageCount: task.images?.length || 0
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

      // Build the PDF content (task description only, with images) - use PDF-optimized styling
      const displayDescription = getDisplayDescription(true);

      console.log('[PDF] Description HTML length:', displayDescription.length);
      console.log('[PDF] Description HTML snippet:', displayDescription.substring(0, 200));

      pdfContainer.innerHTML = `
        <div style="padding: 10px;">
          <div style="font-size: 14px; line-height: 1.8;">
            ${processLatexInHtml(displayDescription)}
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
              resolve(null); // Resolve anyway to not block PDF generation
            }, 15000); // Increased timeout to 15 seconds

            img.onload = () => {
              clearTimeout(timeout);
              console.log(`[PDF] Image ${idx + 1} loaded successfully`);
              resolve(null);
            };
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error(`[PDF] Failed to load image ${idx + 1}: ${img.src}`, error);
              resolve(null); // Resolve anyway to continue with other images
            };
          }
        });
      });

      // Wait for all images to load (or timeout)
      console.log(`[PDF] Waiting for ${images.length} image(s) to load...`);
      await Promise.all(imagePromises);
      console.log(`[PDF] All images processed`);

      // Render LaTeX if available with better waiting mechanism
      if (window.S2Latex && typeof window.S2Latex.processTree === 'function') {
        console.log('[PDF] Processing LaTeX...');
        window.S2Latex.processTree(pdfContainer);

        // Wait for LaTeX rendering with timeout
        await new Promise(resolve => {
          let checks = 0;
          const maxChecks = 20; // 2 seconds max (20 * 100ms)

          const checkInterval = setInterval(() => {
            checks++;
            // Check if LaTeX has been rendered or timeout
            const latexElements = pdfContainer.querySelectorAll('[class*="latex"], [class*="katex"]');
            if (latexElements.length > 0 || checks >= maxChecks) {
              clearInterval(checkInterval);
              console.log(`[PDF] LaTeX rendering complete (checks: ${checks})`);
              resolve(null);
            }
          }, 100);
        });
      }

      // Configure PDF options
      const opt = {
        margin: 10,
        filename: `feladat_${task.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true, // Allow cross-origin images
          logging: true, // Enable logging for debugging
          letterRendering: true,
          windowWidth: 800,
          windowHeight: 1200,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const
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
        pdf.save(`feladat_${task.id}.pdf`);
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

      // Better error messaging
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

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  if (loading) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.loadingContainer}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
            <CircularProgress
              variant={loadingProgress > 0 ? "determinate" : "indeterminate"}
              value={loadingProgress}
              size={80}
            />
            {loadingProgress > 0 && (
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" component="div" color="text.secondary">
                  {`${Math.round(loadingProgress)}%`}
                </Typography>
              </Box>
            )}
          </Box>
          <Typography variant="h6" sx={{ mt: 2 }}>
            {loadingMessage || t('Generating task...')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('Please wait...')}
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} className={styles.container}>
        <Alert severity="error" onClose={onClose}>
          <Typography variant="subtitle1" fontWeight={600}>
            {t('An error occurred')}
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      </Paper>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <>
      <Script
        src="/lib/utils/latex.js"
        strategy="afterInteractive"
        onLoad={() => setLatexReady(true)}
      />
      <Paper elevation={2} className={styles.container}>
        <Box className={styles.header}>
        <Typography variant="h5" component="h2" className={styles.title}>
          {t('Generated Task')}
        </Typography>
        <Box className={styles.actions}>
          {onClose && (
            <IconButton onClick={onClose} title={t('Close')}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Task Description Section */}
      <Box className={styles.section}>
        <Box className={styles.sectionHeader}>
          <Typography variant="h6" component="h3" className={styles.sectionTitle}>
            {t('Task')}
          </Typography>
          {!isEditingDescription ? (
            <IconButton onClick={handleEditDescription} color="primary" size="small" title={t('Edit task')}>
              <EditIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="primary"
                onClick={handleSaveDescription}
                size="small"
              >
                {t('Save')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelDescription}
                size="small"
              >
                {t('Cancel')}
              </Button>
            </Box>
          )}
        </Box>

        <Box className={styles.content}>
          {isEditingDescription ? (
            <>
              <ReactQuill
                value={editedDescription}
                onChange={setEditedDescription}
                modules={modules}
                theme="snow"
                className={styles.editor}
              />
              <Box sx={{
                mt: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: descriptionValidation.isTooLong
                      ? 'error.main'
                      : descriptionValidation.isTooShort
                        ? 'warning.main'
                        : 'text.secondary'
                  }}
                >
                  {descriptionValidation.count} / {descriptionValidation.max} {t('characters')}
                </Typography>
                {!descriptionValidation.isValid && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: descriptionValidation.isTooLong ? 'error.main' : 'warning.main',
                      fontWeight: 600
                    }}
                  >
                    {descriptionValidation.isTooShort
                      ? t('{{count}} more characters needed').replace('{{count}}', String(descriptionValidation.min - descriptionValidation.count))
                      : t('{{count}} characters over limit').replace('{{count}}', String(descriptionValidation.count - descriptionValidation.max))
                    }
                  </Typography>
                )}
              </Box>
            </>
          ) : (
            <Box
              ref={descriptionPreviewRef}
              className={styles.preview}
              dangerouslySetInnerHTML={{
                __html: processLatexInHtml(getDisplayDescription())
              }}
            />
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Solution Section */}
      <Box className={styles.section}>
        <Box className={styles.sectionHeader}>
          <Typography variant="h6" component="h3" className={styles.sectionTitle}>
            {t('Solution')}
          </Typography>
          {!isEditingSolution ? (
            <IconButton onClick={handleEditSolution} color="primary" size="small" title={t('Edit solution')}>
              <EditIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="primary"
                onClick={handleSaveSolution}
                size="small"
              >
                {t('Save')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelSolution}
                size="small"
              >
                {t('Cancel')}
              </Button>
            </Box>
          )}
        </Box>

        <Box className={styles.content}>
          {isEditingSolution ? (
            <ReactQuill
              value={editedSolution}
              onChange={setEditedSolution}
              modules={modules}
              theme="snow"
              className={styles.editor}
            />
          ) : (
            <Box
              ref={solutionPreviewRef}
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: processLatexInHtml(editedSolution || task.solution) }}
            />
          )}
        </Box>
      </Box>

      {/* Task ID and Action Buttons */}
      <Box className={styles.footer}>
        <Typography variant="caption" color="text.secondary">
          {t('Task ID')}: {task.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdfIcon />}
            disabled={false} // Always enabled, even for guests
          >
            {t('Download PDF')}
          </Button>
          {/* Show VIEW button if saved and no unsaved changes, otherwise show SAVE button */}
          {savedTaskInfo && !hasUnsavedChanges && onViewTaskInfo ? (
            <Button
              variant="primary"
              onClick={onViewTaskInfo}
            >
              {t('View Task Info')}
            </Button>
          ) : onSaveToDatabase ? (
            <Button
              variant="primary"
              onClick={() => {
                // If guest mode, trigger prompt instead of saving
                if (isGuestMode && onGuestPrompt) {
                  onGuestPrompt('save');
                } else {
                  onSaveToDatabase();
                }
              }}
              disabled={isSaving}
              startIcon={<SaveIcon />}
            >
              {isSaving ? t('Saving...') : t('Save Task')}
            </Button>
          ) : null}
        </Box>
      </Box>
      </Paper>
    </>
  );
};

export default TaskResult;
