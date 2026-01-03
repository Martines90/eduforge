'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Chip,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Button } from '@/components/atoms/Button';
import { useTranslation } from '@/lib/i18n';

/**
 * Test Library Page
 * Browse and search published tests from the community
 */
export default function TestLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Placeholder - in a real implementation, this would fetch from backend
  const publishedTests: Array<{
    id: string;
    name: string;
    subject: string;
    gradeLevel?: string;
    taskCount: number;
    totalScore?: number;
    viewCount: number;
    publishedAt: string;
    pdfUrl?: string;
  }> = [];

  const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography'];

  const filteredTests = publishedTests.filter((test) => {
    const matchesSearch = searchQuery
      ? test.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesSubject = selectedSubject ? test.subject === selectedSubject : true;
    return matchesSearch && matchesSubject;
  });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('Test Library')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('Browse and discover published tests from the community')}
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder={t('Search tests...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={t('All Subjects')}
              onClick={() => setSelectedSubject(null)}
              color={selectedSubject === null ? 'primary' : 'default'}
              variant={selectedSubject === null ? 'filled' : 'outlined'}
            />
            {subjects.map((subject) => (
              <Chip
                key={subject}
                label={subject.charAt(0).toUpperCase() + subject.slice(1)}
                onClick={() => setSelectedSubject(subject)}
                color={selectedSubject === subject ? 'primary' : 'default'}
                variant={selectedSubject === subject ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {/* Results */}
        {filteredTests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {publishedTests.length === 0
                ? t('No published tests yet')
                : t('No tests match your search')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {publishedTests.length === 0
                ? t('Be the first to publish a test!')
                : t('Try adjusting your search or filters')}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredTests.map((test) => (
              <Grid item xs={12} sm={6} md={4} key={test.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap title={test.name}>
                      {test.name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={test.subject.charAt(0).toUpperCase() + test.subject.slice(1)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {test.gradeLevel && (
                        <Chip
                          label={test.gradeLevel.replace('grade_', 'Grade ').replace('_', '-')}
                          size="small"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {test.taskCount} {t('tasks')}
                      </Typography>
                      {test.totalScore && (
                        <Typography variant="body2" color="text.secondary">
                          {test.totalScore} {t('points')}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {test.viewCount} {t('views')}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="primary"
                      fullWidth
                      startIcon={<VisibilityIcon />}
                      onClick={() => router.push(`/published-tests/${test.id}`)}
                    >
                      {t('View Test')}
                    </Button>
                    {test.pdfUrl && (
                      <Button
                        variant="secondary"
                        fullWidth
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => window.open(test.pdfUrl, '_blank')}
                      >
                        {t('PDF')}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Info Alert */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>{t('Note:')}</strong>{' '}
            {t(
              'The test library feature is currently in development. Published tests will appear here once the backend API for browsing tests is implemented.'
            )}
          </Typography>
        </Alert>

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={() => router.push('/')}>
            {t('Back to Home')}
          </Button>
          <Button variant="primary" onClick={() => router.push('/my-tests')}>
            {t('My Tests')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
