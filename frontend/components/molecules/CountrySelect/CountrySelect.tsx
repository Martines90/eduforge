'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
  Box,
} from '@mui/material';
import { CountryCode } from '@/types/i18n';
import { countries } from '@/lib/i18n/countries';

export interface CountrySelectProps {
  value: CountryCode | '';
  onChange: (country: CountryCode) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * CountrySelect Molecule Component
 * Reusable country selector with flag emojis
 */
export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  label = 'Country',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
}) => {
  const handleChange = (event: SelectChangeEvent<CountryCode | ''>) => {
    const selectedValue = event.target.value as CountryCode;
    if (selectedValue) {
      onChange(selectedValue);
    }
  };

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} className={className} required={required}>
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        value={value}
        onChange={handleChange}
        label={label}
        data-testid={dataTestId}
      >
        {countries.map((country) => (
          <MenuItem key={country.code} value={country.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.5rem' }}>{country.flag}</span>
              <span>{country.name}</span>
            </Box>
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default CountrySelect;
