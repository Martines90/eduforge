/**
 * Test/Worksheet API Service
 * Handles all test management operations
 */

import { API_BASE_URL } from './api.service';
import {
  Test,
  TestWithTasks,
  CreateTestRequest,
  UpdateTestRequest,
  AddTaskToTestRequest,
  UpdateTestTaskRequest,
  ReorderTasksRequest,
  PublishedTest,
} from '@/types/test.types';

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

/**
 * Get all tests for current user
 */
export async function fetchMyTests(params?: {
  subject?: string;
  sort?: 'recent' | 'name' | 'taskCount';
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  tests: Test[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const token = getAuthToken();

  const queryParams = new URLSearchParams();
  if (params?.subject) queryParams.append('subject', params.subject);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/v2/tests${queryString ? `?${queryString}` : ''}`;

  console.log('[fetchMyTests] Fetching from URL:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('[fetchMyTests] Response status:', response.status);

  if (!response.ok) {
    console.error('[fetchMyTests] Error response:', data);
    throw new Error(data.message || data.error || 'Failed to fetch tests');
  }

  return data;
}

/**
 * Create a new test
 */
export async function createTest(data: CreateTestRequest): Promise<{
  success: boolean;
  message: string;
  test: Test;
}> {
  const token = getAuthToken();

  console.log('[createTest] Creating test:', data);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[createTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[createTest] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to create test');
  }

  return result;
}

/**
 * Get a single test with all its tasks
 */
export async function fetchTestById(testId: string): Promise<{
  success: boolean;
  test: Test;
  tasks: any[];
}> {
  const token = getAuthToken();

  console.log('[fetchTestById] Fetching test:', testId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('[fetchTestById] Response status:', response.status);

  if (!response.ok) {
    console.error('[fetchTestById] Error response:', data);
    throw new Error(data.message || data.error || 'Failed to fetch test');
  }

  return data;
}

/**
 * Update test metadata (name, description, subject, gradeLevel)
 */
export async function updateTest(testId: string, data: UpdateTestRequest): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[updateTest] Updating test:', testId, data);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[updateTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[updateTest] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to update test');
  }

  return result;
}

/**
 * Delete a test
 */
export async function deleteTest(testId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[deleteTest] Deleting test:', testId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  console.log('[deleteTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[deleteTest] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to delete test');
  }

  return result;
}

/**
 * Add a task to a test (library task with overrides or custom task)
 */
export async function addTaskToTest(
  testId: string,
  data: AddTaskToTestRequest
): Promise<{
  success: boolean;
  message: string;
  testTask: any;
}> {
  const token = getAuthToken();

  console.log('[addTaskToTest] Adding task to test:', testId, data);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[addTaskToTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[addTaskToTest] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to add task to test');
  }

  return result;
}

/**
 * Update a task in a test
 */
export async function updateTestTask(
  testId: string,
  testTaskId: string,
  data: UpdateTestTaskRequest
): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[updateTestTask] Updating test task:', testId, testTaskId, data);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/tasks/${testTaskId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[updateTestTask] Response status:', response.status);

  if (!response.ok) {
    console.error('[updateTestTask] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to update test task');
  }

  return result;
}

/**
 * Remove a task from a test
 */
export async function deleteTestTask(testId: string, testTaskId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[deleteTestTask] Removing task from test:', testId, testTaskId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/tasks/${testTaskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  console.log('[deleteTestTask] Response status:', response.status);

  if (!response.ok) {
    console.error('[deleteTestTask] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to remove task from test');
  }

  return result;
}

/**
 * Reorder tasks in a test
 */
export async function reorderTestTasks(testId: string, data: ReorderTasksRequest): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[reorderTestTasks] Reordering tasks in test:', testId, data);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/tasks/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  console.log('[reorderTestTasks] Response status:', response.status);

  if (!response.ok) {
    console.error('[reorderTestTasks] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to reorder tasks');
  }

  return result;
}

/**
 * Publish or unpublish a test
 */
export async function publishTest(testId: string, isPublished: boolean): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[publishTest] Publishing test:', testId, isPublished);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isPublished }),
  });

  const result = await response.json();
  console.log('[publishTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[publishTest] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to publish test');
  }

  return result;
}

/**
 * Upload test PDF to Firebase Storage
 */
export async function uploadTestPDF(testId: string, pdfData: string, testTitle?: string): Promise<{
  success: boolean;
  message: string;
  pdfUrl: string;
}> {
  const token = getAuthToken();

  console.log('[uploadTestPDF] Uploading PDF for test:', testId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/upload-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pdfData, testTitle }),
  });

  const result = await response.json();
  console.log('[uploadTestPDF] Response status:', response.status);

  if (!response.ok) {
    console.error('[uploadTestPDF] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to upload PDF');
  }

  return result;
}

/**
 * Update PDF URL for a test
 */
export async function updateTestPdfUrl(testId: string, pdfUrl: string): Promise<{
  success: boolean;
  message: string;
}> {
  const token = getAuthToken();

  console.log('[updateTestPdfUrl] Updating PDF URL for test:', testId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/pdf`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pdfUrl }),
  });

  const result = await response.json();
  console.log('[updateTestPdfUrl] Response status:', response.status);

  if (!response.ok) {
    console.error('[updateTestPdfUrl] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to update PDF URL');
  }

  return result;
}

/**
 * Publish test to public collection (creates snapshot with public link)
 */
export async function publishTestToPublic(testId: string): Promise<{
  success: boolean;
  message: string;
  publicLink: string;
  publicId: string;
}> {
  const token = getAuthToken();

  console.log('[publishTestToPublic] Publishing test to public:', testId);

  const response = await fetch(`${API_BASE_URL}/api/v2/tests/${testId}/publish-public`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  console.log('[publishTestToPublic] Response status:', response.status);

  if (!response.ok) {
    console.error('[publishTestToPublic] Error response:', result);
    throw new Error(result.message || result.error || 'Failed to publish test to public');
  }

  return result;
}

/**
 * Browse published tests with filters and pagination (no authentication required)
 */
export async function fetchPublishedTests(params?: {
  country?: string;
  subject?: string;
  gradeLevel?: string;
  search?: string;
  sort?: 'recent' | 'views' | 'downloads';
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  tests: PublishedTest[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}> {
  const queryParams = new URLSearchParams();
  if (params?.country) queryParams.append('country', params.country);
  if (params?.subject) queryParams.append('subject', params.subject);
  if (params?.gradeLevel) queryParams.append('gradeLevel', params.gradeLevel);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/api/v2/published-tests${queryString ? `?${queryString}` : ''}`;

  console.log('[fetchPublishedTests] Fetching from URL:', url);

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('[fetchPublishedTests] Response status:', response.status);

  if (!response.ok) {
    console.error('[fetchPublishedTests] Error response:', data);
    throw new Error(data.message || data.error || 'Failed to fetch published tests');
  }

  return data;
}

/**
 * Fetch a published test by public ID (no authentication required)
 */
export async function fetchPublishedTest(publicId: string): Promise<{
  success: boolean;
  test: PublishedTest;
}> {
  console.log('[fetchPublishedTest] Fetching published test:', publicId);

  const response = await fetch(`${API_BASE_URL}/api/v2/published-tests/${publicId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  console.log('[fetchPublishedTest] Response status:', response.status);

  if (!response.ok) {
    console.error('[fetchPublishedTest] Error response:', data);
    throw new Error(data.message || data.error || 'Failed to fetch published test');
  }

  return data;
}
