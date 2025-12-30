'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, Paper, Alert, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import { CascadingSelect, TaskConfiguration } from '@/components/organisms/CascadingSelect';
import { TaskResult } from '@/components/organisms/TaskResult';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { NavigationTopic, GradeLevel } from '@/types/navigation';
import { GeneratedTask, TaskGeneratorRequest } from '@/types/task';
import { Subject } from '@/types/i18n';
import { useTranslation } from '@/lib/i18n';
import { useUser } from '@/lib/context/UserContext';
import { useGuestSession } from '@/lib/hooks/useGuestSession';
import { useLastUnpublishedTask } from '@/lib/hooks/useLastUnpublishedTask';
import { GuestPromptModal } from '@/components/organisms/GuestPromptModal';
import { generateTaskComplete, TaskGenerationStep } from '@/lib/services/task-generator.service';
import { saveTask, SaveTaskRequest } from '@/lib/services/task-save.service';
import { TaskSavedModal } from '@/components/organisms/TaskSavedModal';
import { fetchAllGradeTrees } from '@/lib/services/subject-mapping.service';
import { useSnackbar } from 'notistack';
import { API_BASE_URL } from '@/lib/services/api.service';
import styles from '../task_creator/page.module.scss';

// Subject options for the dropdown
const SUBJECT_OPTIONS: { value: Subject; label: string }[] = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'information_technology', label: 'Informatics' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'literature', label: 'Literature' },
];

// Grade level options for the dropdown
const GRADE_OPTIONS: { value: GradeLevel; label: string }[] = [
  { value: 'grade_9_10', label: 'Grade 9-10' },
  { value: 'grade_11_12', label: 'Grade 11-12' },
];

function TaskGeneratorContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { enqueueSnackbar } = useSnackbar();

  // Guest session management
  const guestSession = useGuestSession();
  const isGuest = !user.isRegistered;

  // Last unpublished task management (for all users)
  const lastUnpublishedTask = useLastUnpublishedTask();

  // Subject and Grade state
  const [selectedSubject, setSelectedSubject] = useState<string>(user.subject || 'mathematics');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('grade_9_10');

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
  const [navigationData, setNavigationData] = useState<{ grade_9_10: NavigationTopic[]; grade_11_12: NavigationTopic[] } | null>(null);
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(true);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // Guest modal state
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Auto-create guest session on mount (if guest)
  useEffect(() => {
    if (isGuest && !guestSession.guestToken && !guestSession.isLoading) {
      console.log('[Task Generator] Creating guest session...');
      guestSession.createGuestSession();
    }
  }, [isGuest, guestSession.guestToken, guestSession.isLoading]);

  // Load last unpublished task on mount (for all users)
  useEffect(() => {
    if (!generatedTask && lastUnpublishedTask.lastTask) {
      console.log('[Task Generator] Loading last unpublished task');
      setGeneratedTask(lastUnpublishedTask.lastTask);
    }
  }, [lastUnpublishedTask.lastTask]);

  // Fetch navigation data from API based on selected subject
  useEffect(() => {
    const loadNavigationData = async () => {
      console.log('[Task Generator] Loading navigation data');
      console.log('[Task Generator] Selected subject:', selectedSubject);
      console.log('[Task Generator] User country:', user.country);

      const country = user.country || 'HU';

      setIsLoadingNavigation(true);
      setNavigationError(null);

      try {
        console.log('[Task Generator] Fetching navigation data for country:', country, 'subject:', selectedSubject);
        const data = await fetchAllGradeTrees(country, selectedSubject);
        setNavigationData(data);
        console.log('[Task Generator] Navigation data loaded successfully');
      } catch (error) {
        console.error('[Task Generator] Error loading navigation data:', error);
        setNavigationError(error instanceof Error ? error.message : 'Failed to load curriculum data');
      } finally {
        setIsLoadingNavigation(false);
      }
    };

    if (selectedSubject) {
      loadNavigationData();
    }
  }, [selectedSubject, user.country]);

  // Read URL params on mount and sync with state
  useEffect(() => {
    if (urlParamsApplied) return;

    const subjectParam = searchParams.get('subject');
    const gradeParam = searchParams.get('grade_level');
    const pathParams: string[] = [];

    // Collect level_1, level_2, level_3, etc.
    let i = 1;
    while (searchParams.get(`level_${i}`)) {
      pathParams.push(searchParams.get(`level_${i}`)!);
      i++;
    }

    console.log('[Task Generator] URL params:', { subjectParam, gradeParam, pathParams });

    // Apply subject
    if (subjectParam) {
      setSelectedSubject(subjectParam);
    }

    // Apply grade level
    if (gradeParam && (gradeParam === 'grade_9_10' || gradeParam === 'grade_11_12')) {
      setSelectedGrade(gradeParam);
    }

    // Apply initial path if we have path params
    if (pathParams.length > 0) {
      setInitialPath(pathParams);
      console.log('[Task Generator] Initial path from URL:', pathParams);
    }

    // Mark that we've applied the URL params
    if (subjectParam || gradeParam || pathParams.length > 0) {
      setUrlParamsApplied(true);
    }
  }, [searchParams, urlParamsApplied]);

  // Set initial URL params on first load (after navigation data is loaded)
  useEffect(() => {
    // Only set initial URL if:
    // 1. Navigation data has loaded
    // 2. URL doesn't already have subject/grade params
    // 3. We haven't already set initial params
    if (!isLoadingNavigation && navigationData && !searchParams.get('subject') && !searchParams.get('grade_level')) {
      console.log('[Task Generator] Setting initial URL params:', { subject: selectedSubject, grade: selectedGrade });
      updateUrlParams({ subject: selectedSubject, grade_level: selectedGrade });
    }
  }, [isLoadingNavigation, navigationData, selectedSubject, selectedGrade]);

  // Update URL params helper
  const updateUrlParams = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    // Clear existing level params
    let i = 1;
    while (newParams.has(`level_${i}`)) {
      newParams.delete(`level_${i}`);
      i++;
    }

    // Set new params
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  const handleSubjectChange = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setSelectionPath([]);
    setInitialPath(undefined);
    updateUrlParams({ subject, grade_level: selectedGrade });
  };

  const handleGradeChange = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setSelectedTopic(null);
    setSelectionPath([]);
    setInitialPath(undefined);
    updateUrlParams({ subject: selectedSubject, grade_level: grade });
  };

  // Handle intermediate selection changes (updates URL as user selects each level)
  const handleSelectionChange = (path: string[]) => {
    console.log('[Task Generator] Selection changed:', path);

    // Update URL with current selection path
    const urlParams: Record<string, string> = {
      subject: selectedSubject,
      grade_level: selectedGrade,
    };

    // Add level parameters
    path.forEach((level, index) => {
      urlParams[`level_${index + 1}`] = level;
    });

    updateUrlParams(urlParams);
  };

  const handleSelectionComplete = async (topic: NavigationTopic, path: string[], config: TaskConfiguration) => {
    // Check guest limit BEFORE starting generation
    if (isGuest && !guestSession.canGenerate) {
      setModalMessage("You've used all 3 free generations! Register (FREE) to get 100 more credits.");
      setShowGuestModal(true);
      enqueueSnackbar('Register to continue generating tasks!', {
        variant: 'warning',
        autoHideDuration: 5000,
      });
      return;
    }

    setSelectedTopic(topic);
    setSelectionPath(path);
    setTaskConfig(config);
    setGenerationError(null);
    console.log('[Task Generator] Selection complete:', { topic, path, config });

    // Update URL with complete selection including levels
    const urlParams: Record<string, string> = {
      subject: selectedSubject,
      grade_level: selectedGrade,
    };

    // Add level parameters
    path.forEach((level, index) => {
      urlParams[`level_${index + 1}`] = level;
    });

    updateUrlParams(urlParams);

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
      console.log('[Task Generator] handleGenerateTask called');
      console.log('[Task Generator] isGuest:', isGuest);
      console.log('[Task Generator] guestSession.guestToken:', guestSession.guestToken);
      console.log('[Task Generator] guestSession.isLoading:', guestSession.isLoading);
      console.log('[Task Generator] user.profile?.token:', user.profile?.token);

      const token = isGuest ? guestSession.guestToken : user.profile?.token;

      if (!token) {
        console.error('[Task Generator] No token available!');
        console.error('[Task Generator] isGuest:', isGuest);
        console.error('[Task Generator] guestSession:', guestSession);
        setGenerationError('Authentication required. Please refresh the page and try again.');
        setIsGenerating(false);
        return;
      }

      console.log('[Task Generator] Starting task generation');
      console.log('[Task Generator] isGuest:', isGuest);
      console.log('[Task Generator] Token:', token?.substring(0, 20) + '...');

      const gradeLevel: GradeLevel = selectedGrade;
      const country = user.country || 'HU';
      const subject = selectedSubject;

      // Build curriculum path
      const curriculumPath = `${subject}:${gradeLevel}:${path.join(':')}`;
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
        country_code: country,
        target_group: mapTargetGroup(config.targetGroupSex),
        difficulty_level: config.difficulty,
        educational_model: config.educationalModel,
        number_of_images: config.numberOfImages,
        display_template: 'modern',
        precision_settings: {
          constant_precision: 2,
          intermediate_precision: 4,
          final_answer_precision: 2,
          use_exact_values: false,
        },
        custom_keywords: [],
        template_id: '',
      };

      console.log('[Task Generator] Generating task with request:', request);

      // Use multi-step generation with progress updates
      const result = await generateTaskComplete(request, token, (step) => {
        console.log('[Task Generator] Generation step:', step);
        setGenerationStep(step);
      });

      // Format the result for display
      const generatedTask: GeneratedTask = {
        id: result.taskId,
        description: formatTaskDescription(result.taskText, request.number_of_images),
        solution: formatSolution(result.solution),
        images: result.images.images || [],
      };

      console.log('[Task Generator] Task generated successfully');
      setGeneratedTask(generatedTask);

      // Save task to localStorage (for all users - persists until published)
      lastUnpublishedTask.saveTask(generatedTask);

      // Increment guest generation counter
      if (isGuest) {
        guestSession.incrementGeneration();
        console.log('[Task Generator] Guest generation count incremented');
      }
    } catch (error: any) {
      console.error('[Task Generator] Task generation error:', error);

      // Check if this is a guest limit error
      if (error.message?.includes('Generation limit reached') || error.message?.includes('limitReached')) {
        setModalMessage(error.message || "You've reached your free generation limit. Register (FREE) to get 100 more credits!");
        setShowGuestModal(true);
        enqueueSnackbar('Register to continue generating tasks!', {
          variant: 'warning',
          autoHideDuration: 5000,
        });
      } else {
        setGenerationError(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
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
    console.log('[Task Generator] Saving edited task:', editedTask);
    setGeneratedTask(editedTask);
    // Save edited task to localStorage (persists until published)
    lastUnpublishedTask.saveTask(editedTask);
  };

  const handleCloseResult = () => {
    setGeneratedTask(null);
    setGenerationError(null);
  };

  const handleSaveTaskToDatabase = async () => {
    if (!generatedTask) {
      console.error('[Task Generator] Cannot save task: missing task');
      return;
    }

    // For guests, show modal instead of saving
    if (isGuest) {
      setModalMessage('Register (FREE) to save this task and get 100 free generation credits!');
      setShowGuestModal(true);
      enqueueSnackbar('Register to save your task!', {
        variant: 'info',
        autoHideDuration: 5000,
      });
      return;
    }

    const token = user.profile?.token;
    if (!token) {
      console.error('[Task Generator] Cannot save task: missing token');
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
        country_code: user.country || 'HU',
      };

      const response = await saveTask(saveRequest, token);

      // Clear the unpublished task from localStorage
      lastUnpublishedTask.clearTask();

      // Clear the generated task from view
      setGeneratedTask(null);

      // Show success message instead of modal
      enqueueSnackbar(
        `Task "${generatedTask.id}" successfully saved and published! You can find it under "My Tasks".`,
        {
          variant: 'success',
          autoHideDuration: 7000,
        }
      );

      console.log('[Task Generator] Task saved successfully:', response);
    } catch (error) {
      console.error('[Task Generator] Failed to save task:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to save task');
      enqueueSnackbar('Failed to save task. Please try again.', {
        variant: 'error',
        autoHideDuration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGuestPrompt = (action: 'save' | 'download') => {
    if (action === 'save') {
      setModalMessage('Register (FREE) to save this task and get 100 free generation credits!');
    } else {
      setModalMessage('Register (FREE) to download this task and get 100 free generation credits!');
    }
    setShowGuestModal(true);
    enqueueSnackbar(`Register to ${action} your task!`, {
      variant: 'info',
      autoHideDuration: 5000,
    });
  };

  const handleCloseSavedModal = () => {
    setShowSavedModal(false);
  };

  const handleRegistrationComplete = () => {
    console.log('[Task Generator] Registration completed, clearing guest session');

    // Check if there's a task to restore
    const hasTaskToRestore = guestSession.getLastTask() !== null;

    guestSession.clearGuestSession();

    // Show appropriate message
    if (hasTaskToRestore) {
      enqueueSnackbar('Registration successful! Your task is ready to save. Refreshing...', {
        variant: 'success',
        autoHideDuration: 3000,
      });
    } else {
      enqueueSnackbar('Welcome! You now have 100 free task generation credits.', {
        variant: 'success',
        autoHideDuration: 5000,
      });
    }

    // Refresh the page to reload with authenticated user
    // The task will be automatically restored by the useEffect
    setTimeout(() => {
      router.refresh();
    }, 1000);
  };

  const gradeLevel: GradeLevel = selectedGrade;
  const currentData = navigationData ? navigationData[gradeLevel] : [];

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
            Curriculum data is not yet available. Please try again later.
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
            {t('Task Generator')}
          </Typography>
          <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
            {t('Select a curriculum topic to create an educational task')}
          </Typography>
        </Box>

        {/* Ongoing Task Banner - for registered users with unpublished task */}
        {!isGuest && lastUnpublishedTask.hasTask && generatedTask && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body1" component="div">
              <strong>📋 You have an ongoing task</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Your last generated task is loaded below. You can continue editing or save it to your library.
            </Typography>
          </Alert>
        )}

        {/* Subject and Grade Selectors */}
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="subject-select-label">{t('Subject')}</InputLabel>
                <Select
                  labelId="subject-select-label"
                  id="subject-select"
                  value={selectedSubject}
                  label={t('Subject')}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                >
                  {SUBJECT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.label as any)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="grade-select-label">{t('Grade Level')}</InputLabel>
                <Select
                  labelId="grade-select-label"
                  id="grade-select"
                  value={selectedGrade}
                  label={t('Grade Level')}
                  onChange={(e) => handleGradeChange(e.target.value as GradeLevel)}
                >
                  {GRADE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {t(option.label as any)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Cascading Topic Selector */}
        <CascadingSelect
          data={currentData}
          title={t('Select Topic')}
          onSelectionComplete={handleSelectionComplete}
          onSelectionChange={handleSelectionChange}
          initialPath={initialPath}
        />

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
            isGuestMode={isGuest}
            onGuestPrompt={handleGuestPrompt}
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

        {/* Guest Prompt Modal */}
        <GuestPromptModal
          open={showGuestModal}
          onClose={() => setShowGuestModal(false)}
          promptMessage={modalMessage}
          onRegistrationComplete={handleRegistrationComplete}
          initialMode="register"
        />
      </Container>
    </div>
  );
}

export default function TaskGeneratorPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." fullScreen />}>
      <TaskGeneratorContent />
    </Suspense>
  );
}
