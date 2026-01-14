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
  Select as MuiSelect,
  MenuItem,
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
import { TargetGroupSelect, TargetGroupSex } from '@/components/molecules/TargetGroupSelect';
import { Subject, SUBJECTS } from '@eduforger/shared';
import styles from './CascadingSelect.module.scss';

export interface TaskConfiguration {
  difficulty: DifficultyLevel;
  educationalModel: EducationalModel;
  targetGroupSex: TargetGroupSex;
}

export interface CascadingSelectProps {
  data: NavigationTopic[];
  title?: string;
  onSelectionComplete?: (topic: NavigationTopic, path: string[], config: TaskConfiguration) => void;
  onSelectionChange?: (path: string[]) => void; // Callback for intermediate selections
  className?: string;
  initialPath?: string[]; // Array of topic keys to pre-select
  // Subject selector props
  selectedSubject?: Subject | null;
  onSubjectChange?: (subject: Subject) => void;
  availableSubjects?: Subject[]; // For teachers - only their subjects
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
  onSelectionChange,
  className,
  initialPath,
  selectedSubject,
  onSubjectChange,
  availableSubjects,
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
  const [targetGroupSex, setTargetGroupSex] = useState<TargetGroupSex>('mixed');

  // Notify parent of selection changes for URL updates
  React.useEffect(() => {
    if (onSelectionChange && selectionPath.length > 0) {
      // CRITICAL: Use 'key' not 'displayName' for curriculum path
      // The curriculum path must use machine-readable keys to match the JSON structure
      const path = selectionPath.map((item) => item.key);
      onSelectionChange(path);
    }
  }, [selectionPath, onSelectionChange]);

  const handleSelectionComplete = () => {
    if (finalSelection && onSelectionComplete) {
      // CRITICAL: Use 'key' not 'displayName' for curriculum path
      // The curriculum path must use machine-readable keys to match the JSON structure
      const path = selectionPath.map((item) => item.key);
      const config: TaskConfiguration = {
        difficulty,
        educationalModel,
        targetGroupSex,
      };
      onSelectionComplete(finalSelection, path, config);
    }
  };

  // Check if a subject is enabled for the current user
  const isSubjectEnabled = (subject: Subject): boolean => {
    // If no available subjects specified, all are enabled (guest mode)
    if (!availableSubjects) return true;
    // For registered teachers, only their subjects are enabled
    return availableSubjects.includes(subject);
  };

  const handleSubjectChangeInternal = (event: any) => {
    const newSubject = event.target.value as Subject;
    if (onSubjectChange) {
      onSubjectChange(newSubject);
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

      {/* Subject selector - show if onSubjectChange is provided */}
      {onSubjectChange && (
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="subject-select-label">{t('Subject')}</InputLabel>
            <MuiSelect
              labelId="subject-select-label"
              id="subject-select"
              value={selectedSubject || ''}
              label={t('Subject')}
              onChange={handleSubjectChangeInternal}
            >
              {SUBJECTS.map((subjectOption) => {
                const enabled = isSubjectEnabled(subjectOption.value);
                return (
                  <MenuItem
                    key={subjectOption.value}
                    value={subjectOption.value}
                    disabled={!enabled}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <span>{subjectOption.emoji}</span>
                      <span>{subjectOption.labelEN}</span>
                      {!enabled && <span style={{ marginLeft: 'auto', fontSize: '0.85em', color: '#999' }}>({t('Not in your skillset')})</span>}
                    </Box>
                  </MenuItem>
                );
              })}
            </MuiSelect>
          </FormControl>
        </Box>
      )}

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
                {t('Task Settings')}
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
                label={t('Difficulty Level')}
              />

              {/* Educational Model Selector */}
              <EducationalModelSelect
                value={educationalModel}
                onChange={setEducationalModel}
                country={user.country}
                label={t('Educational Model')}
              />

              {/* Target Group Sex Selector */}
              <TargetGroupSelect
                value={targetGroupSex}
                onChange={setTargetGroupSex}
                label={t('Target Group')}
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
            {t('Generate Task')}
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
