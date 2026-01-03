'use client';

import { useState, useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { Button } from '@/components/atoms/Button';
import { Pagination } from '@/components/molecules/Pagination';
import { useTranslation } from '@/lib/i18n';
import { fetchPublishedTests } from '@/lib/services/test.service';
import type { PublishedTest } from '@/types/test.types';

/**
 * Test Library Page
 * Browse and search published tests from the community
 */
export default function TestLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'downloads'>('recent');

  // Data state
  const [tests, setTests] = useState<PublishedTest[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 items for grid layout (4 columns x 3 rows)

  const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'history', 'geography'];

  // Get user's country from localStorage (for filtering tests by country)
  const getUserCountry = (): string => {
    if (typeof window === 'undefined') return 'US';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.country || 'US';
      }
    } catch (error) {
      console.error('Error getting user country:', error);
    }
    return 'US';
  };

  // Fetch tests from API
  const loadTests = async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const country = getUserCountry();

      console.log('[TestLibrary] Fetching tests:', {
        country,
        subject: selectedSubject,
        search: searchQuery,
        sort: sortBy,
        limit: itemsPerPage,
        offset,
      });

      const response = await fetchPublishedTests({
        country,
        subject: selectedSubject || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
        limit: itemsPerPage,
        offset,
      });

      console.log('[TestLibrary] Received tests:', response);

      setTests(response.tests);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('[TestLibrary] Error loading tests:', err);
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  // Load tests when filters or page changes
  useEffect(() => {
    loadTests();
  }, [currentPage, selectedSubject, searchQuery, sortBy]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSubjectChange = (subject: string | null) => {
    setSelectedSubject(subject);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: 'recent' | 'views' | 'downloads') => {
    setSortBy(sort);
    setCurrentPage(1);
  };

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
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={t('All Subjects')}
              onClick={() => handleSubjectChange(null)}
              color={selectedSubject === null ? 'primary' : 'default'}
              variant={selectedSubject === null ? 'filled' : 'outlined'}
              disabled={loading}
            />
            {subjects.map((subject) => (
              <Chip
                key={subject}
                label={subject.charAt(0).toUpperCase() + subject.slice(1)}
                onClick={() => handleSubjectChange(subject)}
                color={selectedSubject === subject ? 'primary' : 'default'}
                variant={selectedSubject === subject ? 'filled' : 'outlined'}
                disabled={loading}
              />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
              {t('Sort by:')}
            </Typography>
            <Chip
              label={t('Recent')}
              onClick={() => handleSortChange('recent')}
              color={sortBy === 'recent' ? 'primary' : 'default'}
              variant={sortBy === 'recent' ? 'filled' : 'outlined'}
              size="small"
              disabled={loading}
            />
            <Chip
              label={t('Most Viewed')}
              onClick={() => handleSortChange('views')}
              color={sortBy === 'views' ? 'primary' : 'default'}
              variant={sortBy === 'views' ? 'filled' : 'outlined'}
              size="small"
              disabled={loading}
            />
            <Chip
              label={t('Most Downloaded')}
              onClick={() => handleSortChange('downloads')}
              color={sortBy === 'downloads' ? 'primary' : 'default'}
              variant={sortBy === 'downloads' ? 'filled' : 'outlined'}
              size="small"
              disabled={loading}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t('Loading tests...')}
            </Typography>
          </Box>
        ) : tests.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('No published tests yet')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || selectedSubject
                ? t('Try adjusting your search or filters')
                : t('Be the first to publish a test!')}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {tests.map((test) => (
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

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </>
        )}

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
