'use client';

import React from 'react';
import { Box, Typography, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import styles from './ProgressStepper.module.scss';

export interface StepConfig {
  label: string;
  description?: string;
}

export interface ProgressStepperProps {
  steps: StepConfig[];
  activeStep: number;
  completedSteps: number[];
  onStepClick?: (step: number) => void;
  allowBackNavigation?: boolean;
}

/**
 * ProgressStepper Molecule Component
 * Shows a visual roadmap of the onboarding process
 * Allows navigation to previous steps
 */
export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  activeStep,
  completedSteps,
  onStepClick,
  allowBackNavigation = true,
}) => {
  const handleStepClick = (stepIndex: number) => {
    if (!allowBackNavigation || !onStepClick) return;

    // Only allow clicking on completed steps or previous steps
    if (stepIndex < activeStep || completedSteps.includes(stepIndex)) {
      onStepClick(stepIndex);
    }
  };

  const isStepClickable = (stepIndex: number): boolean => {
    if (!allowBackNavigation) return false;
    return stepIndex < activeStep || completedSteps.includes(stepIndex);
  };

  return (
    <Box className={styles.container}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        className={styles.stepper}
      >
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isClickable = isStepClickable(index);
          const isCurrent = index === activeStep;

          return (
            <Step key={step.label} completed={isCompleted} className={styles.step}>
              {isClickable ? (
                <StepButton
                  onClick={() => handleStepClick(index)}
                  className={`${styles.stepButton} ${isCurrent ? styles.current : ''}`}
                >
                  <StepLabel
                    StepIconComponent={() => (
                      <Box className={`${styles.stepIcon} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.active : ''}`}>
                        {isCompleted ? (
                          <CheckCircleIcon className={styles.checkIcon} />
                        ) : (
                          <Typography variant="body2" className={styles.stepNumber}>
                            {index + 1}
                          </Typography>
                        )}
                      </Box>
                    )}
                  >
                    <Typography
                      variant="body2"
                      className={`${styles.stepLabel} ${isCurrent ? styles.currentLabel : ''}`}
                    >
                      {step.label}
                    </Typography>
                    {step.description && (
                      <Typography variant="caption" className={styles.stepDescription}>
                        {step.description}
                      </Typography>
                    )}
                  </StepLabel>
                </StepButton>
              ) : (
                <StepLabel
                  StepIconComponent={() => (
                    <Box className={`${styles.stepIcon} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.active : ''}`}>
                      {isCompleted ? (
                        <CheckCircleIcon className={styles.checkIcon} />
                      ) : (
                        <Typography variant="body2" className={styles.stepNumber}>
                          {index + 1}
                        </Typography>
                      )}
                    </Box>
                  )}
                >
                  <Typography
                    variant="body2"
                    className={`${styles.stepLabel} ${isCurrent ? styles.currentLabel : ''}`}
                  >
                    {step.label}
                  </Typography>
                  {step.description && (
                    <Typography variant="caption" className={styles.stepDescription}>
                      {step.description}
                    </Typography>
                  )}
                </StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>

      <Box className={styles.progress}>
        <Box className={styles.progressBar}>
          <Box
            className={styles.progressFill}
            sx={{
              width: `${((activeStep + 1) / steps.length) * 100}%`,
            }}
          />
        </Box>
        <Typography variant="caption" className={styles.progressText}>
          Step {activeStep + 1} of {steps.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressStepper;
