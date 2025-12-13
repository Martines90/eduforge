'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { Subject } from '@/types/i18n';
import { useTranslation } from '@/lib/i18n';
import styles from './ActionSelectionModal.module.scss';

export interface ActionSelectionModalProps {
  open: boolean;
  subject: Subject;
  onSelect: (action: 'create' | 'search') => void;
}

const subjectLabels: Record<Subject, string> = {
  'mathematics': 'Mathematics',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  'biology': 'Biology',
  'history': 'History',
  'geography': 'Geography',
  'literature': 'Literature',
};

/**
 * ActionSelectionModal Organism Component
 * Asks teacher if they want to create a new task or search existing ones
 */
export const ActionSelectionModal: React.FC<ActionSelectionModalProps> = ({
  open,
  subject,
  onSelect,
}) => {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<'create' | 'search' | null>(null);

  const handleConfirm = () => {
    if (selectedAction) {
      onSelect(selectedAction);
    }
  };

  // Reset selection when modal closes to prevent state issues
  React.useEffect(() => {
    if (!open) {
      setSelectedAction(null);
    }
  }, [open]);

  const subjectLabel = subjectLabels[subject];

  const actions = [
    {
      action: 'create' as const,
      title: `Create a new ${subjectLabel} task`,
      description: 'Design a custom educational task from scratch',
      icon: <AddCircleOutlineIcon sx={{ fontSize: 48 }} />,
    },
    {
      action: 'search' as const,
      title: `Search for existing ${subjectLabel} tasks`,
      description: 'Browse and use pre-made tasks from the community',
      icon: <SearchIcon sx={{ fontSize: 48 }} />,
    },
  ];

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      disableRestoreFocus={false}
      className={styles.dialog}
      PaperProps={{
        className: styles.paper,
      }}
    >
      <DialogTitle className={styles.title}>
        <Typography variant="h4" component="div" className={styles.titleText}>
          {t('What would you like to do?')}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.primary' }} className={styles.subtitle}>
          {t('Choose your next step for')} {subjectLabel}
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <Box className={styles.actionGrid}>
          {actions.map((action) => (
            <Card
              key={action.action}
              className={`${styles.actionCard} ${
                selectedAction === action.action ? styles.selected : ''
              }`}
              elevation={selectedAction === action.action ? 8 : 2}
            >
              <CardActionArea
                onClick={() => setSelectedAction(action.action)}
                className={styles.cardAction}
              >
                <CardContent className={styles.cardContent}>
                  <Box className={styles.iconContainer}>
                    {action.icon}
                    {selectedAction === action.action && (
                      <CheckCircleIcon className={styles.checkIcon} />
                    )}
                  </Box>
                  <Typography variant="h6" component="div" className={styles.actionTitle}>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions className={styles.actions}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="large"
          disabled={!selectedAction}
          fullWidth
          className={styles.confirmButton}
        >
          {t('Continue')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActionSelectionModal;
