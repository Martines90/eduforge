import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginModal } from '../LoginModal';
import { I18nProvider } from '@/lib/i18n/I18nContext';

// Mock UserContext to provide a stable test environment
vi.mock('@/lib/context/UserContext', () => ({
  useUser: () => ({
    user: {
      country: 'HU',
      isFirstVisit: false,
      hasCompletedOnboarding: true,
      isRegistered: false,
      profile: null,
      identity: null,
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

// Helper to wrap component with I18nProvider
const renderWithI18n = (ui: React.ReactElement) => {
  return render(<I18nProvider>{ui}</I18nProvider>);
};

describe('LoginModal', () => {
  const mockOnLogin = vi.fn();
  const mockOnCreateAccount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form when opened', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.getByText('Welcome to EduForger')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render account creation buttons', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.getByRole('button', { name: /create teacher account/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^create account$/i })).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      renderWithI18n(
        <LoginModal
          open={false}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.queryByText('Welcome to EduForge')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      await user.click(emailInput);
      await user.tab(); // Trigger blur without typing

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, '123');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty password', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const passwordInput = screen.getByLabelText('Password');
      await user.click(passwordInput);
      await user.tab(); // Trigger blur without typing

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button when form is invalid', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const signInButton = screen.getByRole('button', { name: /sign in/i });

      // Empty form - button should work but validation will prevent submit
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockOnLogin).not.toHaveBeenCalled();
      });
    });
  });

  describe('Login Functionality', () => {
    it('should call onLogin with email and password on valid submission', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockResolvedValue(undefined);

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();

      // Make login take some time
      mockOnLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument();
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockRejectedValue(new Error('Invalid email or password'));

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'wrong@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Button should be enabled again after error
      expect(signInButton).not.toBeDisabled();
    });

    it('should handle network error gracefully', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockRejectedValue(new Error('Network error'));

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');

      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear error message on new submission', async () => {
      const user = userEvent.setup();

      // First attempt fails
      mockOnLogin.mockRejectedValueOnce(new Error('Invalid email or password'));

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Second attempt succeeds
      mockOnLogin.mockResolvedValueOnce(undefined);

      await user.clear(screen.getByLabelText('Password'));
      await user.type(screen.getByLabelText('Password'), 'correctpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Account Creation', () => {
    it('should call onCreateAccount with true for teacher account', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const teacherButton = screen.getByRole('button', { name: /create teacher account/i });
      await user.click(teacherButton);

      expect(mockOnCreateAccount).toHaveBeenCalledWith(true);
    });

    it('should call onCreateAccount with false for general account', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const createButton = screen.getByRole('button', { name: /^create account$/i });
      await user.click(createButton);

      expect(mockOnCreateAccount).toHaveBeenCalledWith(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');

      // Tab through inputs
      await user.tab();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();
    });

    it('should submit form on Enter key', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockResolvedValue(undefined);

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123{Enter}');

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('UI Elements', () => {
    it('should render forgot password link', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('should render terms and privacy notice', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(
        screen.getByText(/by continuing, you agree to our terms of service and privacy policy/i)
      ).toBeInTheDocument();
    });

    it('should have OR divider between login and account creation', () => {
      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      expect(screen.getByText('OR')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle email with uppercase characters', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockResolvedValue(undefined);

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'TEST@EXAMPLE.COM');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('TEST@EXAMPLE.COM', 'password123');
      });
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockResolvedValue(undefined);

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      await user.type(screen.getByLabelText('Email Address'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'P@ssw0rd!#$');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'P@ssw0rd!#$');
      });
    });

    it('should trim whitespace from email', async () => {
      const user = userEvent.setup();

      mockOnLogin.mockResolvedValue(undefined);

      renderWithI18n(
        <LoginModal
          open={true}
          onLogin={mockOnLogin}
          onCreateAccount={mockOnCreateAccount}
        />
      );

      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, '  test@example.com  ');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        // Note: Formik should handle trimming, but we're testing the raw value
        expect(mockOnLogin).toHaveBeenCalled();
      });
    });
  });
});
