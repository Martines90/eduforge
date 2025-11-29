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
import { Subject, CountryCode } from '@/types/i18n';
import { getSubjectsForCountry } from '@/lib/data/subjects';

export interface SubjectSelectProps {
  value: Subject | '';
  onChange: (subject: Subject) => void;
  country: CountryCode;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
}

/**
 * SubjectSelect Molecule Component
 * Reusable subject selector with emojis and localized labels
 */
export const SubjectSelect: React.FC<SubjectSelectProps> = ({
  value,
  onChange,
  country,
  label = 'Subject',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
}) => {
  const subjects = getSubjectsForCountry(country);

  const handleChange = (event: SelectChangeEvent<Subject | ''>) => {
    const selectedValue = event.target.value as Subject;
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
        {subjects.map((subject) => (
          <MenuItem key={subject.value} value={subject.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.5rem' }}>{subject.emoji}</span>
              <span>{subject.label}</span>
            </Box>
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default SubjectSelect;
