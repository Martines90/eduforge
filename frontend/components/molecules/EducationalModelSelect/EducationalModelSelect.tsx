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
import { EducationalModel } from '@/lib/context/UserContext';
import { getEducationalModelsForCountry } from '@/lib/data/educational-models';

export interface EducationalModelSelectProps {
  value: EducationalModel | '';
  onChange: (model: EducationalModel) => void;
  country: CountryCode;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
  showPlaceholder?: boolean;
  placeholderText?: string;
}

/**
 * EducationalModelSelect Molecule Component
 * Reusable educational model selector with localized labels
 */
export const EducationalModelSelect: React.FC<EducationalModelSelectProps> = ({
  value,
  onChange,
  country,
  label = 'Educational Model',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
  showPlaceholder = false,
  placeholderText = 'Select educational model',
}) => {
  const models = getEducationalModelsForCountry(country);

  const handleChange = (event: SelectChangeEvent<EducationalModel | ''>) => {
    const selectedValue = event.target.value as EducationalModel;
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
        displayEmpty={showPlaceholder}
      >
        {showPlaceholder && (
          <MenuItem value="" disabled>
            {placeholderText}
          </MenuItem>
        )}
        {models.map((model) => (
          <MenuItem key={model.value} value={model.value}>
            {model.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default EducationalModelSelect;
