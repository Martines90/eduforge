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
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import { UserIdentity } from '@/types/i18n';
import styles from './RoleSelectionModal.module.scss';

export interface RoleSelectionModalProps {
  open: boolean;
  onSelect: (identity: UserIdentity) => void;
}

/**
 * RoleSelectionModal Organism Component
 * Asks user to select if they are a teacher or non-teacher
 */
export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  open,
  onSelect,
}) => {
  const [selectedIdentity, setSelectedIdentity] = useState<UserIdentity | null>(null);

  const handleConfirm = () => {
    if (selectedIdentity) {
      onSelect(selectedIdentity);
    }
  };

  const roles = [
    {
      identity: 'teacher' as UserIdentity,
      title: 'Teacher',
      description: 'I am an educator creating tasks for my students',
      icon: <SchoolIcon sx={{ fontSize: 48 }} />,
    },
    {
      identity: 'non-teacher' as UserIdentity,
      title: 'Student / Parent / Other',
      description: 'I am looking for educational tasks and resources',
      icon: <PeopleIcon sx={{ fontSize: 48 }} />,
    },
  ];

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
        <Typography variant="h4" component="h2" className={styles.titleText}>
          Who are you?
        </Typography>
        <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
          Help us personalize your experience
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <Box className={styles.roleGrid}>
          {roles.map((role) => (
            <Card
              key={role.identity}
              className={`${styles.roleCard} ${
                selectedIdentity === role.identity ? styles.selected : ''
              }`}
              elevation={selectedIdentity === role.identity ? 8 : 2}
            >
              <CardActionArea
                onClick={() => setSelectedIdentity(role.identity)}
                className={styles.cardAction}
              >
                <CardContent className={styles.cardContent}>
                  <Box className={styles.iconContainer}>
                    {role.icon}
                    {selectedIdentity === role.identity && (
                      <CheckCircleIcon className={styles.checkIcon} />
                    )}
                  </Box>
                  <Typography variant="h6" className={styles.roleTitle}>
                    {role.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {role.description}
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
          disabled={!selectedIdentity}
          fullWidth
          className={styles.confirmButton}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleSelectionModal;
