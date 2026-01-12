'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from '@mui/material';
import { Subject } from '@/types/i18n';
import { useUser } from '@/lib/context/UserContext';
import { SubjectSelector } from '@/components/molecules/SubjectSelector';
import styles from './SubjectSelectionModal.module.scss';

export interface SubjectSelectionModalProps {
  open: boolean;
  onSelect: (subject: Subject) => void;
}

/**
 * SubjectSelectionModal Organism Component
 * For teachers to select their subject expertise
 */
export const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({
  open,
  onSelect,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | ''>('');

  const { user } = useUser();

  const handleChange = (subject: Subject | Subject[] | null) => {
    // Type guard - only handle single Subject values
    if (subject && !Array.isArray(subject)) {
      setSelectedSubject(subject);
    }
  };

  const handleConfirm = () => {
    if (selectedSubject) {
      onSelect(selectedSubject as Subject);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      className={styles.dialog}
      PaperProps={{
        className: styles.paper,
      }}
    >
      <DialogTitle className={styles.title}>
        <Typography variant="h4" component="div" className={styles.titleText}>
          What subject do you teach?
        </Typography>
        <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
          Select the subject you have the most experience with
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <SubjectSelector
          value={selectedSubject}
          onChange={handleChange}
          country={user.country}
          label="Select a subject"
          required
          className={styles.select}
        />

        <Typography
          variant="caption"
          color="text.secondary"
          className={styles.helpText}
        >
          Don&apos;t worry, you can create tasks for any subject later
        </Typography>
      </DialogContent>

      <DialogActions className={styles.actions}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="large"
          disabled={!selectedSubject}
          fullWidth
          className={styles.confirmButton}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectSelectionModal;
