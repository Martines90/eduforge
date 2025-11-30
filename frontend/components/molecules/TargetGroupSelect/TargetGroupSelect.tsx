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

export type TargetGroupSex = 'mixed' | 'male' | 'female';

export interface TargetGroupSelectProps {
  value: TargetGroupSex;
  onChange: (targetGroupSex: TargetGroupSex) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * TargetGroupSelect Molecule Component
 * Selector for target group sex (mixed, male, or female)
 */
export const TargetGroupSelect: React.FC<TargetGroupSelectProps> = ({
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

  const handleChange = (event: SelectChangeEvent<TargetGroupSex>) => {
    onChange(event.target.value as TargetGroupSex);
  };

  const options: { value: TargetGroupSex; label: string }[] = [
    { value: 'mixed', label: t('Mixed (Boys and Girls)') },
    { value: 'male', label: t('Boys Only') },
    { value: 'female', label: t('Girls Only') },
  ];

  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} className={className} required={required}>
      <InputLabel>{label || t('Target Group')}</InputLabel>
      <MuiSelect
        value={value}
        onChange={handleChange}
        label={label || t('Target Group')}
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

export default TargetGroupSelect;
