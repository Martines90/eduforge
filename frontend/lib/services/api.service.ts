/**
 * API Service for backend communication
 * Base URL should be configured in environment variables
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'teacher' | 'general_user';
  country: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UserData {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export interface AuthData {
  user: UserData;
  token: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<ApiResponse<AuthData>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Registration failed');
  }

  return result;
}

/**
 * Send verification code to email
 */
export async function sendVerificationCode(email: string): Promise<ApiResponse<{ code?: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/send-verification-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to send verification code');
  }

  return result;
}

/**
 * Verify email with code
 */
export async function verifyEmail(email: string, code: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Email verification failed');
  }

  return result;
}

/**
 * Login user
 */
export async function loginUser(data: LoginData): Promise<ApiResponse<AuthData>> {
  console.log('[API Service] Calling backend login API with:', { email: data.email });

  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[API Service] Backend response status:', response.status);
  console.log('[API Service] Backend response body:', result);

  if (!response.ok) {
    console.error('[API Service] Login failed:', result);
    throw new Error(result.error || result.message || 'Login failed');
  }

  return result;
}

/**
 * Get current user info
 */
export async function getCurrentUser(token: string): Promise<ApiResponse<{ user: UserData }>> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to get user info');
  }

  return result;
}
