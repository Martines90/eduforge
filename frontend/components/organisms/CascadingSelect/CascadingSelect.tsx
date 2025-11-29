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
  FormControl,
  InputLabel,
  MenuItem,
  Select as MuiSelect,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import { Select, SelectOption } from '@/components/atoms/Select';
import { Button } from '@/components/atoms/Button';
import { useCascadingSelect } from '@/lib/hooks/useCascadingSelect';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context/UserContext';
import { NavigationTopic } from '@/types/navigation';
import styles from './CascadingSelect.module.scss';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type EducationalModel =
  | 'secular'
  | 'conservative'
  | 'traditional'
  | 'liberal'
  | 'progressive'
  | 'religious_christian'
  | 'religious_islamic'
  | 'religious_jewish'
  | 'montessori'
  | 'waldorf';

export interface TaskConfiguration {
  difficulty: DifficultyLevel;
  educationalModel: EducationalModel;
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
    (user.profile as any)?.educationalModel || 'secular'
  );

  const handleSelectionComplete = () => {
    if (finalSelection && onSelectionComplete) {
      const path = selectionPath.map((item) => item.displayName);
      const config: TaskConfiguration = {
        difficulty,
        educationalModel,
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
              <FormControl fullWidth>
                <InputLabel id="difficulty-label">Nehézségi szint</InputLabel>
                <MuiSelect
                  labelId="difficulty-label"
                  value={difficulty}
                  label="Nehézségi szint"
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                >
                  <MenuItem value="easy">Könnyű</MenuItem>
                  <MenuItem value="medium">Közepes</MenuItem>
                  <MenuItem value="hard">Nehéz</MenuItem>
                </MuiSelect>
              </FormControl>

              {/* Educational Model Selector */}
              <FormControl fullWidth>
                <InputLabel id="educational-model-label">Oktatási modell</InputLabel>
                <MuiSelect
                  labelId="educational-model-label"
                  value={educationalModel}
                  label="Oktatási modell"
                  onChange={(e) => setEducationalModel(e.target.value as EducationalModel)}
                >
                  <MenuItem value="secular">Szekuláris</MenuItem>
                  <MenuItem value="conservative">Konzervatív</MenuItem>
                  <MenuItem value="traditional">Hagyományos</MenuItem>
                  <MenuItem value="liberal">Liberális</MenuItem>
                  <MenuItem value="progressive">Progresszív</MenuItem>
                  <MenuItem value="religious_christian">Vallási - Keresztény</MenuItem>
                  <MenuItem value="religious_islamic">Vallási - Iszlám</MenuItem>
                  <MenuItem value="religious_jewish">Vallási - Zsidó</MenuItem>
                  <MenuItem value="montessori">Montessori</MenuItem>
                  <MenuItem value="waldorf">Waldorf</MenuItem>
                </MuiSelect>
              </FormControl>
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
