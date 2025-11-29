'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { CountryCode } from '@/types/i18n';
import { StrengthLevel, getStrengthLevelsForCountry } from '@/lib/data/educational-system-strength-levels';

export interface StrengthLevelSelectProps {
  value: StrengthLevel | '';
  onChange: (level: StrengthLevel) => void;
  country: CountryCode;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
  showDescription?: boolean;
}

/**
 * StrengthLevelSelect Molecule Component
 * Reusable strength level selector with localized labels
 */
export const StrengthLevelSelect: React.FC<StrengthLevelSelectProps> = ({
  value,
  onChange,
  country,
  label = 'Strength Level',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
  showDescription = false,
}) => {
  const levels = getStrengthLevelsForCountry(country);

  const handleChange = (event: SelectChangeEvent<StrengthLevel | ''>) => {
    const selectedValue = event.target.value as StrengthLevel;
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
        {levels.map((level) => (
          <MenuItem key={level.value} value={level.value}>
            {showDescription && level.description
              ? `${level.label} - ${level.description}`
              : level.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default StrengthLevelSelect;
