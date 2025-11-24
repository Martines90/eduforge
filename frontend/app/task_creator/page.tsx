'use client';

import { useState } from 'react';
import { Container, Typography, Box, Paper, Alert, Tabs, Tab } from '@mui/material';
import { CascadingSelect } from '@/components/organisms/CascadingSelect';
import { Button } from '@/components/atoms/Button';
import { NavigationTopic, GradeLevel } from '@/types/navigation';
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

export default function TaskCreatorPage() {
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedTopic, setSelectedTopic] = useState<NavigationTopic | null>(null);
  const [selectionPath, setSelectionPath] = useState<string[]>([]);

  const handleGradeChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedGrade(newValue);
    setSelectedTopic(null);
    setSelectionPath([]);
  };

  const handleSelectionComplete = (topic: NavigationTopic, path: string[]) => {
    setSelectedTopic(topic);
    setSelectionPath(path);
    console.log('Selection complete:', { topic, path });
  };

  const handleCreateTask = () => {
    if (selectedTopic) {
      alert(`Task creation initiated for: ${selectedTopic.name}\nPath: ${selectionPath.join(' > ')}`);
      // Here you would typically send this data to your backend
    }
  };

  const gradeLevel: GradeLevel = selectedGrade === 0 ? 'grade_9_10' : 'grade_11_12';
  const currentData = navigationData[gradeLevel];

  return (
    <div className={styles.pageContainer}>
      <Container maxWidth="lg" className={styles.container}>
        <Box className={styles.header}>
          <Typography variant="h3" component="h1" className={styles.title}>
            Task Creator
          </Typography>
          <Typography variant="body1" color="text.secondary" className={styles.subtitle}>
            Select a curriculum topic to create an educational task
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
            <Tab label="Grade 9-10" id="grade-tab-0" aria-controls="grade-tabpanel-0" />
            <Tab label="Grade 11-12" id="grade-tab-1" aria-controls="grade-tabpanel-1" />
          </Tabs>
        </Paper>

        <TabPanel value={selectedGrade} index={0}>
          <CascadingSelect
            data={currentData}
            title="Select Topic (Grade 9-10)"
            onSelectionComplete={handleSelectionComplete}
          />
        </TabPanel>

        <TabPanel value={selectedGrade} index={1}>
          <CascadingSelect
            data={currentData}
            title="Select Topic (Grade 11-12)"
            onSelectionComplete={handleSelectionComplete}
          />
        </TabPanel>

        {selectedTopic && (
          <Box className={styles.resultSection}>
            <Alert severity="success" className={styles.alert}>
              <Typography variant="h6" component="h2" gutterBottom>
                Selected Topic
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Topic:</strong> {selectedTopic.name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Path:</strong> {selectionPath.join(' > ')}
              </Typography>
              <Typography variant="body2">
                <strong>Grade Level:</strong> {gradeLevel === 'grade_9_10' ? '9-10' : '11-12'}
              </Typography>
            </Alert>

            <Box className={styles.actionButtons}>
              <Button
                variant="primary"
                size="large"
                onClick={handleCreateTask}
                className={styles.createButton}
              >
                Create Task
              </Button>
              <Button
                variant="secondary"
                size="large"
                onClick={() => {
                  setSelectedTopic(null);
                  setSelectionPath([]);
                }}
              >
                Clear Selection
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </div>
  );
}
