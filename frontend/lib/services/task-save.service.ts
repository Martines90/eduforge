/**
 * Task Save Service
 * Handles saving generated tasks to the database
 *
 * IMPORTANT: Backend must store tasks using country-based structure:
 * countries/{country_code}/tasks/{task_id}
 *
 * See DATABASE_STRUCTURE.md for complete details.
 */

import { API_BASE_URL } from './api.service';

export interface SaveTaskRequest {
  task_id: string;
  task_data: any;
  curriculum_path: string;
  country_code: string;
  created_by?: string;
}

export interface SaveTaskResponse {
  success: boolean;
  message: string;
  task_id: string;
  public_share_link: string;
}

/**
 * Save a generated task to the database
 */
export async function saveTask(
  request: SaveTaskRequest,
  firebaseToken: string
): Promise<SaveTaskResponse> {
  try {
    const endpoint = `${API_BASE_URL}/save-task`;
    console.log('[Task Save Service] Saving task:', request.task_id);
    console.log('[Task Save Service] API endpoint:', endpoint);
    console.log('[Task Save Service] Request data:', {
      ...request,
      task_data: '...', // Don't log full task data
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify(request),
    });

    console.log('[Task Save Service] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Task Save Service] Error response:', errorData);
      throw new Error(errorData.message || `Failed to save task: ${response.statusText}`);
    }

    const data: SaveTaskResponse = await response.json();
    console.log('[Task Save Service] Task saved successfully:', data.task_id);

    return data;
  } catch (error) {
    console.error('[Task Save Service] Error saving task:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
    }
    throw error;
  }
}
