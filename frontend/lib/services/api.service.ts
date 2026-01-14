/**
 * API Service for backend communication
 * Base URL should be configured in environment variables
 */

import { TaskGeneratorRequest, TaskGeneratorResponse } from '@/types/task';

// For Firebase Hosting with Cloud Functions rewrites, use empty string in production
// This makes requests relative to the current domain
// In production (when not localhost), always use relative URLs (empty string)
// This allows Firebase Hosting rewrites to work properly
const getApiBaseUrl = (): string => {
  // If explicitly set via env var, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // In production (not localhost), use relative URLs
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
    // In local development, use localhost
    return 'http://localhost:3000';
  }

  // During SSR/build time in production, use relative URLs
  // In development (local), use localhost
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
};

export const API_BASE_URL = getApiBaseUrl();

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
  subjects?: string[]; // For teachers - multi-select
  educationalModel?: string; // For teachers - grade/school type level
  teacherRole?: string; // For teachers - the grade level they teach (e.g., "grade_6_8")
  recaptchaToken?: string;
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
    // Don't log 401 errors as they're expected for invalid/expired tokens
    if (response.status !== 401) {
      console.error('[API Service] Get current user failed:', result);
    }
    throw new Error(result.error || result.message || 'Invalid token');
  }

  return result;
}

/**
 * Generate a task
 */
export async function generateTask(data: TaskGeneratorRequest, token?: string): Promise<TaskGeneratorResponse> {
  console.log('[API Service] Calling task generator API with:', data);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/generate-task`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[API Service] Task generator response status:', response.status);
  console.log('[API Service] Task generator response body:', result);

  if (!response.ok) {
    console.error('[API Service] Task generation failed:', result);
    return {
      success: false,
      error: result.error || 'Task generation failed',
      message: result.message || 'Failed to generate task',
    };
  }

  // Transform backend response to frontend format
  const taskData = result.task_data || result;
  const transformedTask = {
    id: result.task_id || taskData.metadata?.curriculum_path || 'unknown',
    description: formatTaskDescription(taskData),
    solution: formatSolution(taskData),
    images: taskData.images || [],
  };

  return {
    success: true,
    task: transformedTask,
  };
}

/**
 * Format task description (problem only, no solution)
 */
function formatTaskDescription(taskData: any): string {
  let html = '';

  // Title
  if (taskData.title) {
    html += `<h1>${taskData.title}</h1>\n`;
  }

  // Story/Problem Statement
  if (taskData.story_text) {
    html += `<div class="story">\n${taskData.story_text}\n</div>\n`;
  }

  // Questions
  if (taskData.questions && taskData.questions.length > 0) {
    html += `<h2>Feladatok:</h2>\n<ol>\n`;
    taskData.questions.forEach((question: string) => {
      html += `<li>${question}</li>\n`;
    });
    html += `</ol>\n`;
  }

  return html;
}

/**
 * Format solution (separate from problem description)
 */
function formatSolution(taskData: any): string {
  let html = '';

  // Solution Steps
  if (taskData.solution_steps && taskData.solution_steps.length > 0) {
    html += `<h2>Megoldás lépései:</h2>\n`;
    taskData.solution_steps.forEach((step: any) => {
      html += `<div class="solution-step">\n`;
      html += `<h3>${step.step_number}. ${step.title}</h3>\n`;
      html += `<p>${step.description}</p>\n`;

      if (step.formula) {
        html += `<p><strong>Képlet:</strong> <code>${step.formula}</code></p>\n`;
      }

      if (step.calculation) {
        html += `<p><strong>Számítás:</strong> <code>${step.calculation}</code></p>\n`;
      }

      if (step.result) {
        html += `<p><strong>Eredmény:</strong> ${step.result}</p>\n`;
      }

      if (step.explanation) {
        html += `<p><em>${step.explanation}</em></p>\n`;
      }

      html += `</div>\n`;
    });
  }

  // Final Answer
  if (taskData.final_answer) {
    html += `<h2>Végeredmény:</h2>\n`;
    html += `<p><strong>${taskData.final_answer}</strong></p>\n`;
  }

  // Verification
  if (taskData.verification) {
    html += `<h3>Ellenőrzés:</h3>\n`;
    html += `<p>${taskData.verification}</p>\n`;
  }

  // Common Mistakes
  if (taskData.common_mistakes && taskData.common_mistakes.length > 0) {
    html += `<h3>Gyakori hibák:</h3>\n<ul>\n`;
    taskData.common_mistakes.forEach((mistake: string) => {
      html += `<li>${mistake}</li>\n`;
    });
    html += `</ul>\n`;
  }

  return html;
}

/**
 * Fetch curriculum tree data
 */
export async function fetchTreeMap(country: string, subject: string, gradeLevel: string): Promise<ApiResponse<{ tree: any[] }>> {
  const response = await fetch(`${API_BASE_URL}/api/tree-map/${country}/${subject}/${gradeLevel}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load curriculum tree');
  }

  return data;
}

/**
 * Fetch tasks by curriculum path
 * Public endpoint - no authentication required for browsing published tasks
 */
export async function fetchTasksByCurriculumPath(
  curriculumPath: string,
  isPublished: boolean = true
): Promise<{ success: boolean; tasks: any[] }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v2/tasks?curriculum_path=${encodeURIComponent(curriculumPath)}&isPublished=${isPublished}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to load tasks');
  }

  return data;
}

/**
 * Fetch task by ID
 * Includes auth token from localStorage to support both registered and guest users
 */
export async function fetchTaskById(taskId: string, view: boolean = false): Promise<ApiResponse<any>> {
  const viewParam = view ? '?view=true' : '';

  // Get token from localStorage (works for both registered users and guests)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/v2/tasks/${taskId}${viewParam}`, {
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Task not found');
  }

  return data;
}

/**
 * Fetch tasks created by the authenticated teacher
 */
export async function fetchMyTasks(params?: {
  status?: 'published' | 'draft';
  sort?: 'rating' | 'views' | 'recent' | 'popular';
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; tasks: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  console.log('[fetchMyTasks] Auth token present:', !!token);
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/v2/tasks/my${queryString ? `?${queryString}` : ''}`;

  console.log('[fetchMyTasks] Fetching from URL:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('[fetchMyTasks] Response status:', response.status);
  console.log('[fetchMyTasks] Response data:', data);

  if (!response.ok) {
    console.error('[fetchMyTasks] Error response:', data);
    throw new Error(data.message || 'Failed to fetch tasks');
  }

  return data;
}

/**
 * Request password reset - sends email with reset link
 */
export async function requestPasswordReset(email: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/password-reset/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to request password reset');
  }

  return result;
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<ApiResponse<{ valid: boolean }>> {
  const response = await fetch(`${API_BASE_URL}/api/password-reset/verify/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to verify reset token');
  }

  return result;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/password-reset/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to reset password');
  }

  return result;
}

/**
 * Submit contact support message
 */
export async function submitContactSupport(data: {
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
}): Promise<ApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/contact/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Failed to submit contact message');
  }

  return result;
}
