'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, Paper, Alert, Tabs, Tab } from '@mui/material';
import { CascadingSelect, TaskConfiguration } from '@/components/organisms/CascadingSelect';
import { TaskResult } from '@/components/organisms/TaskResult';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { NavigationTopic } from '@/types/navigation';
import { GeneratedTask, TaskGeneratorRequest } from '@/types/task';
import { useTranslation } from '@/lib/i18n';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useFirebaseToken } from '@/lib/hooks/useFirebaseToken';
import { useUser } from '@/lib/context/UserContext';
import { generateTaskComplete, TaskGenerationStep } from '@/lib/services/task-generator.service';
import { saveTask, SaveTaskRequest } from '@/lib/services/task-save.service';
import { TaskSavedModal } from '@/components/organisms/TaskSavedModal';
import { fetchAllGradeTrees } from '@/lib/services/subject-mapping.service';
import { GradeLevel, GradeConfig } from '@eduforger/shared';
import styles from './page.module.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`grade-tabpanel-${index}`}
      aria-labelledby={`grade-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function TaskCreatorContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { token: firebaseToken } = useFirebaseToken();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<NavigationTopic | null>(null);
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [taskConfig, setTaskConfig] = useState<TaskConfiguration | null>(null);
  const [initialPath, setInitialPath] = useState<string[] | undefined>(undefined);
  const [urlParamsApplied, setUrlParamsApplied] = useState(false);
  const [generatedTask, setGeneratedTask] = useState<GeneratedTask | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<TaskGenerationStep | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedTaskInfo, setSavedTaskInfo] = useState<{ taskId: string; publicShareLink: string; pdfUrl?: string } | null>(null);
  const [currentCurriculumPath, setCurrentCurriculumPath] = useState<string>('');
  const [navigationData, setNavigationData] = useState<Record<string, NavigationTopic[]> | null>(null);
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(true);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [availableGrades, setAvailableGrades] = useState<GradeConfig[]>([]);

  // Fetch navigation data from API based on user's country
  // Only fetch once when user is fully loaded and isAuthorized
  useEffect(() => {
    const loadNavigationData = async () => {
      console.log('[Task Creator] User object:', user);
      console.log('[Task Creator] User country:', user.country);
      console.log('[Task Creator] isAuthorized:', isAuthorized);

      // Wait for authorization check to complete
      if (isLoading) {
        console.log('[Task Creator] Waiting for authorization check...');
        return;
      }

      if (!isAuthorized) {
        console.log('[Task Creator] User not authorized, skipping data fetch');
        return;
      }

      if (!user.country) {
        console.log('[Task Creator] Waiting for user country...');
        return;
      }

      if (!user.subject) {
        console.log('[Task Creator] Waiting for user subject...');
        return;
      }

      setIsLoadingNavigation(true);
      setNavigationError(null);

      try {
        console.log('[Task Creator] Fetching navigation data for country:', user.country, 'subject:', user.subject);

        // Import gradeSystem helpers
        const { getGradesForCountry } = await import('@eduforger/shared');
        const grades = getGradesForCountry(user.country as any);
        setAvailableGrades(grades);

        const data = await fetchAllGradeTrees(user.country, user.subject);
        setNavigationData(data);
        console.log('[Task Creator] Navigation data loaded successfully');
      } catch (error) {
        console.error('[Task Creator] Error loading navigation data:', error);
        setNavigationError(error instanceof Error ? error.message : 'Failed to load curriculum data');
      } finally {
        setIsLoadingNavigation(false);
      }
    };

    loadNavigationData();
  }, [user.country, user.subject, isAuthorized, isLoading]);

  // Read URL params on mount
  useEffect(() => {
    const pathParam = searchParams.get('subject_path_selection');
    const gradeParam = searchParams.get('gradeLevel');

    if (pathParam) {
      const keys = pathParam.split(':').filter(k => k.length > 0);
      setInitialPath(keys);
      console.log('Initial path from URL:', keys);
    }

    if (gradeParam && availableGrades.length > 0) {
      // Set the grade tab based on URL param - find the index matching the gradeParam
      const gradeIndex = availableGrades.findIndex(g => g.value === gradeParam);
      if (gradeIndex >= 0) {
        setSelectedGrade(gradeIndex);
      }
    }

    // Mark that we've applied the URL params
    if ((pathParam || gradeParam) && !urlParamsApplied) {
      setUrlParamsApplied(true);
    }
  }, [searchParams, urlParamsApplied, availableGrades]);

  // Remove URL params after they've been applied to state
  useEffect(() => {
    if (urlParamsApplied && (searchParams.get('subject_path_selection') || searchParams.get('gradeLevel'))) {
      // Wait a bit to ensure the CascadingSelect has processed the initialPath
      const timer = setTimeout(() => {
        router.replace('/task_creator', { scroll: false });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [urlParamsApplied, searchParams, router]);

  const handleGradeChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedGrade(newValue);
    setSelectedTopic(null);
    setSelectionPath([]);
    setInitialPath(undefined); // Clear initial path when manually changing grade
  };

  const handleSelectionComplete = async (topic: NavigationTopic, path: string[], config: TaskConfiguration) => {
    setSelectedTopic(topic);
    setSelectionPath(path);
    setTaskConfig(config);
    setGenerationError(null);
    console.log('Selection complete:', { topic, path, config });

    // Automatically generate task
    await handleGenerateTask(topic, path, config);
  };

  const handleGenerateTask = async (topic: NavigationTopic, path: string[], config: TaskConfiguration) => {
    if (!topic || !config) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedTask(null);
    setGenerationStep(null);

    try {
      // Check if we have a Firebase token
      if (!firebaseToken) {
        setGenerationError('Authentication required. Please refresh the page and try again.');
        setIsGenerating(false);
        return;
      }

      console.log('[Task Creator] Starting multi-step task generation');

      // Get current grade level
      const currentGradeConfig = availableGrades[selectedGrade];
      if (!currentGradeConfig) {
        setGenerationError('Invalid grade level selection.');
        setIsGenerating(false);
        return;
      }

      // Build curriculum path from selection
      // Use user's subject to match the subjectMappings collection format
      const curriculumPath = `${user.subject}:${currentGradeConfig.value}:${path.join(':')}`;
      setCurrentCurriculumPath(curriculumPath);

      // Map targetGroupSex to TargetGroup type
      const mapTargetGroup = (sex: 'mixed' | 'male' | 'female'): 'mixed' | 'boys' | 'girls' => {
        if (sex === 'male') return 'boys';
        if (sex === 'female') return 'girls';
        return 'mixed';
      };

      // Build request payload
      const request: TaskGeneratorRequest = {
        curriculum_path: curriculumPath,
        country_code: user.country,
        target_group: mapTargetGroup(config.targetGroupSex),
        difficulty_level: config.difficulty,
        educational_model: config.educationalModel,
        number_of_images: config.numberOfImages,
        display_template: 'modern', // Default to modern, can be made configurable
        precision_settings: {
          constant_precision: 2,
          intermediate_precision: 4,
          final_answer_precision: 2,
          use_exact_values: false,
        },
        custom_keywords: [],
        template_id: '',
      };

      console.log('Generating task with request:', request);

      // Use multi-step generation with progress updates
      const result = await generateTaskComplete(request, firebaseToken, (step) => {
        console.log('[Task Creator] Generation step:', step);
        setGenerationStep(step);
      });

      // Format the result for display
      console.log('[Task Creator] Raw result from API:', result);
      console.log('[Task Creator] result.images:', result.images);
      console.log('[Task Creator] result.images.images:', result.images?.images);

      const generatedTask: GeneratedTask = {
        id: result.taskId,
        description: formatTaskDescription(result.taskText, request.number_of_images),
        solution: formatSolution(result.solution),
        images: result.images.images || [],
      };

      console.log('[Task Creator] Formatted generatedTask:', generatedTask);
      console.log('[Task Creator] generatedTask.images:', generatedTask.images);
      setGeneratedTask(generatedTask);
    } catch (error) {
      console.error('Task generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
      setGenerationStep(null);
    }
  };

  // Helper functions to format task data
  const formatTaskDescription = (taskText: any, numberOfImages: number): string => {
    let html = '';
    if (taskText.title) html += `<h1>${taskText.title}</h1>\n`;
    if (taskText.story_text) {
      // Add image placeholders as first child inside the story div
      let storyContent = '';
      if (numberOfImages > 0) {
        for (let i = 1; i <= numberOfImages; i++) {
          storyContent += `[IMAGE_${i}]\n`;
        }
      }
      storyContent += taskText.story_text;

      html += `<div class="story">\n${storyContent}\n</div>\n`;
    }
    if (taskText.questions && taskText.questions.length > 0) {
      html += `<h2>${t('Questions')}:</h2>\n<ol>\n`;
      taskText.questions.forEach((q: string) => html += `<li>${q}</li>\n`);
      html += `</ol>\n`;
    }
    return html;
  };

  const formatSolution = (solution: any): string => {
    let html = '';
    if (solution.solution_steps && solution.solution_steps.length > 0) {
      html += `<h2>${t('Solution Steps')}:</h2>\n`;
      solution.solution_steps.forEach((step: any) => {
        html += `<div class="solution-step">\n`;
        html += `<h3>${step.step_number}. ${step.title}</h3>\n`;
        html += `<p>${step.description}</p>\n`;
        if (step.formula) html += `<p><strong>${t('Formula')}:</strong> ${step.formula}</p>\n`;
        if (step.calculation) html += `<p><strong>${t('Calculation')}:</strong> ${step.calculation}</p>\n`;
        if (step.result) html += `<p><strong>${t('Result')}:</strong> ${step.result}</p>\n`;
        if (step.explanation) html += `<p><em>${step.explanation}</em></p>\n`;
        html += `</div>\n`;
      });
    }
    if (solution.final_answer) {
      html += `<h2>${t('Final Answer')}:</h2>\n<p><strong>${solution.final_answer}</strong></p>\n`;
    }
    if (solution.verification) {
      html += `<h3>${t('Verification')}:</h3>\n<p>${solution.verification}</p>\n`;
    }
    if (solution.common_mistakes && solution.common_mistakes.length > 0) {
      html += `<h3>${t('Common Mistakes')}:</h3>\n<ul>\n`;
      solution.common_mistakes.forEach((m: string) => html += `<li>${m}</li>\n`);
      html += `</ul>\n`;
    }
    return html;
  };

  const handleSaveTask = (editedTask: GeneratedTask) => {
    console.log('Saving edited task:', editedTask);
    setGeneratedTask(editedTask);
    // TODO: Save to backend/Firestore
  };

  const handleCloseResult = () => {
    setGeneratedTask(null);
    setGenerationError(null);
  };

  const handleSaveTaskToDatabase = async () => {
    if (!generatedTask || !firebaseToken) {
      console.error('Cannot save task: missing task or token');
      return;
    }

    setIsSaving(true);
    try {
      const saveRequest: SaveTaskRequest = {
        task_id: generatedTask.id,
        task_data: {
          description: generatedTask.description,
          solution: generatedTask.solution,
          images: generatedTask.images,
        },
        curriculum_path: currentCurriculumPath,
        country_code: user.country,
      };

      const response = await saveTask(saveRequest, firebaseToken);

      setSavedTaskInfo({
        taskId: response.task_id,
        publicShareLink: response.public_share_link,
        pdfUrl: response.pdf_url,
      });
      setShowSavedModal(true);

      console.log('Task saved successfully:', response);
    } catch (error) {
      console.error('Failed to save task:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseSavedModal = () => {
    setShowSavedModal(false);
  };

  // Get current grade level based on selected tab index
  const currentGradeConfig = availableGrades[selectedGrade];
  const gradeLevel: GradeLevel | undefined = currentGradeConfig?.value;
  const currentData = navigationData && gradeLevel ? navigationData[gradeLevel] : [];

  // Show loading state while checking authorization
  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // If not authorized, the hook will redirect - show loading
  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  // Show loading state while fetching navigation data
  if (isLoadingNavigation) {
    return <LoadingSpinner message="Loading curriculum data..." fullScreen />;
  }

  // Show error if navigation data failed to load
  if (navigationError) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>Failed to load curriculum data</Typography>
          <Typography variant="body2">{navigationError}</Typography>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  // Show error if navigation data is empty
  if (!navigationData || !currentData || currentData.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>No curriculum data available</Typography>
          <Typography variant="body2">
            Curriculum data for {user.country} is not yet available. Please contact support.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Container maxWidth="lg" className={styles.container}>
        <Box className={styles.header}>
          <Typography variant="h3" component="h1" className={styles.title}>
            {t('Task Creator')}
          </Typography>
          <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
            {t('Select a curriculum topic to create an educational task')}
          </Typography>
        </Box>

        <Paper elevation={2} className={styles.gradeSelector}>
          <Tabs
            value={selectedGrade}
            onChange={handleGradeChange}
            aria-label="Select grade level"
            variant="fullWidth"
            className={styles.tabs}
          >
            {availableGrades.map((grade, index) => (
              <Tab
                key={grade.value}
                label={grade.labelEN}
                id={`grade-tab-${index}`}
                aria-controls={`grade-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Paper>

        {availableGrades.map((grade, index) => (
          <TabPanel key={grade.value} value={selectedGrade} index={index}>
            <CascadingSelect
              data={selectedGrade === index && navigationData ? navigationData[grade.value] || [] : []}
              title={`${t('Select Topic')} (${grade.labelEN})`}
              onSelectionComplete={handleSelectionComplete}
              initialPath={selectedGrade === index ? initialPath : undefined}
            />
          </TabPanel>
        ))}

        {/* Task Generation Result */}
        {(isGenerating || generatedTask || generationError) && (
          <TaskResult
            task={generatedTask}
            loading={isGenerating}
            loadingMessage={generationStep?.message ? t(generationStep.message as any) : undefined}
            loadingProgress={generationStep?.progress}
            error={generationError || undefined}
            onClose={handleCloseResult}
            onSave={handleSaveTask}
            onSaveToDatabase={handleSaveTaskToDatabase}
            isSaving={isSaving}
          />
        )}

        {/* Task Saved Success Modal */}
        {showSavedModal && savedTaskInfo && (
          <TaskSavedModal
            open={showSavedModal}
            onClose={handleCloseSavedModal}
            taskId={savedTaskInfo.taskId}
            publicShareLink={savedTaskInfo.publicShareLink}
            pdfUrl={savedTaskInfo.pdfUrl}
          />
        )}
      </Container>
    </div>
  );
}

export default function TaskCreatorPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." fullScreen />}>
      <TaskCreatorContent />
    </Suspense>
  );
}
