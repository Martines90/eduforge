'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import { Select, SelectOption } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { useCascadingSelect } from '@/lib/hooks/useCascadingSelect';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context/UserContext';
import { NavigationTopic } from '@/types/navigation';
import { EducationalModel } from '@/lib/context/UserContext';
import { EducationalModelSelect } from '@/components/molecules/EducationalModelSelect';
import { DifficultyLevelSelect } from '@/components/molecules/DifficultyLevelSelect';
import { DifficultyLevel } from '@/lib/data/difficulty-levels';
import { ImageNumberSelect, ImageNumber } from '@/components/molecules/ImageNumberSelect';
import { TargetGroupSelect, TargetGroupSex } from '@/components/molecules/TargetGroupSelect';
import styles from './CascadingSelect.module.scss';

export interface TaskConfiguration {
  difficulty: DifficultyLevel;
  educationalModel: EducationalModel;
  numberOfImages: ImageNumber;
  targetGroupSex: TargetGroupSex;
}

export interface CascadingSelectProps {
  data: NavigationTopic[];
  title?: string;
  onSelectionComplete?: (topic: NavigationTopic, path: string[], config: TaskConfiguration) => void;
  className?: string;
  initialPath?: string[]; // Array of topic keys to pre-select
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
  initialPath,
}) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const {
    selectionPath,
    availableOptions,
    selectOption,
    reset,
    isComplete,
    finalSelection,
  } = useCascadingSelect({ data, initialPath });

  // Configuration state
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [educationalModel, setEducationalModel] = useState<EducationalModel>(
    user.educationalModel || 'secular'
  );
  const [numberOfImages, setNumberOfImages] = useState<ImageNumber>(1);
  const [targetGroupSex, setTargetGroupSex] = useState<TargetGroupSex>('mixed');

  const handleSelectionComplete = () => {
    if (finalSelection && onSelectionComplete) {
      const path = selectionPath.map((item) => item.displayName);
      const config: TaskConfiguration = {
        difficulty,
        educationalModel,
        numberOfImages,
        targetGroupSex,
      };
      onSelectionComplete(finalSelection, path, config);
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


      {/* Configuration Panel */}
      {onSelectionComplete && (
        <Accordion className={styles.configPanel}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="task-config-content"
            id="task-config-header"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon fontSize="small" />
              <Typography variant="subtitle1" fontWeight={600}>
                Feladat beállítások
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Difficulty Selector */}
              <DifficultyLevelSelect
                value={difficulty}
                onChange={setDifficulty}
                country={user.country}
                label="Nehézségi szint"
              />

              {/* Educational Model Selector */}
              <EducationalModelSelect
                value={educationalModel}
                onChange={setEducationalModel}
                country={user.country}
                label="Oktatási modell"
              />

              {/* Target Group Sex Selector */}
              <TargetGroupSelect
                value={targetGroupSex}
                onChange={setTargetGroupSex}
                label={t('Target Group')}
              />

              {/* Image Number Selector */}
              <ImageNumberSelect
                value={numberOfImages}
                onChange={setNumberOfImages}
                label="Képek száma"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Generate Task Button - Always visible */}
      {onSelectionComplete && (
        <div className={styles.actionSection}>
          <Button
            variant="primary"
            onClick={handleSelectionComplete}
            className={styles.completeButton}
            disabled={!isComplete || !finalSelection}
            fullWidth
          >
            Feladat generálása
          </Button>
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
