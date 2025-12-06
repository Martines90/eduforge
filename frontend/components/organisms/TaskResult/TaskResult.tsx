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
}

/**
 * TaskResult Organism Component
 * Displays generated task with editable rich text content
 */
export const TaskResult: React.FC<TaskResultProps> = ({
  task,
  loading = false,
  loadingMessage = 'Feladat generálása folyamatban...',
  loadingProgress = 0,
  error,
  onClose,
  onSave,
  onSaveToDatabase,
  isSaving = false,
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSolution, setEditedSolution] = useState('');
  const [latexReady, setLatexReady] = useState(false);
  const [descriptionValidation, setDescriptionValidation] = useState(validateCharacterLength(''));

  // Process HTML to inject image URLs in place of [IMAGE_X] placeholders
  const processImagePlaceholders = (html: string, images: { id: string; url: string }[]): string => {
    console.log('[TaskResult] Processing image placeholders:', {
      imagesCount: images?.length || 0,
      images,
      htmlLength: html?.length || 0,
      htmlSnippet: html?.substring(0, 200)
    });

    if (!images || images.length === 0) {
      console.log('[TaskResult] No images to process, returning original HTML');
      return html;
    }

    let processedHtml = html;
    images.forEach((image, index) => {
      const placeholder = `[IMAGE_${index + 1}]`;
      // Responsive image: 50% width on desktop (float right), 100% on mobile
      const imgTag = `<img src="${image.url}" alt="Task illustration ${index + 1}" style="width: 100%; max-width: 50%; height: auto; margin: 10px 0 10px 20px; border-radius: 8px; float: right; clear: right;" class="task-image task-image-${index + 1}" />`;
      console.log(`[TaskResult] Replacing "${placeholder}" with img tag, URL: ${image.url}`);
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
  const getDisplayDescription = (): string => {
    if (!task) return '';
    return processImagePlaceholders(editedDescription || task.description, task.images);
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
        alert(`A feladat leírása túl rövid! Legalább ${descriptionValidation.min} karakter szükséges. Jelenleg: ${descriptionValidation.count} karakter.`);
      } else if (descriptionValidation.isTooLong) {
        alert(`A feladat leírása túl hosszú! Maximum ${descriptionValidation.max} karakter megengedett. Jelenleg: ${descriptionValidation.count} karakter.`);
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

    try {
      // Dynamically import jsPDF and html2canvas to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      // Create a temporary container for PDF rendering
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '210mm'; // A4 width
      pdfContainer.style.padding = '20mm';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      pdfContainer.style.fontSize = '14px';
      pdfContainer.style.lineHeight = '1.6';

      // Build the PDF content (task description only, with images)
      const displayDescription = processImagePlaceholders(editedDescription || task.description, task.images);

      pdfContainer.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="color: #667eea; font-size: 24px; margin-bottom: 20px; font-weight: bold;">Feladat</h1>
          <div style="font-size: 14px; line-height: 1.8;">
            ${processLatexInHtml(displayDescription)}
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Process all images to ensure they're loaded
      const images = pdfContainer.getElementsByTagName('img');
      const imagePromises = Array.from(images).map((img) => {
        return new Promise((resolve, reject) => {
          if (img.complete) {
            resolve(null);
          } else {
            img.onload = () => resolve(null);
            img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
          }
        });
      });

      // Wait for all images to load
      await Promise.all(imagePromises);

      // Render LaTeX if available
      if (window.S2Latex && typeof window.S2Latex.processTree === 'function') {
        window.S2Latex.processTree(pdfContainer);
        // Wait a bit for LaTeX to render
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Convert to canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Remove temporary container
      document.body.removeChild(pdfContainer);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download PDF
      const fileName = `feladat_${task.id}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Hiba történt a PDF generálása során. Kérjük, próbálja újra.');
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
            {loadingMessage}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Kérjük, várjon...
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
            Hiba történt
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
          Generált Feladat
        </Typography>
        <Box className={styles.actions}>
          {onClose && (
            <IconButton onClick={onClose} title="Bezárás">
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
            Feladat
          </Typography>
          {!isEditingDescription ? (
            <IconButton onClick={handleEditDescription} color="primary" size="small" title="Feladat szerkesztése">
              <EditIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="primary"
                onClick={handleSaveDescription}
                size="small"
              >
                Mentés
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelDescription}
                size="small"
              >
                Mégse
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
                  {descriptionValidation.count} / {descriptionValidation.max} karakter
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
                      ? `Még ${descriptionValidation.min - descriptionValidation.count} karakter szükséges`
                      : `${descriptionValidation.count - descriptionValidation.max} karakterrel túllépve`
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
            Megoldás
          </Typography>
          {!isEditingSolution ? (
            <IconButton onClick={handleEditSolution} color="primary" size="small" title="Megoldás szerkesztése">
              <EditIcon />
            </IconButton>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="primary"
                onClick={handleSaveSolution}
                size="small"
              >
                Mentés
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelSolution}
                size="small"
              >
                Mégse
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
              dangerouslySetInnerHTML={{ __html: processLatexInHtml(task.solution) }}
            />
          )}
        </Box>
      </Box>

      {/* Task ID and Action Buttons */}
      <Box className={styles.footer}>
        <Typography variant="caption" color="text.secondary">
          Feladat ID: {task.id}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="secondary"
            onClick={handleDownloadPDF}
            startIcon={<PictureAsPdfIcon />}
          >
            PDF Letöltés
          </Button>
          {onSaveToDatabase && (
            <Button
              variant="primary"
              onClick={onSaveToDatabase}
              disabled={isSaving}
              startIcon={<SaveIcon />}
            >
              {isSaving ? 'Mentés...' : 'Feladat Mentése'}
            </Button>
          )}
        </Box>
      </Box>
      </Paper>
    </>
  );
};

export default TaskResult;
