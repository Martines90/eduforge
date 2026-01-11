/**
 * Unit tests for Test Library Page
 * Tests pagination, filtering, and API integration
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestLibraryPage from '../page';
import { fetchPublishedTests } from '@/lib/services/test.service';
import type { PublishedTest } from '@/types/test.types';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      if (params && key.includes('{{count}}')) {
        return key.replace('{{count}}', String(params.count));
      }
      return key;
    },
  }),
}));

vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    gradeSystem: 'grade_9_12',
    user: null,
    loading: false,
  }),
}));

vi.mock('@/lib/services/test.service', () => ({
  fetchPublishedTests: vi.fn(),
}));

const mockFetchPublishedTests = fetchPublishedTests as vi.MockedFunction<typeof fetchPublishedTests>;

describe('TestLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key) => {
          if (key === 'user') {
            return JSON.stringify({ country: 'HU' });
          }
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    // Mock window.scrollTo
    window.scrollTo = vi.fn();
  });

  const createMockTests = (count: number): PublishedTest[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `test${i + 1}`,
      name: `Test ${i + 1}`,
      description: `Description ${i + 1}`,
      subject: i % 2 === 0 ? 'mathematics' : 'physics',
      gradeLevel: 'grade_9_10',
      taskCount: 5,
      totalScore: 100,
      publishedAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}`),
      viewCount: i * 10,
      downloadCount: i * 5,
      creatorId: 'user123',
      creatorName: 'John Doe',
      isPublished: true,
      sourceTestId: `source${i + 1}`,
      pdfUrl: `https://example.com/test${i + 1}.pdf`,
    }));
  };

  describe('Initial Load', () => {
    it('should render loading state initially', () => {
      mockFetchPublishedTests.mockImplementation(() => new Promise(() => {}));

      render(<TestLibraryPage />);

      expect(screen.getByText('Loading tests...')).toBeInTheDocument();
    });

    it('should fetch tests on mount', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 0,
        });
      });
    });

    it('should display tests after loading', async () => {
      const mockTests = createMockTests(3);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 3,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
        expect(screen.getByText('Test 2')).toBeInTheDocument();
        expect(screen.getByText('Test 3')).toBeInTheDocument();
      });
    });

    it('should show empty state when no tests', async () => {
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: [],
        total: 0,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('No published tests yet')).toBeInTheDocument();
      });
    });

    it('should display error when fetch fails', async () => {
      mockFetchPublishedTests.mockRejectedValue(new Error('Network error'));

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination when more than 12 tests', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 25,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Showing 1 to 12 of 25 items')).toBeInTheDocument();
      });
    });

    it('should not display pagination when 12 or fewer tests', async () => {
      const mockTests = createMockTests(10);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 10,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
      });
    });

    it('should fetch next page when clicking next button', async () => {
      const page1Tests = createMockTests(12);
      const page2Tests = createMockTests(12).map((t, i) => ({
        ...t,
        id: `test${i + 13}`,
        name: `Test ${i + 13}`,
      }));

      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: page1Tests,
          total: 25,
          page: 1,
          limit: 12,
          hasMore: true,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: page2Tests,
          total: 25,
          page: 2,
          limit: 12,
          hasMore: true,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 12,
        });
      });
    });

    it('should scroll to top when changing page', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 25,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
      });
    });

    it('should calculate correct offset for page 3', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 50,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      // Click on page 3
      const page3Button = screen.getByText('3');
      fireEvent.click(page3Button);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 24, // (3 - 1) * 12
        });
      });
    });

    it('should disable Previous button on first page', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 25,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).toBeDisabled();
      });
    });

    it('should enable Previous button on second page', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 25,
          page: 1,
          limit: 12,
          hasMore: true,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 25,
          page: 2,
          limit: 12,
          hasMore: true,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        const prevButton = screen.getByText('Previous');
        expect(prevButton).not.toBeDisabled();
      });
    });
  });

  describe('Subject Filtering', () => {
    it('should filter by subject when clicking subject chip', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests.filter((t) => t.subject === 'mathematics'),
          total: 3,
          page: 1,
          limit: 12,
          hasMore: false,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      const mathChip = screen.getByText('Mathematics');
      fireEvent.click(mathChip);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: 'mathematics',
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 0,
        });
      });
    });

    it('should reset to page 1 when changing subject filter', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 25,
          page: 1,
          limit: 12,
          hasMore: true,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 25,
          page: 2,
          limit: 12,
          hasMore: true,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests.filter((t) => t.subject === 'physics'),
          total: 10,
          page: 1,
          limit: 12,
          hasMore: false,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Go to page 2
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 12 })
        );
      });

      // Filter by physics
      fireEvent.click(screen.getByText('Physics'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: 'physics',
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 0, // Reset to first page
        });
      });
    });

    it('should clear subject filter when clicking All Subjects', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests.filter((t) => t.subject === 'mathematics'),
          total: 3,
          page: 1,
          limit: 12,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      // Filter by math
      fireEvent.click(screen.getByText('Mathematics'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ subject: 'mathematics' })
        );
      });

      // Clear filter
      fireEvent.click(screen.getByText('All Subjects'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'recent',
          limit: 12,
          offset: 0,
        });
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search tests when typing in search box', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: [mockTests[0]],
          total: 1,
          page: 1,
          limit: 12,
          hasMore: false,
        });

      const user = userEvent.setup();
      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tests...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search tests...');
      await user.type(searchInput, 'algebra');

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: 'algebra',
          sort: 'recent',
          limit: 12,
          offset: 0,
        });
      });
    });

    it('should reset to page 1 when searching', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 25,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      const user = userEvent.setup();
      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Go to page 2
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 12 })
        );
      });

      // Search
      const searchInput = screen.getByPlaceholderText('Search tests...');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 0 })
        );
      });
    });

    it('should disable search input while loading', async () => {
      mockFetchPublishedTests.mockImplementation(() => new Promise(() => {}));

      render(<TestLibraryPage />);

      const searchInput = screen.getByPlaceholderText('Search tests...');
      expect(searchInput).toBeDisabled();
    });
  });

  describe('Sort Functionality', () => {
    it('should sort by views when clicking Most Viewed', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests,
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        })
        .mockResolvedValueOnce({
          success: true,
          tests: mockTests.reverse(),
          total: 5,
          page: 1,
          limit: 12,
          hasMore: false,
        });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Most Viewed'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'views',
          limit: 12,
          offset: 0,
        });
      });
    });

    it('should sort by downloads when clicking Most Downloaded', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Most Downloaded'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: undefined,
          search: undefined,
          sort: 'downloads',
          limit: 12,
          offset: 0,
        });
      });
    });

    it('should reset to page 1 when changing sort', async () => {
      const mockTests = createMockTests(12);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 25,
        page: 1,
        limit: 12,
        hasMore: true,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      // Go to page 2
      fireEvent.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 12 })
        );
      });

      // Change sort
      fireEvent.click(screen.getByText('Most Viewed'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ offset: 0, sort: 'views' })
        );
      });
    });
  });

  describe('Combined Filters', () => {
    it('should combine subject, search, and sort', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      const user = userEvent.setup();
      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByText('Test 1')).toBeInTheDocument();
      });

      // Filter by subject
      fireEvent.click(screen.getByText('Physics'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ subject: 'physics' })
        );
      });

      // Search
      const searchInput = screen.getByPlaceholderText('Search tests...');
      await user.type(searchInput, 'mechanics');

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ subject: 'physics', search: 'mechanics' })
        );
      });

      // Sort
      fireEvent.click(screen.getByText('Most Viewed'));

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith({
          country: 'HU',
          subject: 'physics',
          search: 'mechanics',
          sort: 'views',
          limit: 12,
          offset: 0,
        });
      });
    });
  });

  describe('Country Detection', () => {
    it('should use country from localStorage', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ country: 'HU' })
        );
      });
    });

    it('should default to US when no user in localStorage', async () => {
      (window.localStorage.getItem as unknown as vi.Mock).mockReturnValue(null);

      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(mockFetchPublishedTests).toHaveBeenCalledWith(
          expect.objectContaining({ country: 'US' })
        );
      });
    });
  });

  describe('UI State Management', () => {
    it('should disable all filters while loading', async () => {
      mockFetchPublishedTests.mockImplementation(() => new Promise(() => {}));

      render(<TestLibraryPage />);

      const searchInput = screen.getByPlaceholderText('Search tests...');
      const allSubjectsChip = screen.getByText('All Subjects');
      const recentChip = screen.getByText('Recent');

      expect(searchInput).toBeDisabled();
      expect(allSubjectsChip).toHaveClass('Mui-disabled');
      expect(recentChip).toHaveClass('Mui-disabled');
    });

    it('should enable all filters after loading', async () => {
      const mockTests = createMockTests(5);
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: mockTests,
        total: 5,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      render(<TestLibraryPage />);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('Search tests...');
        expect(searchInput).not.toBeDisabled();
      });
    });

    it('should show correct empty state message for search', async () => {
      mockFetchPublishedTests.mockResolvedValue({
        success: true,
        tests: [],
        total: 0,
        page: 1,
        limit: 12,
        hasMore: false,
      });

      const user = userEvent.setup();
      render(<TestLibraryPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search tests...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search tests...');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
      });
    });
  });
});
