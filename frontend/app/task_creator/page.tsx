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
import { fetchSubjectTree } from '@/lib/services/subject-mapping.service';
import { fetchTaskById } from '@/lib/services/api.service';
import { GradeLevel, GradeConfig, Subject, DEFAULT_NUMBER_OF_IMAGES } from '@eduforger/shared';
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
  const { user, authInitialized } = useUser();
  const { token: firebaseToken } = useFirebaseToken();
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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
  const [navigationData, setNavigationData] = useState<NavigationTopic[]>([]);
  const [isLoadingNavigation, setIsLoadingNavigation] = useState(true);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [availableGrades, setAvailableGrades] = useState<GradeConfig[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastLoadedTaskId, setLastLoadedTaskId] = useState<string | null>(null);
  const [isRestoringFromTask, setIsRestoringFromTask] = useState(false);

  // Fetch navigation data from API based on user's country
  // Only fetch once when user is fully loaded and isAuthorized
  useEffect(() => {
    const loadNavigationData = async () => {
      console.log('[Task Creator] User object:', user);
      console.log('[Task Creator] User country:', user.country);
      console.log('[Task Creator] User teacherRole:', user.teacherRole);
      console.log('[Task Creator] isAuthorized:', isAuthorized);

      // Wait for auth to initialize - prevents flashing guest content before teacher role loads
      if (!authInitialized) {
        console.log('[Task Creator] Waiting for auth to initialize...');
        return;
      }

      // Wait for authorization check to complete
      if (isLoading) {
        console.log('[Task Creator] Waiting for authorization check...');
        return;
      }

      if (!isAuthorized) {
        console.log('[Task Creator] User not authorized, skipping data fetch');
        return;
      }

      // Skip reloading if we're in the middle of restoring from a task
      // The task loading effect will handle navigation data loading
      if (isRestoringFromTask) {
        console.log('[Task Creator] Skipping navigation reload - restoring from task');
        // Ensure loading state is false since restoration handles its own loading
        if (isLoadingNavigation) {
          setIsLoadingNavigation(false);
        }
        return;
      }

      // If we're in edit mode but haven't loaded the task yet, wait for task loading
      // to complete before loading navigation data (task restoration will handle it)
      if (editMode && !generatedTask && !lastLoadedTaskId) {
        console.log('[Task Creator] Waiting for task to load in edit mode');
        return;
      }

      if (!user.country) {
        console.log('[Task Creator] Waiting for user country...');
        return;
      }

      // For registered teachers, check if they have subjects
      if (user.role === 'registered' && (!user.subjects || user.subjects.length === 0)) {
        console.log('[Task Creator] Waiting for user subject...');
        return;
      }

      // Set default selected subject if not already set
      if (!selectedSubject) {
        // For registered teachers, use their first subject
        if (user.role === 'registered' && user.subjects && user.subjects.length > 0) {
          setSelectedSubject(user.subjects[0]);
        } else {
          // For guests, default to mathematics
          setSelectedSubject('mathematics');
        }
      }

      // Determine current subject to fetch data for
      const currentSubject = selectedSubject || (user.role === 'registered' && user.subjects && user.subjects.length > 0 ? user.subjects[0] : 'mathematics');
      if (!currentSubject) {
        console.log('[Task Creator] No subject selected yet');
        return;
      }

      setIsLoadingNavigation(true);
      setNavigationError(null);

      try {
        console.log('[Task Creator] Fetching navigation data for country:', user.country, 'subject:', currentSubject);

        // Import gradeSystem helpers
        const { getGradesForCountry } = await import('@eduforger/shared');
        const allGrades = getGradesForCountry(user.country as any);

        // Filter grades based on teacher's teacherRole - only show their assigned grade level
        let grades: GradeConfig[];
        if (user.teacherRole) {
          const teacherGrade = allGrades.find(g => g.value === user.teacherRole);
          if (teacherGrade) {
            console.log('[Task Creator] Restricting to teacher\'s grade level:', user.teacherRole);
            grades = [teacherGrade]; // Only allow the teacher's assigned grade
          } else {
            console.warn('[Task Creator] Teacher role not found in available grades, showing all grades');
            grades = allGrades;
          }
        } else {
          console.log('[Task Creator] No teacherRole set, showing all grades');
          grades = allGrades;
        }

        setAvailableGrades(grades);

        // Reset selectedGrade to 0 if current index is out of bounds
        // This happens when restoration set a higher index but teacher only has 1 grade
        if (selectedGrade >= grades.length) {
          console.log('[Task Creator] Resetting selectedGrade from', selectedGrade, 'to 0 (out of bounds)');
          setSelectedGrade(0);
        }

        // Get the current grade level to fetch
        const currentGradeLevel = grades[selectedGrade]?.value;
        if (!currentGradeLevel) {
          console.warn('[Task Creator] No grade level found at index:', selectedGrade);
          setNavigationData([]);
          return;
        }

        console.log('[Task Creator] Fetching tree for grade level:', currentGradeLevel);
        const data = await fetchSubjectTree(user.country, currentSubject, currentGradeLevel);
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
    // Note: isRestoringFromTask is intentionally NOT in the dependency array
    // It's only used as a guard flag, not as a trigger
  }, [authInitialized, user.country, user.subjects, isAuthorized, isLoading, user.teacherRole, selectedSubject, selectedGrade, editMode, generatedTask, lastLoadedTaskId]);

  // Detect edit mode from URL parameter
  useEffect(() => {
    const editTaskId = searchParams.get('edit');
    if (editTaskId) {
      setEditMode(true);
      setEditingTaskId(editTaskId);
      console.log('[Task Creator] Edit mode enabled for task:', editTaskId);
    } else {
      setEditMode(false);
      setEditingTaskId(null);
      setLastLoadedTaskId(null); // Reset when exiting edit mode
    }
  }, [searchParams]);

  // Load existing task when in edit mode
  useEffect(() => {
    const loadTask = async () => {
      if (!editMode || !editingTaskId || !firebaseToken) return;

      // Skip if we've already loaded this task
      if (lastLoadedTaskId === editingTaskId) {
        console.log('[Task Creator] Task already loaded, skipping');
        return;
      }

      setIsLoadingTask(true);
      try {
        console.log('[Task Creator] Loading task for editing:', editingTaskId);
        const response = await fetchTaskById(editingTaskId);

        if (response.success && response.data) {
          const taskData = response.data;
          console.log('[Task Creator] Task loaded successfully:', taskData);

          // Extract description and solution from content object (new format)
          // with fallback to top-level fields (legacy format)
          const description = taskData.content?.description || taskData.description;
          const solution = taskData.content?.solution || taskData.solution;
          const rawImages = taskData.content?.images || taskData.images || [];

          // Normalize images to TaskImage[] format { id, url }
          // Backend stores images as string[] of URLs, need to convert to { id, url }[]
          const images = rawImages.map((img: any, index: number) => {
            if (typeof img === 'string') {
              // Convert string URL to TaskImage object
              return { id: `${index + 1}`, url: img };
            } else if (img && typeof img === 'object' && img.url) {
              // Already in correct format
              return img;
            } else {
              // Invalid format, create placeholder
              console.warn('[Task Creator] Invalid image format:', img);
              return { id: `${index + 1}`, url: '' };
            }
          });

          console.log('[Task Creator] Extracted task content:', {
            hasDescription: !!description,
            hasSolution: !!solution,
            imageCount: images.length,
            imageFormat: images.length > 0 ? 'TaskImage[]' : 'none',
            firstImage: images[0] || null,
          });

          // Set the generated task with the loaded data
          const loadedTask: GeneratedTask = {
            id: taskData.id,
            description,
            solution,
            images,
          };

          setGeneratedTask(loadedTask);
          setCurrentCurriculumPath(taskData.curriculum_path || '');
          setHasUnsavedChanges(false);
          setLastLoadedTaskId(editingTaskId);

          // Parse curriculum path to restore UI state
          // Format: "{country}:{subject}:{grade}:{topic_keys...}"
          // Example: "MX:literature:grade_10_12:cronica_y_textos_periodisticos_literarios:..."
          if (taskData.curriculum_path) {
            const pathParts = taskData.curriculum_path.split(':');

            if (pathParts.length >= 3) {
              // Set flag to prevent navigation data reload during restoration
              setIsRestoringFromTask(true);

              // Extract country (first part) - skip it, we use user.country
              const _countryCode = pathParts[0];

              // Extract subject (second part)
              const subject = pathParts[1] as Subject;
              console.log('[Task Creator] Restoring subject:', subject);

              // Extract grade level (third part)
              const gradeLevel = pathParts[2] as GradeLevel;
              console.log('[Task Creator] Restoring grade level:', gradeLevel);

              // Load the correct navigation data for this task's subject/grade
              // even if it's different from the user's current selection
              const { getGradesForCountry } = await import('@eduforger/shared');
              const allGrades = getGradesForCountry(user.country as any);

              // Find the grade index
              const gradeIndex = allGrades.findIndex(g => g.value === gradeLevel);

              if (gradeIndex >= 0) {
                console.log('[Task Creator] Found grade level at index:', gradeIndex);

                // Update availableGrades if needed to include this grade
                if (!availableGrades.find(g => g.value === gradeLevel)) {
                  console.log('[Task Creator] Adding grade to availableGrades:', gradeLevel);
                  setAvailableGrades(allGrades);
                }

                // Set the subject and grade
                setSelectedSubject(subject);
                setSelectedGrade(gradeIndex);

                // Fetch navigation data for this specific subject/grade combination
                try {
                  console.log('[Task Creator] Fetching navigation for task:', { subject, gradeLevel });
                  const data = await fetchSubjectTree(user.country, subject, gradeLevel);
                  setNavigationData(data);
                  console.log('[Task Creator] Navigation data loaded for task');
                } catch (navError) {
                  console.error('[Task Creator] Failed to load navigation for task:', navError);
                }
              } else {
                console.warn('[Task Creator] Grade level not found:', gradeLevel);
              }

              // Extract topic path (remaining parts after country, subject, grade)
              if (pathParts.length > 3) {
                const topicPath = pathParts.slice(3);
                console.log('[Task Creator] Restoring topic path:', topicPath);
                setInitialPath(topicPath);
              }

              // Clear the flag immediately - no need to wait
              // We've already set all the state we need
              setIsRestoringFromTask(false);
              console.log('[Task Creator] Restoration complete, flag cleared');
            }
          }
        }
      } catch (error) {
        console.error('[Task Creator] Failed to load task:', error);
        setGenerationError(error instanceof Error ? error.message : 'Failed to load task');
      } finally {
        setIsLoadingTask(false);
      }
    };

    loadTask();
  }, [editMode, editingTaskId, firebaseToken, availableGrades, lastLoadedTaskId]);

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

  const handleSubjectChange = (newSubject: Subject) => {
    setSelectedSubject(newSubject);
    setSelectedTopic(null);
    setSelectionPath([]);
    setInitialPath(undefined); // Clear initial path when manually changing subject
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

    // Remove edit query param when generating a new task
    if (editMode) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('edit');
      router.replace(`/task_creator?${params.toString()}`, { scroll: false });
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedTask(null);
    setGenerationStep(null);
    setHasUnsavedChanges(false);

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
      // Format: {country}:{subject}:{grade}:{topic_keys...}
      // Use currently selected subject to match the subjectMappings collection format
      const currentSubject = selectedSubject || (user.role === 'registered' && user.subjects && user.subjects[0]) || 'mathematics';
      const curriculumPath = `${user.country}:${currentSubject}:${currentGradeConfig.value}:${path.join(':')}`;
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
        description: formatTaskDescription(result.taskText),
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
  const formatTaskDescription = (taskText: any): string => {
    let html = '';
    if (taskText.title) html += `<h1>${taskText.title}</h1>\n`;
    if (taskText.story_text) {
      // Add image placeholders as first child inside the story div
      let storyContent = '';
      if (DEFAULT_NUMBER_OF_IMAGES > 0) {
        for (let i = 1; i <= DEFAULT_NUMBER_OF_IMAGES; i++) {
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
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(false);

      // Add edit query param after saving
      if (!editMode) {
        const params = new URLSearchParams(searchParams.toString());
        params.set('edit', response.task_id);
        router.replace(`/task_creator?${params.toString()}`, { scroll: false });
      }

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

  // Show loading state while auth initializes - prevents flash of wrong content
  if (!authInitialized) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // Show loading state while checking authorization
  if (isLoading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  // If not authorized, the hook will redirect - show loading
  if (!isAuthorized) {
    return <LoadingSpinner message="Redirecting..." fullScreen />;
  }

  // Show loading state while fetching navigation data OR loading task in edit mode
  if (isLoadingNavigation || isLoadingTask) {
    return <LoadingSpinner message={isLoadingTask ? "Loading task..." : "Loading curriculum data..."} fullScreen />;
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

  // Show error if navigation data is empty (but only if we're not in edit mode with a loaded task)
  // In edit mode, navigation data will be loaded after the task loads
  if ((!navigationData || navigationData.length === 0) && !(editMode && generatedTask)) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>No curriculum data available</Typography>
          <Typography variant="body2">
            Curriculum data for {user.country} / {selectedSubject} / {currentGradeConfig?.labelEN} is not yet available. Please contact support.
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

        {/* Only show grade selector tabs if teacher doesn't have a specific teacherRole or if there are multiple grades */}
        {!user.teacherRole && availableGrades.length > 1 && (
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
        )}

        {availableGrades.map((grade, index) => (
          <TabPanel key={grade.value} value={selectedGrade} index={index}>
            <CascadingSelect
              data={selectedGrade === index ? navigationData : []}
              title={`${t('Select Topic')} (${grade.labelEN})`}
              onSelectionComplete={handleSelectionComplete}
              initialPath={selectedGrade === index ? initialPath : undefined}
              selectedSubject={selectedSubject}
              onSubjectChange={handleSubjectChange}
              availableSubjects={user.role === 'registered' ? user.subjects : undefined}
            />
          </TabPanel>
        ))}

        {/* Task Generation Result */}
        {(isGenerating || generatedTask || generationError || isLoadingTask) && (
          <TaskResult
            task={generatedTask}
            loading={isGenerating || isLoadingTask}
            loadingMessage={isLoadingTask ? 'Loading task...' : (generationStep?.message ? t(generationStep.message as any) : undefined)}
            loadingProgress={generationStep?.progress}
            error={generationError || undefined}
            onClose={handleCloseResult}
            onSave={handleSaveTask}
            onSaveToDatabase={handleSaveTaskToDatabase}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            onViewTaskInfo={() => setShowSavedModal(true)}
            savedTaskInfo={savedTaskInfo}
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
