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
import { GradeLevel, getGradesForCountry } from '@eduforger/shared';

export interface TeacherRoleSelectorProps {
  value: GradeLevel | null | '';
  onChange: (gradeLevel: GradeLevel | null) => void;
  country: CountryCode;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
  sx?: object;
}

/**
 * TeacherRoleSelector Component
 * Allows teachers to select their teaching level/role based on their country
 * Uses grade system configuration from /app/shared/types/grades.ts
 */
export const TeacherRoleSelector: React.FC<TeacherRoleSelectorProps> = ({
  value,
  onChange,
  country,
  label = 'Teaching Level',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
  sx,
}) => {
  const gradeLevels = getGradesForCountry(country);

  const handleChange = (event: SelectChangeEvent<GradeLevel | ''>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue === '' ? null : (selectedValue as GradeLevel));
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      disabled={disabled}
      className={className}
      required={required}
      sx={sx}
    >
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        value={value || ''}
        onChange={handleChange}
        label={label}
        data-testid={dataTestId}
      >
        {!required && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {gradeLevels.map((grade) => (
          <MenuItem key={grade.value} value={grade.value}>
            <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
              <Box sx={{ fontWeight: 600 }}>
                {grade.teacherRoleLabel}
              </Box>
              <Box
                sx={{
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                }}
              >
                {grade.label}
              </Box>
            </Box>
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default TeacherRoleSelector;
