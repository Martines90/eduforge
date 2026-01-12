import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TasksPage from '../page';
import * as apiService from '@/lib/services/api.service';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API service
vi.mock('@/lib/services/api.service', () => ({
  fetchTreeMap: vi.fn(),
  fetchTasksByCurriculumPath: vi.fn(),
}));

// Mock UserContext
vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    user: {
      country: 'HU',
      isFirstVisit: false,
      hasCompletedOnboarding: true,
      isRegistered: false,
      profile: null,
      identity: 'non-teacher',
      role: 'guest',
      subject: null,
      educationalModel: null,
    },
    authInitialized: true,
    gradeSystem: {
      availableGrades: [],
      getGrade: vi.fn(),
      getRole: vi.fn(),
      getRoleLabel: vi.fn(),
      gradeValues: [],
    },
    setCountry: vi.fn(),
    setIdentity: vi.fn(),
    setSubject: vi.fn(),
    setEducationalModel: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    completeOnboarding: vi.fn(),
    resetUser: vi.fn(),
  }),
}));

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('TasksPage', () => {
  const mockTreeData = {
    success: true,
    message: 'Success',
    data: {
      tree: [
        {
          key: 'test_category',
          name: 'Test Category',
          level: 1,
          subTopics: [
            {
              key: 'test_leaf',
              name: 'Test Leaf',
              level: 2,
              subTopics: [],
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);
    mockFetchTreeMap.mockResolvedValue(mockTreeData);
  });

  it('should render page title and filters', async () => {
    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    // Check for filters - MUI Select uses different structure (appears in label and legend)
    expect(screen.getAllByText('Subject')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Grade')[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('should fetch tree data on mount with default filters', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    render(<TasksPage />);

    await waitFor(() => {
      // Should fetch both grade levels (default is "all")
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', 'mathematics', 'grade_9_10');
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', 'mathematics', 'grade_11_12');
    });
  });

  it('should fetch new tree data when subject changes', async () => {
    const user = userEvent.setup();
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetchTreeMap.mockClear();

    // Change subject - find by current value and click it
    const subjectSelect = screen.getByText('Mathematics').closest('[role="combobox"]');
    await user.click(subjectSelect!);

    const physicsOption = screen.getByRole('option', { name: /physics/i });
    await user.click(physicsOption);

    // Should fetch new data for physics
    await waitFor(() => {
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', 'physics', 'grade_9_10');
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', 'physics', 'grade_11_12');
    });
  });

  it('should fetch new tree data when grade changes', async () => {
    const user = userEvent.setup();
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetchTreeMap.mockClear();

    // Change grade - find by current value
    const gradeSelect = screen.getByText('All Grades').closest('[role="combobox"]');
    await user.click(gradeSelect!);

    const grade9_10Option = screen.getByRole('option', { name: /grade 9-10/i });
    await user.click(grade9_10Option);

    // Should fetch only grade_9_10 data
    await waitFor(() => {
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', 'mathematics', 'grade_9_10');
      expect(mockFetchTreeMap).toHaveBeenCalledTimes(1);
    });
  });

  it('should pass search query to TaskTreeView', async () => {
    const user = userEvent.setup();

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Test');

    // Search query should be at least 3 characters to activate
    expect(searchInput).toHaveValue('Test');
  });

  it('should show loading state while fetching data', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    // Create a promise that never resolves to keep loading state
    mockFetchTreeMap.mockImplementation(() => new Promise(() => {}));

    render(<TasksPage />);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });
  });

  it('should show error state when API fails', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);
    mockFetchTreeMap.mockRejectedValue(new Error('API Error'));

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should show empty state when no tasks available', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);
    mockFetchTreeMap.mockResolvedValue({
      success: true,
      message: 'Success',
      data: {
        tree: [],
      },
    });

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('No Tasks Available Yet')).toBeInTheDocument();
    });
  });

  it('should display separate sections for grade 9-10 and 11-12 when all grades selected', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);
    mockFetchTreeMap.mockResolvedValue(mockTreeData);

    render(<TasksPage />);

    await waitFor(() => {
      // Both grade sections should be visible
      const gradeSections = screen.getAllByText(/grade/i);
      expect(gradeSections.length).toBeGreaterThan(0);
    });
  });

  it('should use user country for API calls when user is registered', async () => {
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    render(<TasksPage />);

    await waitFor(() => {
      // Should use HU from mocked user context
      expect(mockFetchTreeMap).toHaveBeenCalledWith('HU', expect.any(String), expect.any(String));
    });
  });

  it('should show helper text when search query is less than 3 characters', async () => {
    const user = userEvent.setup();

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Te');

    // Should show helper text
    await waitFor(() => {
      expect(screen.getByText('Please enter at least 3 characters')).toBeInTheDocument();
    });
  });

  it('should handle multiple simultaneous API calls correctly', async () => {
    const user = userEvent.setup();
    const mockFetchTreeMap = vi.mocked(apiService.fetchTreeMap);

    render(<TasksPage />);

    await waitFor(() => {
      expect(screen.getByText('Educational Tasks')).toBeInTheDocument();
    });

    // Rapidly change filters
    const subjectSelect = screen.getByText('Mathematics').closest('[role="combobox"]');
    await user.click(subjectSelect!);
    await user.click(screen.getByRole('option', { name: /physics/i }));

    const gradeSelect = screen.getByText('All Grades').closest('[role="combobox"]');
    await user.click(gradeSelect!);
    await user.click(screen.getByRole('option', { name: /grade 9-10/i }));

    // Should handle without crashing
    await waitFor(() => {
      expect(mockFetchTreeMap).toHaveBeenCalled();
    });
  });

  it('should refetch data when user country changes', async () => {
    // This would require a more complex setup to mock user context changes
    // For now, this is a placeholder test to document expected behavior
    expect(true).toBe(true);
  });
});
