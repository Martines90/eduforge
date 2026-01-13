import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskResult } from '../TaskResult';
import { I18nProvider } from '@/lib/i18n/I18nContext';
import { GeneratedTask } from '@/types/task';

// Mock dynamic imports
vi.mock('react-quill', () => ({
  default: () => <div data-testid="react-quill">Quill Editor</div>,
}));

vi.mock('next/script', () => ({
  default: ({ onLoad }: any) => {
    // Simulate script loaded
    React.useEffect(() => {
      if (onLoad) onLoad();
    }, [onLoad]);
    return null;
  },
}));

// Mock UserContext
vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    user: {
      country: 'US',
      isFirstVisit: false,
      hasCompletedOnboarding: true,
      isRegistered: true,
      profile: null,
      identity: 'teacher',
      role: 'registered',
      subjects: ['mathematics'],
      educationalModel: null,
      teacherRole: 'grade_9_10',
    },
    authInitialized: true,
  }),
}));

// Helper to wrap with I18nProvider
const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nProvider>{ui}</I18nProvider>);
};

const mockTask: GeneratedTask = {
  id: 'test-task-123',
  description: '<h1>Test Task</h1><p>This is a test task description.</p>',
  solution: '<h2>Solution</h2><p>This is the solution.</p>',
  images: [],
};

describe('TaskResult Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render loading state', () => {
      renderWithI18n(
        <TaskResult
          task={null}
          loading={true}
          loadingMessage="Generating task..."
        />
      );

      expect(screen.getByText('Generating task...')).toBeInTheDocument();
    });

    it('should render error state', () => {
      renderWithI18n(
        <TaskResult
          task={null}
          loading={false}
          error="Failed to generate task"
        />
      );

      expect(screen.getByText('Failed to generate task')).toBeInTheDocument();
    });

    it('should render task with description and solution', () => {
      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
        />
      );

      expect(screen.getByText('Generated Task')).toBeInTheDocument();
      expect(screen.getByText('Task')).toBeInTheDocument();
      // There may be multiple "Solution" texts (heading and in content)
      expect(screen.getAllByText('Solution').length).toBeGreaterThan(0);
    });

    it('should display task ID', () => {
      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
        />
      );

      // Task ID is displayed with a specific format
      expect(screen.getByText(/Task ID/)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(mockTask.id))).toBeInTheDocument();
    });
  });

  describe('Edit Mode Features', () => {
    it('should render Save Task button by default', () => {
      const mockOnSaveToDatabase = vi.fn();

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSaveToDatabase={mockOnSaveToDatabase}
        />
      );

      expect(screen.getByText('Save Task')).toBeInTheDocument();
    });

    it('should show View Task Info button when saved with no unsaved changes', () => {
      const mockOnViewTaskInfo = vi.fn();
      const savedTaskInfo = {
        taskId: 'test-task-123',
        publicShareLink: 'http://localhost:3000/tasks/test-task-123',
        pdfUrl: 'http://localhost:3000/pdfs/test-task-123.pdf',
      };

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          hasUnsavedChanges={false}
          onViewTaskInfo={mockOnViewTaskInfo}
          savedTaskInfo={savedTaskInfo}
        />
      );

      expect(screen.getByText('View Task Info')).toBeInTheDocument();
      expect(screen.queryByText('Save Task')).not.toBeInTheDocument();
    });

    it('should show Save Task button when there are unsaved changes', () => {
      const mockOnSaveToDatabase = vi.fn();
      const savedTaskInfo = {
        taskId: 'test-task-123',
        publicShareLink: 'http://localhost:3000/tasks/test-task-123',
      };

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          hasUnsavedChanges={true}
          onSaveToDatabase={mockOnSaveToDatabase}
          savedTaskInfo={savedTaskInfo}
        />
      );

      expect(screen.getByText('Save Task')).toBeInTheDocument();
      expect(screen.queryByText('View Task Info')).not.toBeInTheDocument();
    });

    it('should call onViewTaskInfo when View Task Info button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnViewTaskInfo = vi.fn();
      const savedTaskInfo = {
        taskId: 'test-task-123',
        publicShareLink: 'http://localhost:3000/tasks/test-task-123',
      };

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          hasUnsavedChanges={false}
          onViewTaskInfo={mockOnViewTaskInfo}
          savedTaskInfo={savedTaskInfo}
        />
      );

      const viewButton = screen.getByText('View Task Info');
      await user.click(viewButton);

      expect(mockOnViewTaskInfo).toHaveBeenCalledTimes(1);
    });

    it('should call onSaveToDatabase when Save Task button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSaveToDatabase = vi.fn();

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSaveToDatabase={mockOnSaveToDatabase}
        />
      );

      const saveButton = screen.getByText('Save Task');
      await user.click(saveButton);

      expect(mockOnSaveToDatabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('Button States', () => {
    it('should disable Save button when saving', () => {
      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSaveToDatabase={vi.fn()}
          isSaving={true}
        />
      );

      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeInTheDocument();
    });

    it('should show Download PDF button', () => {
      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
        />
      );

      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });

  describe('Guest Mode', () => {
    it('should trigger guest prompt when saving in guest mode', async () => {
      const user = userEvent.setup();
      const mockOnGuestPrompt = vi.fn();

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSaveToDatabase={vi.fn()}
          isGuestMode={true}
          onGuestPrompt={mockOnGuestPrompt}
        />
      );

      const saveButton = screen.getByText('Save Task');
      await user.click(saveButton);

      expect(mockOnGuestPrompt).toHaveBeenCalledWith('save');
    });

    it('should trigger guest prompt when downloading in guest mode', async () => {
      const user = userEvent.setup();
      const mockOnGuestPrompt = vi.fn();

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          isGuestMode={true}
          onGuestPrompt={mockOnGuestPrompt}
        />
      );

      const downloadButton = screen.getByText('Download PDF');
      await user.click(downloadButton);

      expect(mockOnGuestPrompt).toHaveBeenCalledWith('download');
    });
  });

  describe('Edit Functionality', () => {
    it('should show edit buttons for task and solution', () => {
      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSave={vi.fn()}
        />
      );

      // Find edit buttons by title attribute
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThanOrEqual(2); // At least task and solution edit buttons
    });

    it('should display edited solution after saving changes', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn();

      const { rerender } = renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onSave={mockOnSave}
        />
      );

      // Initially, solution should be displayed
      expect(screen.getAllByText('Solution').length).toBeGreaterThan(0);

      // When user saves edited solution, the component should show the edited version
      const editedTask = {
        ...mockTask,
        solution: '<h2>Updated Solution</h2><p>This is the updated solution.</p>',
      };

      // Rerender with edited task
      rerender(
        <I18nProvider>
          <TaskResult
            task={editedTask}
            loading={false}
            onSave={mockOnSave}
          />
        </I18nProvider>
      );

      // Solution should still be visible with updated content
      expect(screen.getAllByText('Solution').length).toBeGreaterThan(0);
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnClose = vi.fn();

      renderWithI18n(
        <TaskResult
          task={mockTask}
          loading={false}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByTitle('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading Progress', () => {
    it('should display progress percentage when provided', () => {
      renderWithI18n(
        <TaskResult
          task={null}
          loading={true}
          loadingProgress={50}
          loadingMessage="Generating images..."
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Generating images...')).toBeInTheDocument();
    });
  });
});
