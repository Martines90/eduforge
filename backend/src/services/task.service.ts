/**
 * Task Service
 * Handles CRUD operations for educational tasks
 */

import { getFirestore } from '../config/firebase.config';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
  TaskDocument,
  TaskRatingDocument,
  CreateTaskRequest,
  UpdateTaskRequest,
  GetTasksQuery,
  GetTasksResponse,
  SubmitRatingRequest,
} from '../types/task.types';
import {
  getSubjectMappingById,
  validateLeafMapping,
  incrementTaskCount,
  decrementTaskCount,
} from './subject-mapping.service';
import { getUserById } from './auth.service';

/**
 * Create a new task
 */
export async function createTask(
  creatorUid: string,
  data: CreateTaskRequest
): Promise<string> {
  const db = getFirestore();

  // Validate that the creator is a teacher
  const creator = await getUserById(creatorUid);
  if (!creator || creator.role !== 'teacher') {
    throw new Error('Only teachers can create tasks');
  }

  // TODO: Get country from request or user profile
  // For now, defaulting to 'HU' for backward compatibility
  const country = data.country_code || 'HU';

  // Validate that the subject mapping exists and is a leaf node
  await validateLeafMapping(country, data.subjectMappingId);

  // Get the subject mapping details
  const mapping = await getSubjectMappingById(country, data.subjectMappingId);
  if (!mapping) {
    throw new Error('Subject mapping not found');
  }

  // Create task document
  const taskDoc: TaskDocument = {
    title: data.title,
    description: data.description,
    content: data.content,
    subjectMappingId: data.subjectMappingId,
    subjectMappingPath: mapping.path,
    subject: mapping.subject,
    gradeLevel: mapping.gradeLevel,
    schoolSystem: data.schoolSystem || 'Magyar NAT',
    difficultyLevel: data.difficultyLevel,
    estimatedDurationMinutes: data.estimatedDurationMinutes,
    tags: data.tags || [],
    ratingAverage: 0,
    ratingCount: 0,
    viewCount: 0,
    completionCount: 0,
    createdBy: creatorUid,
    creatorName: creator.name,
    isPublished: data.isPublished || false,
    publishedAt: data.isPublished ? Timestamp.now() : undefined,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Insert into Firestore
  const docRef = await db.collection('tasks').add(taskDoc);

  // Increment task count on the mapping if published
  if (taskDoc.isPublished) {
    await incrementTaskCount(country, data.subjectMappingId);
  }

  return docRef.id;
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  creatorUid: string,
  data: UpdateTaskRequest
): Promise<void> {
  const db = getFirestore();
  const taskRef = db.collection('tasks').doc(taskId);

  // Get existing task
  const taskDoc = await taskRef.get();
  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }

  const existingTask = taskDoc.data() as TaskDocument;

  // Check ownership
  if (existingTask.createdBy !== creatorUid) {
    throw new Error('You can only update your own tasks');
  }

  // Track if publishing status changed
  const wasPublished = existingTask.isPublished;
  const willBePublished = data.isPublished !== undefined ? data.isPublished : wasPublished;

  // Build update object
  const updateData: Partial<TaskDocument> = {
    ...data,
    updatedAt: Timestamp.now(),
  };

  // Set publishedAt if publishing for the first time
  if (!wasPublished && willBePublished) {
    updateData.publishedAt = Timestamp.now();
  }

  // Update task
  await taskRef.update(updateData);

  // Update task count on mapping if publishing status changed
  // TODO: Get country from task document or request
  const country = 'HU'; // Default for backward compatibility
  if (wasPublished !== willBePublished) {
    if (willBePublished) {
      await incrementTaskCount(country, existingTask.subjectMappingId);
    } else {
      await decrementTaskCount(country, existingTask.subjectMappingId);
    }
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string, creatorUid: string): Promise<void> {
  const db = getFirestore();
  const taskRef = db.collection('tasks').doc(taskId);

  // Get existing task
  const taskDoc = await taskRef.get();
  if (!taskDoc.exists) {
    throw new Error('Task not found');
  }

  const existingTask = taskDoc.data() as TaskDocument;

  // Check ownership
  if (existingTask.createdBy !== creatorUid) {
    throw new Error('You can only delete your own tasks');
  }

  // Delete the task
  await taskRef.delete();

  // Decrement task count if was published
  // TODO: Get country from task document
  const country = 'HU'; // Default for backward compatibility
  if (existingTask.isPublished) {
    await decrementTaskCount(country, existingTask.subjectMappingId);
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(
  taskId: string,
  incrementViews: boolean = false
): Promise<(TaskDocument & { id: string }) | null> {
  const db = getFirestore();
  const taskDoc = await db.collection('tasks').doc(taskId).get();

  if (!taskDoc.exists) {
    return null;
  }

  // Increment view count if requested
  if (incrementViews) {
    await db
      .collection('tasks')
      .doc(taskId)
      .update({
        viewCount: FieldValue.increment(1),
      });
  }

  return {
    id: taskDoc.id,
    ...(taskDoc.data() as TaskDocument),
  };
}

/**
 * Get tasks with filtering and pagination
 */
export async function getTasks(query: GetTasksQuery): Promise<GetTasksResponse> {
  const db = getFirestore();
  let firestoreQuery: any = db.collection('tasks');

  console.log('[getTasks] Query parameters:', JSON.stringify(query, null, 2));

  // DEBUG: List ALL documents in the collection first
  const allDocsSnapshot = await db.collection('tasks').limit(5).get();
  console.log('[getTasks] Total documents in collection:', allDocsSnapshot.size);
  allDocsSnapshot.docs.forEach((doc: any) => {
    const data = doc.data();
    console.log('[getTasks] Sample doc:', {
      id: doc.id,
      curriculum_path: data.curriculum_path,
      isPublished: data.isPublished,
    });
  });

  // Apply filters
  // TEMPORARY FIX: Only filter by curriculum_path without additional filters/sorting
  // to avoid index requirements until indexes are fully built
  if (query.curriculum_path) {
    // Filter by full curriculum path (preferred method)
    console.log('[getTasks] Filtering by curriculum_path:', query.curriculum_path);
    firestoreQuery = firestoreQuery.where('curriculum_path', '==', query.curriculum_path);

    // Get all matching documents without sorting (to avoid composite index requirement)
    console.log('[getTasks] About to execute query (no sorting)...');
    const snapshot = await firestoreQuery.get();
    console.log('[getTasks] Query returned:', snapshot.size, 'documents');

    let tasks = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as TaskDocument),
    }));

    // Apply filters in-memory
    if (query.isPublished !== undefined) {
      tasks = tasks.filter((t: any) => t.isPublished === query.isPublished);
    }
    if (query.difficultyLevel) {
      tasks = tasks.filter((t: any) => t.difficultyLevel === query.difficultyLevel);
    }
    if (query.createdBy) {
      tasks = tasks.filter((t: any) => t.createdBy === query.createdBy);
    }

    // Sort in-memory
    const sort = query.sort || 'recent';
    switch (sort) {
      case 'rating':
        tasks.sort((a: any, b: any) => {
          if (b.ratingAverage !== a.ratingAverage) return b.ratingAverage - a.ratingAverage;
          return b.ratingCount - a.ratingCount;
        });
        break;
      case 'views':
        tasks.sort((a: any, b: any) => b.viewCount - a.viewCount);
        break;
      case 'popular':
        tasks.sort((a: any, b: any) => b.completionCount - a.completionCount);
        break;
      case 'recent':
      default:
        tasks.sort((a: any, b: any) => {
          const aTime = (a.createdAt as any).toMillis ? (a.createdAt as any).toMillis() : new Date(a.createdAt as any).getTime();
          const bTime = (b.createdAt as any).toMillis ? (b.createdAt as any).toMillis() : new Date(b.createdAt as any).getTime();
          return bTime - aTime;
        });
        break;
    }

    const total = tasks.length;
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const paginatedTasks = tasks.slice(offset, offset + limit);

    console.log('[getTasks] Returning', paginatedTasks.length, 'tasks (total:', total, ')');

    return {
      tasks: paginatedTasks,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < total,
    };
  }

  // Legacy filtering (non-curriculum_path queries)
  if (query.subject) {
    firestoreQuery = firestoreQuery.where('subject', '==', query.subject);
  }

  if (query.gradeLevel) {
    firestoreQuery = firestoreQuery.where('gradeLevel', '==', query.gradeLevel);
  }

  if (query.subjectMappingId) {
    firestoreQuery = firestoreQuery.where('subjectMappingId', '==', query.subjectMappingId);
  }

  if (query.difficultyLevel) {
    firestoreQuery = firestoreQuery.where('difficultyLevel', '==', query.difficultyLevel);
  }

  if (query.createdBy) {
    firestoreQuery = firestoreQuery.where('createdBy', '==', query.createdBy);
  }

  if (query.isPublished !== undefined) {
    firestoreQuery = firestoreQuery.where('isPublished', '==', query.isPublished);
  }

  // Apply sorting
  const sort = query.sort || 'recent';
  switch (sort) {
    case 'rating':
      firestoreQuery = firestoreQuery.orderBy('ratingAverage', 'desc').orderBy('ratingCount', 'desc');
      break;
    case 'views':
      firestoreQuery = firestoreQuery.orderBy('viewCount', 'desc');
      break;
    case 'popular':
      firestoreQuery = firestoreQuery.orderBy('completionCount', 'desc');
      break;
    case 'recent':
    default:
      firestoreQuery = firestoreQuery.orderBy('createdAt', 'desc');
      break;
  }

  // Get total count (before pagination)
  console.log('[getTasks] About to execute count query...');
  const countSnapshot = await firestoreQuery.get();
  const total = countSnapshot.size;
  console.log('[getTasks] Count query returned:', total, 'documents');

  // Log all documents found
  if (total > 0) {
    countSnapshot.docs.forEach((doc: any, index: number) => {
      const data = doc.data();
      console.log(`[getTasks] Document ${index + 1}:`, {
        id: doc.id,
        curriculum_path: data.curriculum_path,
        isPublished: data.isPublished,
      });
    });
  }

  // Apply pagination
  const limit = query.limit || 20;
  const offset = query.offset || 0;

  firestoreQuery = firestoreQuery.limit(limit).offset(offset);

  // Execute query
  const snapshot = await firestoreQuery.get();

  const tasks = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...(doc.data() as TaskDocument),
  }));

  console.log('[getTasks] Found', tasks.length, 'tasks (total:', total, ')');
  if (tasks.length > 0) {
    console.log('[getTasks] First task curriculum_path:', tasks[0].curriculum_path);
  }

  return {
    tasks,
    total,
    page: Math.floor(offset / limit) + 1,
    limit,
    hasMore: offset + limit < total,
  };
}

/**
 * Submit or update a rating for a task
 */
export async function submitRating(
  taskId: string,
  userId: string,
  data: SubmitRatingRequest
): Promise<void> {
  const db = getFirestore();

  // Validate rating
  if (data.rating < 0 || data.rating > 5 || !Number.isInteger(data.rating)) {
    throw new Error('Rating must be an integer between 0 and 5');
  }

  const taskRef = db.collection('tasks').doc(taskId);
  const ratingRef = taskRef.collection('ratings').doc(userId);

  // Run in transaction to ensure atomic updates
  await db.runTransaction(async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    const existingRatingDoc = await transaction.get(ratingRef);

    if (!taskDoc.exists) {
      throw new Error('Task not found');
    }

    const taskData = taskDoc.data() as TaskDocument;
    let newRatingAverage = taskData.ratingAverage;
    let newRatingCount = taskData.ratingCount;

    if (existingRatingDoc.exists) {
      // Update existing rating
      const oldRating = existingRatingDoc.data()!.rating;
      const totalRating = taskData.ratingAverage * taskData.ratingCount;
      newRatingAverage = (totalRating - oldRating + data.rating) / taskData.ratingCount;
    } else {
      // New rating
      const totalRating = taskData.ratingAverage * taskData.ratingCount + data.rating;
      newRatingCount = taskData.ratingCount + 1;
      newRatingAverage = totalRating / newRatingCount;
    }

    // Round to 2 decimal places
    newRatingAverage = Math.round(newRatingAverage * 100) / 100;

    // Update rating document
    const ratingDoc: TaskRatingDocument = {
      userId,
      rating: data.rating,
      reviewText: data.reviewText,
      createdAt: existingRatingDoc.exists
        ? existingRatingDoc.data()!.createdAt
        : Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    transaction.set(ratingRef, ratingDoc);

    // Update task aggregates
    transaction.update(taskRef, {
      ratingAverage: newRatingAverage,
      ratingCount: newRatingCount,
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Get ratings for a task
 */
export async function getTaskRatings(
  taskId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  ratings: (TaskRatingDocument & { id: string })[];
  total: number;
}> {
  const db = getFirestore();

  const ratingsRef = db.collection('tasks').doc(taskId).collection('ratings');

  // Get total count
  const countSnapshot = await ratingsRef.get();
  const total = countSnapshot.size;

  // Get paginated ratings
  const snapshot = await ratingsRef
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();

  const ratings = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as TaskRatingDocument),
  }));

  return { ratings, total };
}

/**
 * Search tasks by title or description
 */
export async function searchTasks(
  searchText: string,
  filters: Partial<GetTasksQuery> = {}
): Promise<(TaskDocument & { id: string })[]> {
  const db = getFirestore();

  // Note: Firestore doesn't support full-text search natively
  // This is a simple implementation that gets all tasks and filters client-side
  // For production, consider using Algolia or Elasticsearch

  let query: any = db.collection('tasks').where('isPublished', '==', true);

  if (filters.subject) {
    query = query.where('subject', '==', filters.subject);
  }

  if (filters.gradeLevel) {
    query = query.where('gradeLevel', '==', filters.gradeLevel);
  }

  const snapshot = await query.get();

  const searchLower = searchText.toLowerCase();

  const tasks = snapshot.docs
    .map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as TaskDocument),
    }))
    .filter((task: TaskDocument & { id: string }) => {
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = task.description?.toLowerCase().includes(searchLower);
      const tagsMatch = task.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower));

      return titleMatch || descMatch || tagsMatch;
    });

  return tasks;
}
