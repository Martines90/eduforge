import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import {
  RegisterRequest,
  LoginRequest,
  VerificationCodeRequest,
  VerifyEmailRequest,
  AuthResponse,
} from '../types/auth.types';
import { verifyRecaptcha } from '../utils/recaptcha.util';

/**
 * POST /api/auth/register
 * Initiate registration - send verification code (no user created yet)
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const data: RegisterRequest = req.body;

    // Validate required fields
    if (!data.email || !data.password || !data.name || !data.role || !data.country) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields',
        error: 'email, password, name, role, and country are required',
      } as AuthResponse);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
      } as AuthResponse);
      return;
    }

    // Validate password length
    if (data.password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      } as AuthResponse);
      return;
    }

    // Verify reCAPTCHA token
    if (data.recaptchaToken) {
      const isRecaptchaValid = await verifyRecaptcha(data.recaptchaToken);
      if (!isRecaptchaValid) {
        res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed. Please try again.',
          error: 'Invalid reCAPTCHA token',
        } as AuthResponse);
        return;
      }
    } else {
      // If no reCAPTCHA token provided and we're in production, reject the request
      if (process.env.NODE_ENV === 'production') {
        res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification is required',
          error: 'Missing reCAPTCHA token',
        } as AuthResponse);
        return;
      }
      console.warn('[Auth] No reCAPTCHA token provided (development mode)');
    }

    // Initiate registration - store verification code only
    const code = await authService.initiateRegistration(data);

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email. Please verify to complete registration.',
      // In development, include code in response (remove in production!)
      data: process.env.NODE_ENV === 'development' ? { code } : undefined,
    } as AuthResponse);
  } catch (error: any) {
    console.error('Register error:', error);

    if (error.message === 'Email already registered') {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
        error: error.message,
      } as AuthResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message,
      } as AuthResponse);
    }
  }
}

/**
 * POST /api/auth/send-verification-code
 * Send verification code to email (for resending)
 * Note: This endpoint is deprecated - use /register endpoint which creates verification code
 */
export async function sendVerificationCode(req: Request, res: Response): Promise<void> {
  try {
    const { email }: VerificationCodeRequest = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email is required',
      } as AuthResponse);
      return;
    }

    // This endpoint is deprecated - direct users to use /register instead
    res.status(400).json({
      success: false,
      message: 'This endpoint is deprecated. Please use /api/auth/register to initiate registration.',
    } as AuthResponse);
  } catch (error: any) {
    console.error('Send verification code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: error.message,
    } as AuthResponse);
  }
}

/**
 * POST /api/auth/verify-email
 * Verify email with code and create user account
 */
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  try {
    const { email, code }: VerifyEmailRequest = req.body;

    if (!email || !code) {
      res.status(400).json({
        success: false,
        message: 'Email and code are required',
      } as AuthResponse);
      return;
    }

    // Verify code and create user
    const { uid, token } = await authService.verifyCodeAndCreateUser(email, code);

    // Get user data
    const user = await authService.getUserById(uid);

    // Serialize subscription timestamps to ISO strings for JSON response
    const serializedSubscription = user?.subscription ? {
      plan: user.subscription.plan,
      status: user.subscription.status,
      trialStartDate: user.subscription.trialStartDate?.toDate?.()?.toISOString() || user.subscription.trialStartDate,
      trialEndDate: user.subscription.trialEndDate?.toDate?.()?.toISOString() || user.subscription.trialEndDate,
      annualStartDate: user.subscription.annualStartDate?.toDate?.()?.toISOString() || user.subscription.annualStartDate,
      annualEndDate: user.subscription.annualEndDate?.toDate?.()?.toISOString() || user.subscription.annualEndDate,
    } : undefined;

    res.status(201).json({
      success: true,
      message: 'Email verified successfully. Account created.',
      data: {
        user: user
          ? {
              uid: user.uid,
              email: user.email,
              name: user.name,
              emailVerified: user.emailVerified,
              role: user.role,
              country: user.country,
              subject: user.subject,
              educationalModel: user.educationalModel,
              subscription: serializedSubscription,
              taskCredits: user.taskCredits,
            }
          : undefined,
        token,
      },
    } as AuthResponse);
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Email verification failed',
      error: error.message,
    } as AuthResponse);
  }
}

/**
 * POST /api/auth/login
 * Login user
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const data: LoginRequest = req.body;

    if (!data.email || !data.password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      } as AuthResponse);
      return;
    }

    // Login user
    const { user, token } = await authService.loginUser(data);

    // Serialize subscription timestamps to ISO strings for JSON response
    const serializedSubscription = user.subscription ? {
      plan: user.subscription.plan,
      status: user.subscription.status,
      trialStartDate: user.subscription.trialStartDate?.toDate?.()?.toISOString() || user.subscription.trialStartDate,
      trialEndDate: user.subscription.trialEndDate?.toDate?.()?.toISOString() || user.subscription.trialEndDate,
      annualStartDate: user.subscription.annualStartDate?.toDate?.()?.toISOString() || user.subscription.annualStartDate,
      annualEndDate: user.subscription.annualEndDate?.toDate?.()?.toISOString() || user.subscription.annualEndDate,
    } : undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          role: user.role,
          country: user.country,
          subject: user.subject,
          educationalModel: user.educationalModel,
          subscription: serializedSubscription,
          taskCredits: user.taskCredits,
        },
        token,
      },
    } as AuthResponse);
  } catch (error: any) {
    console.error('Login error:', error);

    if (error.message === 'Invalid email or password') {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      } as AuthResponse);
    } else if (error.message === 'Account has been banned') {
      res.status(403).json({
        success: false,
        message: 'Account has been banned',
      } as AuthResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message,
      } as AuthResponse);
    }
  }
}

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      } as AuthResponse);
      return;
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = authService.verifyToken(token);

    // Get user data
    const user = await authService.getUserById(decoded.uid);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      } as AuthResponse);
      return;
    }

    // Serialize subscription timestamps to ISO strings for JSON response
    const serializedSubscription = user.subscription ? {
      plan: user.subscription.plan,
      status: user.subscription.status,
      trialStartDate: user.subscription.trialStartDate?.toDate?.()?.toISOString() || user.subscription.trialStartDate,
      trialEndDate: user.subscription.trialEndDate?.toDate?.()?.toISOString() || user.subscription.trialEndDate,
      annualStartDate: user.subscription.annualStartDate?.toDate?.()?.toISOString() || user.subscription.annualStartDate,
      annualEndDate: user.subscription.annualEndDate?.toDate?.()?.toISOString() || user.subscription.annualEndDate,
    } : undefined;

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: {
          uid: user.uid,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          role: user.role,
          country: user.country,
          subject: user.subject,
          educationalModel: user.educationalModel,
          subscription: serializedSubscription,
          taskCredits: user.taskCredits,
        },
      },
    } as AuthResponse);
  } catch (error: any) {
    console.error('Get current user error:', error);

    if (error.message === 'Invalid token') {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      } as AuthResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to get user info',
        error: error.message,
      } as AuthResponse);
    }
  }
}
