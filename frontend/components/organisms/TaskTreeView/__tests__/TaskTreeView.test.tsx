import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskTreeView } from '../TaskTreeView';
import { TreeNode } from '@/types/task-tree';
import * as apiService from '@/lib/services/api.service';

// Mock the API service
vi.mock('@/lib/services/api.service', () => ({
  fetchTasksByCurriculumPath: vi.fn(),
}));

// Mock the UserContext
vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    user: {
      identity: 'general_user',
      isRegistered: false,
    },
  }),
}));

// Mock the i18n hook
vi.mock('@/lib/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('TaskTreeView', () => {
  const mockTreeData: TreeNode[] = [
    {
      key: 'haromszogek',
      name: 'Háromszögek',
      level: 1,
      subTopics: [
        {
          key: 'pitagorasz',
          name: 'Pitagorasz-tétel',
          level: 2,
          subTopics: [],
        },
        {
          key: 'haromszog_korei',
          name: 'Háromszög körei',
          level: 2,
          subTopics: [
            {
              key: 'beirt_kor',
              name: 'Beírt kör',
              level: 3,
              subTopics: [],
            },
          ],
        },
      ],
    },
    {
      key: 'halmazok',
      name: 'Halmazok',
      level: 1,
      subTopics: [
        {
          key: 'halmazmuvletek',
          name: 'Halmazműveletek',
          level: 2,
          subTopics: [],
        },
      ],
    },
  ];

  const mockTasks = [
    {
      id: 'task_1',
      title: 'Pitagorasz-tétel alkalmazása',
      subject: 'mathematics',
      educationalModel: 'secular',
      rating: 4.5,
      views: 39,
      description: 'Test task description',
      createdAt: '2025-01-01T00:00:00.000Z',
      gradeLevel: 'grade_9_10',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render tree structure with root nodes', () => {
    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    expect(screen.getByText('Háromszögek')).toBeInTheDocument();
    expect(screen.getByText('Halmazok')).toBeInTheDocument();
  });

  it('should expand categories when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Initially, subcategories should not be visible
    expect(screen.queryByText('Pitagorasz-tétel')).not.toBeInTheDocument();

    // Find and click the expand button for Háromszögek
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    const expandButton = within(haromszogekRow!).getByRole('button');
    await user.click(expandButton);

    // After expansion, subcategories should be visible
    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel')).toBeInTheDocument();
      expect(screen.getByText('Háromszög körei')).toBeInTheDocument();
    });
  });

  it('should load tasks when leaf node is expanded', async () => {
    const user = userEvent.setup();
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);
    mockFetchTasks.mockResolvedValue({
      success: true,
      tasks: mockTasks,
    });

    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Expand parent category
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    const expandButton1 = within(haromszogekRow!).getByRole('button');
    await user.click(expandButton1);

    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel')).toBeInTheDocument();
    });

    // Expand leaf node to load tasks
    const pitagoraszRow = screen.getByText('Pitagorasz-tétel').closest('tr');
    const expandButton2 = within(pitagoraszRow!).getByRole('button');
    await user.click(expandButton2);

    // Verify API was called with correct curriculum path
    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalledWith(
        'mathematics:grade_9_10:Háromszögek:Pitagorasz-tétel',
        true
      );
    });

    // Verify tasks are displayed
    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel alkalmazása')).toBeInTheDocument();
    });
  });

  it('should display "no tasks" message when leaf has no tasks', async () => {
    const user = userEvent.setup();
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);
    mockFetchTasks.mockResolvedValue({
      success: true,
      tasks: [],
    });

    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Expand parent category
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    const expandButton1 = within(haromszogekRow!).getByRole('button');
    await user.click(expandButton1);

    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel')).toBeInTheDocument();
    });

    // Expand leaf node
    const pitagoraszRow = screen.getByText('Pitagorasz-tétel').closest('tr');
    const expandButton2 = within(pitagoraszRow!).getByRole('button');
    await user.click(expandButton2);

    // Verify "no tasks" message is displayed
    await waitFor(() => {
      expect(screen.getByText('No teacher added any tasks yet.')).toBeInTheDocument();
    });
  });

  it('should filter tree nodes based on search query', async () => {
    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
        searchQuery="Pitagorasz"
      />
    );

    // The parent category should be visible because it has a matching child
    expect(screen.getByText('Háromszögek')).toBeInTheDocument();

    // Halmazok should not be visible because it doesn't match
    expect(screen.queryByText('Halmazok')).not.toBeInTheDocument();
  });

  it('should auto-expand parent nodes but not leaf nodes when searching', async () => {
    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
        searchQuery="Beírt"
      />
    );

    // Parent categories should auto-expand to reveal matching descendants
    await waitFor(() => {
      expect(screen.getByText('Háromszögek')).toBeInTheDocument();
      expect(screen.getByText('Háromszög körei')).toBeInTheDocument();
      expect(screen.getByText('Beírt kör')).toBeInTheDocument();
    });

    // But leaf node should NOT be expanded (tasks not loaded)
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);
    expect(mockFetchTasks).not.toHaveBeenCalled();
  });

  it('should not show nodes when search query is less than 3 characters', () => {
    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
        searchQuery="Pi"
      />
    );

    // All nodes should still be visible with short search
    expect(screen.getByText('Háromszögek')).toBeInTheDocument();
    expect(screen.getByText('Halmazok')).toBeInTheDocument();
  });

  it('should handle API errors gracefully when loading tasks', async () => {
    const user = userEvent.setup();
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);
    mockFetchTasks.mockRejectedValue(new Error('API Error'));

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Expand parent category
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    const expandButton1 = within(haromszogekRow!).getByRole('button');
    await user.click(expandButton1);

    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel')).toBeInTheDocument();
    });

    // Expand leaf node
    const pitagoraszRow = screen.getByText('Pitagorasz-tétel').closest('tr');
    const expandButton2 = within(pitagoraszRow!).getByRole('button');
    await user.click(expandButton2);

    // Should show no tasks message after error
    await waitFor(() => {
      expect(screen.getByText('No teacher added any tasks yet.')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('should display loading state while fetching tasks', async () => {
    const user = userEvent.setup();
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);

    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetchTasks.mockReturnValue(promise as any);

    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Expand parent category
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    const expandButton1 = within(haromszogekRow!).getByRole('button');
    await user.click(expandButton1);

    await waitFor(() => {
      expect(screen.getByText('Pitagorasz-tétel')).toBeInTheDocument();
    });

    // Expand leaf node
    const pitagoraszRow = screen.getByText('Pitagorasz-tétel').closest('tr');
    const expandButton2 = within(pitagoraszRow!).getByRole('button');
    await user.click(expandButton2);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolvePromise!({ success: true, tasks: mockTasks });

    // Loading should disappear and tasks should appear
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      expect(screen.getByText('Pitagorasz-tétel alkalmazása')).toBeInTheDocument();
    });
  });

  it('should build correct curriculum path for nested leaf nodes', async () => {
    const user = userEvent.setup();
    const mockFetchTasks = vi.mocked(apiService.fetchTasksByCurriculumPath);
    mockFetchTasks.mockResolvedValue({
      success: true,
      tasks: [],
    });

    render(
      <TaskTreeView
        data={mockTreeData}
        subject="mathematics"
        gradeLevel="grade_9_10"
      />
    );

    // Expand parent category
    const haromszogekRow = screen.getByText('Háromszögek').closest('tr');
    await user.click(within(haromszogekRow!).getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Háromszög körei')).toBeInTheDocument();
    });

    // Expand subcategory
    const koreiRow = screen.getByText('Háromszög körei').closest('tr');
    await user.click(within(koreiRow!).getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Beírt kör')).toBeInTheDocument();
    });

    // Expand leaf node
    const beirtKorRow = screen.getByText('Beírt kör').closest('tr');
    await user.click(within(beirtKorRow!).getByRole('button'));

    // Verify correct curriculum path
    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalledWith(
        'mathematics:grade_9_10:Háromszögek:Háromszög körei:Beírt kör',
        true
      );
    });
  });
});
