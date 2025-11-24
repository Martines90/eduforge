'use client';

import React from 'react';
import { MenuItem, Select, SelectChangeEvent, Box, Typography } from '@mui/material';
import { useI18n, countries } from '@/lib/i18n';
import { CountryCode } from '@/types/i18n';
import styles from './CountrySelector.module.scss';

export interface CountrySelectorProps {
  className?: string;
}

/**
 * CountrySelector Molecule Component
 * Dropdown for selecting country/language
 */
export const CountrySelector: React.FC<CountrySelectorProps> = ({ className }) => {
  const { country, setCountry } = useI18n();

  const handleChange = (event: SelectChangeEvent<CountryCode>) => {
    setCountry(event.target.value as CountryCode);
  };

  return (
    <Select
      value={country}
      onChange={handleChange}
      className={`${styles.select} ${className || ''}`}
      variant="outlined"
      size="small"
      aria-label="Select country and language"
      renderValue={(selected) => {
        const selectedCountry = countries.find((c) => c.code === selected);
        return (
          <Box className={styles.selectedValue}>
            <span className={styles.flag}>{selectedCountry?.flag}</span>
            <span className={styles.code}>{selected}</span>
          </Box>
        );
      }}
    >
      {countries.map((country) => (
        <MenuItem key={country.code} value={country.code} className={styles.menuItem}>
          <Box className={styles.menuItemContent}>
            <span className={styles.flag}>{country.flag}</span>
            <Box className={styles.textContent}>
              <Typography variant="body2" className={styles.countryName}>
                {country.name}
              </Typography>
              <Typography variant="caption" className={styles.language}>
                {country.language}
              </Typography>
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
};

export default CountrySelector;
