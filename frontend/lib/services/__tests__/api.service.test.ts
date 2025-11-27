import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as apiService from '../api.service';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Service', () => {
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should successfully register a teacher', async () => {
      const mockData = {
        email: 'teacher@school.edu',
        password: 'password123',
        name: 'John Teacher',
        role: 'teacher' as const,
        country: 'US',
      };

      const mockResponse = {
        success: true,
        message: 'Verification code sent to email',
        data: {
          code: '123456',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.registerUser(mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockData),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should successfully register a general user', async () => {
      const mockData = {
        email: 'user@example.com',
        password: 'password123',
        name: 'Jane User',
        role: 'general_user' as const,
        country: 'US',
      };

      const mockResponse = {
        success: true,
        message: 'Verification code sent to email',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.registerUser(mockData);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      );
    });

    it('should throw error when email already exists', async () => {
      const mockData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'general_user' as const,
        country: 'US',
      };

      const mockResponse = {
        success: false,
        error: 'Email already registered',
        message: 'Email already registered',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.registerUser(mockData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('should throw error when validation fails', async () => {
      const mockData = {
        email: 'invalid-email',
        password: '123',
        name: '',
        role: 'general_user' as const,
        country: 'US',
      };

      const mockResponse = {
        success: false,
        error: 'Validation failed',
        message: 'Invalid input data',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.registerUser(mockData)).rejects.toThrow();
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with valid code', async () => {
      const email = 'test@example.com';
      const code = '123456';

      const mockResponse = {
        success: true,
        message: 'Email verified successfully',
        data: {
          user: {
            uid: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
          },
          token: 'jwt-token-here',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.verifyEmail(email, code);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/verify-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code }),
        }
      );

      expect(result).toEqual(mockResponse);
      expect(result.data?.token).toBeDefined();
    });

    it('should throw error with invalid code', async () => {
      const email = 'test@example.com';
      const code = '999999';

      const mockResponse = {
        success: false,
        error: 'Invalid verification code',
        message: 'Invalid verification code',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.verifyEmail(email, code)).rejects.toThrow(
        'Invalid verification code'
      );
    });

    it('should throw error with expired code', async () => {
      const email = 'test@example.com';
      const code = '123456';

      const mockResponse = {
        success: false,
        error: 'Verification code has expired',
        message: 'Verification code has expired',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.verifyEmail(email, code)).rejects.toThrow(
        'Verification code has expired'
      );
    });
  });

  describe('loginUser', () => {
    it('should successfully login with valid credentials', async () => {
      const mockData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            uid: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
          },
          token: 'jwt-token-here',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.loginUser(mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockData),
        }
      );

      expect(result).toEqual(mockResponse);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.user.email).toBe('test@example.com');
    });

    it('should throw error with invalid email', async () => {
      const mockData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const mockResponse = {
        success: false,
        error: 'Invalid email or password',
        message: 'Invalid email or password',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.loginUser(mockData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error with invalid password', async () => {
      const mockData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockResponse = {
        success: false,
        error: 'Invalid email or password',
        message: 'Invalid email or password',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.loginUser(mockData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error when account is banned', async () => {
      const mockData = {
        email: 'banned@example.com',
        password: 'password123',
      };

      const mockResponse = {
        success: false,
        error: 'Account has been banned',
        message: 'Account has been banned',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.loginUser(mockData)).rejects.toThrow(
        'Account has been banned'
      );
    });
  });

  describe('sendVerificationCode', () => {
    it('should successfully send verification code', async () => {
      const email = 'test@example.com';

      const mockResponse = {
        success: true,
        message: 'Verification code sent to email',
        data: {
          code: '123456',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.sendVerificationCode(email);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/send-verification-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error with invalid email', async () => {
      const email = 'invalid-email';

      const mockResponse = {
        success: false,
        error: 'Invalid email format',
        message: 'Invalid email format',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.sendVerificationCode(email)).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should successfully get current user info', async () => {
      const token = 'valid-jwt-token';

      const mockResponse = {
        success: true,
        message: 'User retrieved successfully',
        data: {
          user: {
            uid: 'user123',
            email: 'test@example.com',
            name: 'Test User',
            emailVerified: true,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiService.getCurrentUser(token);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/me',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should throw error with invalid token', async () => {
      const token = 'invalid-token';

      const mockResponse = {
        success: false,
        error: 'Invalid token',
        message: 'Invalid token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.getCurrentUser(token)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error with expired token', async () => {
      const token = 'expired-token';

      const mockResponse = {
        success: false,
        error: 'Token expired',
        message: 'Token expired',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      } as Response);

      await expect(apiService.getCurrentUser(token)).rejects.toThrow();
    });
  });
});
