'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Select, SelectOption } from '@/components/atoms/Select';
import styles from './SelectGroup.module.scss';

export interface SelectGroupProps {
  title?: string;
  selects: Array<{
    id: string;
    label: string;
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    disabled?: boolean;
  }>;
  className?: string;
}

/**
 * SelectGroup Molecule Component
 * Groups multiple select components together with an optional title
 */
export const SelectGroup: React.FC<SelectGroupProps> = ({
  title,
  selects,
  className,
}) => {
  return (
    <Box className={`${styles.selectGroup} ${className || ''}`}>
      {title && (
        <Typography variant="h6" component="h2" className={styles.title}>
          {title}
        </Typography>
      )}
      <div className={styles.selectsContainer}>
        {selects.map((selectProps) => (
          <Select key={selectProps.id} {...selectProps} />
        ))}
      </div>
    </Box>
  );
};

export default SelectGroup;
