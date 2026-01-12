'use client';

import React from 'react';
import {
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  SelectChangeEvent,
  Box,
  Chip,
} from '@mui/material';
import { Subject, CountryCode } from '@/types/i18n';
import { SUBJECTS, getSubjectsForCountry, SubjectOption } from '@/lib/data/subjects';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context/UserContext';

export interface SubjectSelectorProps {
  value: Subject | Subject[] | null | '';
  onChange: (subject: Subject | Subject[] | null) => void;
  type?: 'select' | 'chip';
  isMultiSelect?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  'data-testid'?: string;
  sx?: object;
  country?: CountryCode; // Optional: if provided, uses country-specific labels
}

/**
 * SubjectSelector Component
 * Reusable subject selector with two modes: select dropdown or chip selector
 * Supports both single and multi-select
 * Can use country-specific labels or translation context
 */
export const SubjectSelector: React.FC<SubjectSelectorProps> = ({
  value,
  onChange,
  type = 'select',
  isMultiSelect = false,
  label = 'Subject',
  disabled = false,
  required = false,
  fullWidth = true,
  className,
  'data-testid': dataTestId,
  sx,
  country: countryProp,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const effectiveCountry = countryProp || user.country;

  // Get subjects list (country-specific if country prop provided)
  const subjectsList = countryProp
    ? getSubjectsForCountry(countryProp)
    : SUBJECTS;

  // Get translated subject label
  const getSubjectLabel = (subject: Subject): string => {
    if (countryProp) {
      // Use country-specific label directly
      const subjectOption = subjectsList.find((s) => s.value === subject);
      // Type assertion because SubjectOption type is complex (can have label or labelEN/labelLocal)
      return (subjectOption as any)?.label || (subjectOption as any)?.labelEN || subject;
    }

    // Use translation system
    const subjectOption = SUBJECTS.find((s) => s.value === subject);
    if (!subjectOption) return subject;
    return t(subjectOption.labelEN as any);
  };

  const handleSelectChange = (event: SelectChangeEvent<Subject | Subject[]>) => {
    const selectedValue = event.target.value;
    if (isMultiSelect) {
      onChange(selectedValue as Subject[]);
    } else {
      onChange(selectedValue === '' ? null : (selectedValue as Subject));
    }
  };

  const handleChipClick = (subject: Subject) => {
    if (disabled) return;

    if (isMultiSelect) {
      const currentValues = (value as Subject[]) || [];
      const newValues = currentValues.includes(subject)
        ? currentValues.filter((s) => s !== subject)
        : [...currentValues, subject];
      onChange(newValues.length > 0 ? newValues : null);
    } else {
      onChange(value === subject ? null : subject);
    }
  };

  // Chip mode
  if (type === 'chip') {
    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', ...sx }} className={className}>
        {subjectsList.map((subject) => {
          const isSelected = isMultiSelect
            ? (value as Subject[])?.includes(subject.value)
            : value === subject.value;

          return (
            <Chip
              key={subject.value}
              label={getSubjectLabel(subject.value)}
              onClick={() => handleChipClick(subject.value)}
              color={isSelected ? 'primary' : 'default'}
              variant={isSelected ? 'filled' : 'outlined'}
              disabled={disabled}
              data-testid={dataTestId ? `${dataTestId}-${subject.value}` : undefined}
            />
          );
        })}
      </Box>
    );
  }

  // Select mode
  return (
    <FormControl fullWidth={fullWidth} disabled={disabled} className={className} required={required} sx={sx}>
      <InputLabel>{label}</InputLabel>
      <MuiSelect
        value={value || (isMultiSelect ? [] : '')}
        onChange={handleSelectChange}
        label={label}
        multiple={isMultiSelect}
        data-testid={dataTestId}
      >
        {!isMultiSelect && !required && (
          <MenuItem value="">
            <em>{t('All Subjects')}</em>
          </MenuItem>
        )}
        {subjectsList.map((subject) => (
          <MenuItem key={subject.value} value={subject.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '1.5rem' }}>{subject.emoji}</span>
              <span>{getSubjectLabel(subject.value)}</span>
            </Box>
          </MenuItem>
        ))}
      </MuiSelect>
    </FormControl>
  );
};

export default SubjectSelector;
