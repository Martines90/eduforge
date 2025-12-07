'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, Paper, Alert, Tabs, Tab } from '@mui/material';
import { CascadingSelect, TaskConfiguration } from '@/components/organisms/CascadingSelect';
import { TaskResult } from '@/components/organisms/TaskResult';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { NavigationTopic, GradeLevel } from '@/types/navigation';
import { GeneratedTask, TaskGeneratorRequest } from '@/types/task';
import { useTranslation } from '@/lib/i18n';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
import { useFirebaseToken } from '@/lib/hooks/useFirebaseToken';
import { useUser } from '@/lib/context/UserContext';
import { generateTaskComplete, TaskGenerationStep } from '@/lib/services/task-generator.service';
import { saveTask, SaveTaskRequest } from '@/lib/services/task-save.service';
import { TaskSavedModal } from '@/components/organisms/TaskSavedModal';
import navigationData from '@/data/navigation_mapping.json';
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
  const [savedTaskInfo, setSavedTaskInfo] = useState<{ taskId: string; publicShareLink: string } | null>(null);
  const [currentCurriculumPath, setCurrentCurriculumPath] = useState<string>('');

  // Read URL params on mount
  useEffect(() => {
    const pathParam = searchParams.get('subject_path_selection');
    const gradeParam = searchParams.get('gradeLevel');

    if (pathParam) {
      const keys = pathParam.split(':').filter(k => k.length > 0);
      setInitialPath(keys);
      console.log('Initial path from URL:', keys);
    }

    if (gradeParam) {
      // Set the grade tab based on URL param
      if (gradeParam === 'grade_11_12') {
        setSelectedGrade(1);
      } else {
        setSelectedGrade(0);
      }
    }

    // Mark that we've applied the URL params
    if ((pathParam || gradeParam) && !urlParamsApplied) {
      setUrlParamsApplied(true);
    }
  }, [searchParams, urlParamsApplied]);

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

      // Build curriculum path from selection
      // Use "mathematics" to match the subjectMappings collection format
      const curriculumPath = `mathematics:${gradeLevel}:${path.join(':')}`;
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
      html += `<h2>Feladatok:</h2>\n<ol>\n`;
      taskText.questions.forEach((q: string) => html += `<li>${q}</li>\n`);
      html += `</ol>\n`;
    }
    return html;
  };

  const formatSolution = (solution: any): string => {
    let html = '';
    if (solution.solution_steps && solution.solution_steps.length > 0) {
      html += `<h2>Megoldás lépései:</h2>\n`;
      solution.solution_steps.forEach((step: any) => {
        html += `<div class="solution-step">\n`;
        html += `<h3>${step.step_number}. ${step.title}</h3>\n`;
        html += `<p>${step.description}</p>\n`;
        if (step.formula) html += `<p><strong>Képlet:</strong> ${step.formula}</p>\n`;
        if (step.calculation) html += `<p><strong>Számítás:</strong> ${step.calculation}</p>\n`;
        if (step.result) html += `<p><strong>Eredmény:</strong> ${step.result}</p>\n`;
        if (step.explanation) html += `<p><em>${step.explanation}</em></p>\n`;
        html += `</div>\n`;
      });
    }
    if (solution.final_answer) {
      html += `<h2>Végeredmény:</h2>\n<p><strong>${solution.final_answer}</strong></p>\n`;
    }
    if (solution.verification) {
      html += `<h3>Ellenőrzés:</h3>\n<p>${solution.verification}</p>\n`;
    }
    if (solution.common_mistakes && solution.common_mistakes.length > 0) {
      html += `<h3>Gyakori hibák:</h3>\n<ul>\n`;
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
        created_by: user.profile?.email || '',
      };

      const response = await saveTask(saveRequest, firebaseToken);

      setSavedTaskInfo({
        taskId: response.task_id,
        publicShareLink: response.public_share_link,
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

  const gradeLevel: GradeLevel = selectedGrade === 0 ? 'grade_9_10' : 'grade_11_12';
  const currentData = navigationData[gradeLevel];

  // Show loading state while checking authorization
  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // If not authorized, the hook will redirect - show loading
  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
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
            <Tab label={t('Grade 9-10')} id="grade-tab-0" aria-controls="grade-tabpanel-0" />
            <Tab label={t('Grade 11-12')} id="grade-tab-1" aria-controls="grade-tabpanel-1" />
          </Tabs>
        </Paper>

        <TabPanel value={selectedGrade} index={0}>
          <CascadingSelect
            data={currentData}
            title={`${t('Select Topic')} (${t('Grade 9-10')})`}
            onSelectionComplete={handleSelectionComplete}
            initialPath={selectedGrade === 0 ? initialPath : undefined}
          />
        </TabPanel>

        <TabPanel value={selectedGrade} index={1}>
          <CascadingSelect
            data={currentData}
            title={`${t('Select Topic')} (${t('Grade 11-12')})`}
            onSelectionComplete={handleSelectionComplete}
            initialPath={selectedGrade === 1 ? initialPath : undefined}
          />
        </TabPanel>

        {/* Task Generation Result */}
        {(isGenerating || generatedTask || generationError) && (
          <TaskResult
            task={generatedTask}
            loading={isGenerating}
            loadingMessage={generationStep?.message}
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
