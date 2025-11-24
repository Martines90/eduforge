'use client';

import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { Select, SelectOption } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { useCascadingSelect } from '@/lib/hooks/useCascadingSelect';
import { useTranslation } from '@/lib/i18n';
import { NavigationTopic } from '@/types/navigation';
import styles from './CascadingSelect.module.scss';

export interface CascadingSelectProps {
  data: NavigationTopic[];
  title?: string;
  onSelectionComplete?: (topic: NavigationTopic, path: string[]) => void;
  className?: string;
}

/**
 * CascadingSelect Organism Component
 * Displays a series of select dropdowns that cascade based on the user's selections
 * Each selection reveals the next level of sub-topics
 */
export const CascadingSelect: React.FC<CascadingSelectProps> = ({
  data,
  title = 'Select Topic',
  onSelectionComplete,
  className,
}) => {
  const { t } = useTranslation();
  const {
    selectionPath,
    availableOptions,
    selectOption,
    reset,
    isComplete,
    finalSelection,
  } = useCascadingSelect({ data });

  const handleSelectionComplete = () => {
    if (finalSelection && onSelectionComplete) {
      const path = selectionPath.map((item) => item.displayName);
      onSelectionComplete(finalSelection, path);
    }
  };

  return (
    <Paper elevation={2} className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <Typography variant="h5" component="h1" className={styles.title}>
          {title}
        </Typography>
        {selectionPath.length > 0 && (
          <Button variant="text" onClick={reset} size="small">
            {t('Reset')}
          </Button>
        )}
      </div>

      {/* Breadcrumb showing current path */}
      {selectionPath.length > 0 && (
        <div className={styles.breadcrumb}>
          {selectionPath.map((item, index) => (
            <Chip
              key={`${item.level}-${item.displayName}`}
              label={item.displayName}
              size="small"
              className={styles.breadcrumbChip}
              color={index === selectionPath.length - 1 ? 'primary' : 'default'}
            />
          ))}
        </div>
      )}

      {/* Dynamic select dropdowns */}
      <div className={styles.selectsContainer}>
        {availableOptions.map((options, level) => {
          const selectedValue = selectionPath[level]?.displayName || '';
          const selectOptions: SelectOption[] = options.map((topic) => ({
            value: topic.name,
            label: topic.name,
          }));

          return (
            <Select
              key={`level-${level}`}
              id={`cascade-select-${level}`}
              label={`${t('Level')} ${level + 1}`}
              value={selectedValue}
              options={selectOptions}
              onChange={(value) => selectOption(level, value)}
              placeholder={level === 0 ? t('Select main topic') : t('Select sub-topic')}
              aria-label={`${t('Level')} ${level + 1}`}
            />
          );
        })}
      </div>

      {/* Selection complete indicator */}
      {isComplete && finalSelection && (
        <div className={styles.completeSection}>
          <Typography variant="body1" className={styles.completeText}>
            {t('Selection complete')}: <strong>{finalSelection.name}</strong>
          </Typography>
          {onSelectionComplete && (
            <Button
              variant="primary"
              onClick={handleSelectionComplete}
              className={styles.completeButton}
            >
              {t('Confirm Selection')}
            </Button>
          )}
        </div>
      )}

      {/* Empty state */}
      {selectionPath.length === 0 && (
        <Typography variant="body2" color="textSecondary" className={styles.emptyState}>
          {t('Please select a topic to begin')}
        </Typography>
      )}
    </Paper>
  );
};

export default CascadingSelect;
