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
import { CountryCode } from '@/types/i18n';
import { countries } from '@/lib/i18n/countries';
import { getSuggestedCountry } from '@/lib/utils/language-detection';
import styles from './CountrySelectionModal.module.scss';

export interface CountrySelectionModalProps {
  open: boolean;
  onSelect: (country: CountryCode) => void;
  detectedCountry?: CountryCode;
}

/**
 * CountrySelectionModal Organism Component
 * First-visit modal for country/language selection
 * Shows detected country as suggestion
 */
export const CountrySelectionModal: React.FC<CountrySelectionModalProps> = ({
  open,
  onSelect,
  detectedCountry,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(
    detectedCountry || null
  );

  const suggestion = getSuggestedCountry();
  const showSuggestion = suggestion.confidence !== 'low';

  const handleConfirm = () => {
    if (selectedCountry) {
      onSelect(selectedCountry);
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
          Welcome to EduForger! 🎓
        </Typography>
        <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
          Please select your country and language to continue
        </Typography>
      </DialogTitle>

      <DialogContent className={styles.content}>
        {showSuggestion && (
          <Box className={styles.suggestion}>
            <Typography variant="body2" className={styles.suggestionText}>
              💡 We detected your language as{' '}
              <strong>
                {countries.find((c) => c.code === suggestion.country)?.language}
              </strong>
            </Typography>
          </Box>
        )}

        <Box className={styles.countryGrid}>
          {countries.map((country) => (
            <Card
              key={country.code}
              className={`${styles.countryCard} ${
                selectedCountry === country.code ? styles.selected : ''
              }`}
              elevation={selectedCountry === country.code ? 8 : 2}
            >
              <CardActionArea
                onClick={() => setSelectedCountry(country.code)}
                className={styles.cardAction}
              >
                <CardContent className={styles.cardContent}>
                  <Box className={styles.cardHeader}>
                    <span className={styles.flag}>{country.flag}</span>
                    {selectedCountry === country.code && (
                      <CheckCircleIcon className={styles.checkIcon} />
                    )}
                  </Box>
                  <Typography variant="h6" component="div" className={styles.countryName}>
                    {country.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {country.language}
                  </Typography>
                  {suggestion.country === country.code && showSuggestion && (
                    <Box className={styles.recommendedBadge}>
                      <Typography variant="caption">Recommended</Typography>
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          className={styles.helpText}
        >
          You can change this anytime from the country selector in the header
        </Typography>
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
          Continue with {selectedCountry && countries.find((c) => c.code === selectedCountry)?.language}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CountrySelectionModal;
