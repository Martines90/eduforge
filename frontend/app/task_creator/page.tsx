'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Typography, Box, Paper, Alert, Tabs, Tab } from '@mui/material';
import { CascadingSelect } from '@/components/organisms/CascadingSelect';
import { Button } from '@/components/atoms/Button';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner/LoadingSpinner';
import { NavigationTopic, GradeLevel } from '@/types/navigation';
import { useTranslation } from '@/lib/i18n';
import { useRouteProtection } from '@/lib/hooks/useRouteProtection';
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
  const { isAuthorized, isLoading } = useRouteProtection({
    requireAuth: true,
    requireIdentity: 'teacher',
  });
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<NavigationTopic | null>(null);
  const [selectionPath, setSelectionPath] = useState<string[]>([]);
  const [initialPath, setInitialPath] = useState<string[] | undefined>(undefined);
  const [urlParamsApplied, setUrlParamsApplied] = useState(false);

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

  const handleSelectionComplete = (topic: NavigationTopic, path: string[], config: any) => {
    setSelectedTopic(topic);
    setSelectionPath(path);
    console.log('Selection complete:', { topic, path, config });
  };

  const handleCreateTask = () => {
    if (selectedTopic) {
      alert(`Task creation initiated for: ${selectedTopic.name}\nPath: ${selectionPath.join(' > ')}`);
      // Here you would typically send this data to your backend
    }
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

        {selectedTopic && (
          <Box className={styles.resultSection}>
            <Alert severity="success" className={styles.alert}>
              <Typography variant="h6" component="h2" gutterBottom>
                {t('Selected Topic')}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>{t('Topic')}:</strong> {selectedTopic.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>{t('Path')}:</strong> {selectionPath.join(' > ')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('Grade Level')}:</strong> {gradeLevel === 'grade_9_10' ? t('Grade 9-10') : t('Grade 11-12')}
              </Typography>
            </Alert>

            <Box className={styles.actionButtons}>
              <Button
                variant="primary"
                size="large"
                onClick={handleCreateTask}
                className={styles.createButton}
              >
                {t('Create Task')}
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => {
                  setSelectedTopic(null);
                  setSelectionPath([]);
                }}
              >
                {t('Clear Selection')}
              </Button>
            </Box>
          </Box>
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
