'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  IconButton,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';
import styles from './TaskSavedModal.module.scss';

export interface TaskSavedModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  publicShareLink: string;
}

/**
 * TaskSavedModal Component
 * Displays success message after saving a task with options to copy link or download PDF
 */
export const TaskSavedModal: React.FC<TaskSavedModalProps> = ({
  open,
  onClose,
  taskId,
  publicShareLink,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicShareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    console.log('Download PDF for task:', taskId);
    alert(t('PDF download will be implemented soon'));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      className={styles.dialog}
    >
      <DialogTitle className={styles.title}>
        <Box className={styles.titleContainer}>
          <CheckCircleIcon className={styles.successIcon} />
          <Typography variant="h5" component="span">
            {t('Task Saved Successfully!')}
          </Typography>
        </Box>
        <IconButton
          aria-label={t('Close')}
          onClick={onClose}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <Typography variant="body1" gutterBottom>
          {t('Your task has been saved to the database and is now available publicly.')}
        </Typography>

        <Box className={styles.linkContainer}>
          <Typography variant="subtitle2" gutterBottom>
            {t('Public Share Link:')}
          </Typography>
          <Box className={styles.linkBox}>
            <Typography variant="body2" className={styles.link}>
              {publicShareLink}
            </Typography>
          </Box>
        </Box>

        {copied && (
          <Alert severity="success" className={styles.alert}>
            {t('Link copied to clipboard!')}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {t('Task ID:')} {taskId}
        </Typography>
      </DialogContent>

      <DialogActions className={styles.actions}>
        <Button
          variant="secondary"
          onClick={handleCopyLink}
          startIcon={<ContentCopyIcon />}
          fullWidth
        >
          {t('Copy Public Share Link')}
        </Button>
        <Button
          variant="primary"
          onClick={handleDownloadPDF}
          startIcon={<DownloadIcon />}
          fullWidth
        >
          {t('Download as PDF')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskSavedModal;
