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
import { DifficultyLevel, getDifficultyLevelsForCountry } from '@/lib/data/difficulty-levels';

export interface DifficultyLevelSelectProps {
  value: DifficultyLevel;
  onChange: (level: DifficultyLevel) => void;
  country: CountryCode;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * DifficultyLevelSelect Molecule Component
 * Reusable difficulty level selector with localized labels
 */
export const DifficultyLevelSelect: React.FC<DifficultyLevelSelectProps> = ({
  value,
  onChange,
  country,
  label = 'Difficulty Level',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
}) => {
  const levels = getDifficultyLevelsForCountry(country);

  const handleChange = (event: SelectChangeEvent<DifficultyLevel>) => {
    onChange(event.target.value as DifficultyLevel);
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
            {level.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default DifficultyLevelSelect;
