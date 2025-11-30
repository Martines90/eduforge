'use client';

import React, { useState, useEffect } from 'react';
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
import dynamic from 'next/dynamic';
import { GeneratedTask } from '@/types/task';
import { Button } from '@/components/atoms/Button';
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
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingSolution, setIsEditingSolution] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [editedSolution, setEditedSolution] = useState('');

  useEffect(() => {
    if (task) {
      setEditedDescription(task.description);
      setEditedSolution(task.solution);
    }
  }, [task]);

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
            <ReactQuill
              value={editedDescription}
              onChange={setEditedDescription}
              modules={modules}
              theme="snow"
              className={styles.editor}
            />
          ) : (
            <Box
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: task.description }}
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
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: task.solution }}
            />
          )}
        </Box>
      </Box>

      {/* Task Images */}
      {task.images && task.images.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Box className={styles.imagesSection}>
            <Typography variant="h6" gutterBottom>
              Képek
            </Typography>
            <Box className={styles.imagesGrid}>
              {task.images.map((image, index) => (
                <Box key={image.id} className={styles.imageContainer}>
                  <img
                    src={image.url}
                    alt={`Task illustration ${index + 1}`}
                    className={styles.image}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Task ID */}
      <Box className={styles.footer}>
        <Typography variant="caption" color="text.secondary">
          Feladat ID: {task.id}
        </Typography>
      </Box>
    </Paper>
  );
};

export default TaskResult;
