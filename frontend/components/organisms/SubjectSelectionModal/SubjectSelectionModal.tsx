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
  MenuItem,
  FormControl,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import { Subject } from '@/types/i18n';
import styles from './SubjectSelectionModal.module.scss';

export interface SubjectSelectionModalProps {
  open: boolean;
  onSelect: (subject: Subject) => void;
}

const subjects: { value: Subject; label: string; emoji: string }[] = [
  { value: 'mathematics', label: 'Mathematics', emoji: '🔢' },
  { value: 'physics', label: 'Physics', emoji: '⚛️' },
  { value: 'chemistry', label: 'Chemistry', emoji: '🧪' },
  { value: 'biology', label: 'Biology', emoji: '🧬' },
  { value: 'history', label: 'History', emoji: '📜' },
  { value: 'geography', label: 'Geography', emoji: '🌍' },
  { value: 'literature', label: 'Literature', emoji: '📚' },
  { value: 'english', label: 'English', emoji: '🔤' },
  { value: 'computer-science', label: 'Computer Science', emoji: '💻' },
  { value: 'arts', label: 'Arts', emoji: '🎨' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'physical-education', label: 'Physical Education', emoji: '⚽' },
];

/**
 * SubjectSelectionModal Organism Component
 * For teachers to select their subject expertise
 */
export const SubjectSelectionModal: React.FC<SubjectSelectionModalProps> = ({
  open,
  onSelect,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | ''>('');

  const handleChange = (event: SelectChangeEvent<Subject | ''>) => {
    setSelectedSubject(event.target.value as Subject | '');
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
        <FormControl fullWidth>
          <Select
            value={selectedSubject}
            onChange={handleChange}
            displayEmpty
            className={styles.select}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea',
                borderWidth: 2,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#764ba2',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#667eea',
              },
            }}
          >
            <MenuItem value="" disabled>
              <em>Select a subject...</em>
            </MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject.value} value={subject.value}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: '1.5rem' }}>{subject.emoji}</span>
                  <span>{subject.label}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
