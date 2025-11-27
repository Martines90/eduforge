import { Request, Response, NextFunction } from 'express';
import { authenticate, requireTeacher, requireAuthenticatedTeacher, AuthRequest } from '../auth.middleware';
import * as authService from '../../services/auth.service';

// Mock auth service
jest.mock('../../services/auth.service');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate valid Bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect((mockRequest as AuthRequest).user).toEqual(mockDecoded);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate token without Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'valid-token',
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(authService.verifyToken).toHaveBeenCalledWith('valid-token');
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header is required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is empty', async () => {
      mockRequest.headers = {
        authorization: '',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header is required',
      });
    });

    it('should return 401 if token is Bearer with empty value', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Token is required',
      });
    });

    it('should return 401 if token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    });
  });

  describe('requireTeacher', () => {
    it('should allow teacher to proceed', () => {
      mockRequest = {
        user: {
          uid: 'user123',
          email: 'teacher@school.edu',
          role: 'teacher',
        },
      } as AuthRequest;

      requireTeacher(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no user attached', () => {
      mockRequest = {} as AuthRequest;

      requireTeacher(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not a teacher', () => {
      mockRequest = {
        user: {
          uid: 'user123',
          email: 'student@example.com',
          role: 'general_user',
        },
      } as AuthRequest;

      requireTeacher(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        message: 'This endpoint requires teacher role',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireAuthenticatedTeacher', () => {
    it('should be an array of middleware functions', () => {
      expect(Array.isArray(requireAuthenticatedTeacher)).toBe(true);
      expect(requireAuthenticatedTeacher).toHaveLength(2);
      expect(requireAuthenticatedTeacher[0]).toBe(authenticate);
      expect(requireAuthenticatedTeacher[1]).toBe(requireTeacher);
    });

    it('should work correctly when both middlewares pass', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'teacher@school.edu',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      // Execute first middleware (authenticate)
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Verify user was attached
      expect((mockRequest as AuthRequest).user).toEqual(mockDecoded);
      expect(nextFunction).toHaveBeenCalledTimes(1);

      // Reset nextFunction mock
      nextFunction = jest.fn();

      // Execute second middleware (requireTeacher)
      requireTeacher(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should fail at authenticate step if no token', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail at requireTeacher step if not teacher', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'student@example.com',
        role: 'general_user',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      // Execute authenticate
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // Reset mocks
      nextFunction = jest.fn();
      mockResponse.status = jest.fn().mockReturnThis();
      mockResponse.json = jest.fn().mockReturnThis();

      // Execute requireTeacher
      requireTeacher(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle case-sensitive Bearer prefix', async () => {
      mockRequest.headers = {
        authorization: 'bearer valid-token', // lowercase
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      // Should still work (token extracted as 'bearer valid-token')
      expect(authService.verifyToken).toHaveBeenCalled();
    });

    it('should preserve original request properties', async () => {
      mockRequest = {
        headers: {
          authorization: 'Bearer valid-token',
        },
        body: { test: 'data' },
        params: { id: '123' },
        query: { filter: 'active' },
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body).toEqual({ test: 'data' });
      expect(mockRequest.params).toEqual({ id: '123' });
      expect(mockRequest.query).toEqual({ filter: 'active' });
      expect((mockRequest as AuthRequest).user).toEqual(mockDecoded);
    });

    it('should handle JWT with special characters', async () => {
      const complexToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ1c2VyMTIzIn0.sig';

      mockRequest.headers = {
        authorization: `Bearer ${complexToken}`,
      };

      const mockDecoded = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'teacher',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue(mockDecoded);

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(authService.verifyToken).toHaveBeenCalledWith(complexToken);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Error logging', () => {
    it('should log authentication errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (authService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token validation failed');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Authentication error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
