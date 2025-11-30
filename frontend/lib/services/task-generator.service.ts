/**
 * Multi-step Task Generation Service
 * Handles the complete task generation workflow with validation
 */

import { TaskGeneratorRequest } from '@/types/task';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface TaskGenerationStep {
  step: 'generating_variations' | 'selecting_best' | 'generating_images' | 'generating_solution' | 'completed';
  message: string;
  progress: number; // 0-100
}

export interface GeneratedTaskText {
  title: string;
  story_text: string;
  questions: string[];
  metadata: any;
}

export interface TaskSelectionResult {
  selected_index: number; // 0, 1, or 2
  selected_task: GeneratedTaskText;
  reasoning: string;
  scores: {
    task_1: number;
    task_2: number;
    task_3: number;
  };
}

export interface GeneratedSolution {
  solution_steps: any[];
  final_answer: string;
  verification: string;
  common_mistakes: string[];
}

export interface GeneratedImages {
  images: Array<{
    id: string;
    url: string;
  }>;
}

/**
 * Step 1: Generate 3 task variations in parallel
 */
export async function generateTaskVariations(
  request: TaskGeneratorRequest,
  token: string,
  onProgress?: (step: TaskGenerationStep) => void
): Promise<GeneratedTaskText[]> {
  onProgress?.({
    step: 'generating_variations',
    message: '3 feladat változat generálása párhuzamosan...',
    progress: 10,
  });

  // Generate 3 variations in parallel
  const promises = Array.from({ length: 3 }, (_, index) =>
    fetch(`${API_BASE_URL}/generate-task-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...request,
        step: 'task_text_only',
        variation_index: index + 1, // Send 1, 2, 3 to backend for variation
      }),
    }).then(async (response) => {
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to generate task variation ${index + 1}`);
      }
      const result = await response.json();
      return result.task_data || result;
    })
  );

  const variations = await Promise.all(promises);

  onProgress?.({
    step: 'generating_variations',
    message: '3 feladat változat sikeresen generálva!',
    progress: 30,
  });

  return variations;
}

/**
 * Step 2: AI selects the best task from 3 variations
 */
export async function selectBestTask(
  variations: GeneratedTaskText[],
  request: TaskGeneratorRequest,
  token: string,
  onProgress?: (step: TaskGenerationStep) => void
): Promise<TaskSelectionResult> {
  onProgress?.({
    step: 'selecting_best',
    message: 'AI kiválasztja a legjobb változatot...',
    progress: 40,
  });

  const response = await fetch(`${API_BASE_URL}/select-best-task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      task_variations: variations,
      criteria: {
        curriculum_path: request.curriculum_path,
        difficulty_level: request.difficulty_level,
        educational_model: request.educational_model,
        target_group: request.target_group,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to select best task');
  }

  const result = await response.json();

  onProgress?.({
    step: 'selecting_best',
    message: `Legjobb változat kiválasztva (${result.selected_index + 1}. változat)!`,
    progress: 50,
  });

  return result.selection || result;
}

/**
 * Step 3: Generate images for the task
 */
export async function generateTaskImages(
  taskText: GeneratedTaskText,
  numberOfImages: number,
  token: string,
  onProgress?: (step: TaskGenerationStep) => void
): Promise<GeneratedImages> {
  onProgress?.({
    step: 'generating_images',
    message: `${numberOfImages} kép generálása...`,
    progress: 60,
  });

  // Check if image generation is disabled via environment variable
  if (process.env.NEXT_PUBLIC_DISABLE_IMAGE_GENERATION === 'true') {
    console.log('[Task Generator] Image generation disabled via NEXT_PUBLIC_DISABLE_IMAGE_GENERATION');
    return { images: [] };
  }

  if (numberOfImages === 0) {
    return { images: [] };
  }

  const response = await fetch(`${API_BASE_URL}/generate-task-images`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      task_text: taskText,
      number_of_images: numberOfImages,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate images');
  }

  const result = await response.json();
  return result;
}

/**
 * Step 4: Generate solution for the task
 */
export async function generateTaskSolution(
  taskText: GeneratedTaskText,
  request: TaskGeneratorRequest,
  token: string,
  onProgress?: (step: TaskGenerationStep) => void
): Promise<GeneratedSolution> {
  onProgress?.({
    step: 'generating_solution',
    message: 'Megoldás generálása...',
    progress: 80,
  });

  const response = await fetch(`${API_BASE_URL}/generate-task-solution`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      task_text: taskText,
      precision_settings: request.precision_settings,
      educational_model: request.educational_model,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate solution');
  }

  const result = await response.json();
  return result.solution_data || result;
}

/**
 * Complete multi-step task generation workflow
 * New approach: Generate 3 variations in parallel, then AI picks the best one
 */
export async function generateTaskComplete(
  request: TaskGeneratorRequest,
  token: string,
  onProgress?: (step: TaskGenerationStep) => void
): Promise<{
  taskText: GeneratedTaskText;
  solution: GeneratedSolution;
  images: GeneratedImages;
  taskId: string;
  selectionInfo?: TaskSelectionResult;
}> {
  console.log('[Task Generator] Starting multi-step task generation with 3 variations');

  // Step 1: Generate 3 task variations in parallel
  const variations = await generateTaskVariations(request, token, onProgress);
  console.log('[Task Generator] Generated 3 task variations:', variations);

  // Step 2: AI selects the best task from the 3 variations
  const selectionResult = await selectBestTask(variations, request, token, onProgress);
  console.log('[Task Generator] AI selected best task:', selectionResult);

  const selectedTask = selectionResult.selected_task;

  // Steps 3 & 4: Generate images and solution in parallel (for efficiency)
  onProgress?.({
    step: 'generating_images',
    message: 'Képek és megoldás generálása...',
    progress: 60,
  });

  const [images, solution] = await Promise.all([
    generateTaskImages(selectedTask, request.number_of_images, token, onProgress),
    generateTaskSolution(selectedTask, request, token, onProgress),
  ]);

  onProgress?.({
    step: 'completed',
    message: 'Feladat sikeresen elkészült!',
    progress: 100,
  });

  // Generate task ID
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    taskText: selectedTask,
    solution,
    images,
    taskId,
    selectionInfo: selectionResult,
  };
}
