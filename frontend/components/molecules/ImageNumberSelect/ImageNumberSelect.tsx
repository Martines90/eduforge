'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useTranslation } from '@/lib/i18n';

export type ImageNumber = 0 | 1;

export interface ImageNumberSelectProps {
  value: ImageNumber;
  onChange: (imageNumber: ImageNumber) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * ImageNumberSelect Molecule Component
 * Selector for number of images to generate (0 or 1)
 */
export const ImageNumberSelect: React.FC<ImageNumberSelectProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
}) => {
  const { t } = useTranslation();

  const handleChange = (event: SelectChangeEvent<ImageNumber>) => {
    onChange(event.target.value as ImageNumber);
  };

  const options = [
    { value: 0, label: t('No images (text only)') },
    { value: 1, label: t('1 image') },
  ];

  const displayLabel = label || t('Number of Images');

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} className={className} required={required}>
      <InputLabel>{displayLabel}</InputLabel>
      <MuiSelect
        value={value}
        onChange={handleChange}
        label={displayLabel}
        data-testid={dataTestId}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default ImageNumberSelect;
