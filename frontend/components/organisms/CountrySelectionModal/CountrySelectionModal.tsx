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
import { CountryCode } from '@/types/i18n';
import { CountrySelect } from '@/components/molecules/CountrySelect/CountrySelect';
import { countries } from '@/lib/i18n/countries';
import styles from './CountrySelectionModal.module.scss';

export interface CountrySelectionModalProps {
  open: boolean;
  onSelect: (country: CountryCode) => void;
  detectedCountry?: CountryCode;
}

/**
 * CountrySelectionModal Organism Component
 * First-visit modal for country selection when IP detection fails
 * User must manually select their country using a simple dropdown
 */
export const CountrySelectionModal: React.FC<CountrySelectionModalProps> = ({
  open,
  onSelect,
  detectedCountry,
}) => {
  // Pre-select detectedCountry if provided (usually the default HU)
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | ''>(
    detectedCountry || ''
  );

  const handleConfirm = () => {
    if (selectedCountry) {
      onSelect(selectedCountry as CountryCode);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      className={styles.dialog}
      PaperProps={{
        className: styles.paper,
      }}
    >
      <DialogTitle className={styles.title}>
        <Typography variant="h5" component="div" className={styles.titleText}>
          Welcome to EduForger! 🎓
        </Typography>
        <Typography variant="body2" className={styles.subtitle}>
          Please select your country to continue
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        <div className={styles.selectContainer}>
          <CountrySelect
            value={selectedCountry}
            onChange={setSelectedCountry}
            label="Select your country"
            required
            data-testid="country-select-modal-dropdown"
          />

          <Typography
            variant="caption"
            color="text.secondary"
            className={styles.helpText}
          >
            You can change this anytime from the country selector in the header
          </Typography>
        </div>
      </DialogContent>

      <DialogActions className={styles.actions}>
        <Button
          onClick={handleConfirm}
          variant="contained"
          size="large"
          disabled={!selectedCountry}
          fullWidth
          className={styles.confirmButton}
        >
          Continue{selectedCountry && ` with ${countries.find((c) => c.code === selectedCountry)?.language}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CountrySelectionModal;
