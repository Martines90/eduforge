/**
 * Shared Types Index
 * Export all shared types for easy importing
 */

export * from './database.types';
export * from './subjects';
export * from './countries';
export * from './grades';
export * from './user.types';

/**
 * Task Generation Constants and Config
 */
export const DEFAULT_NUMBER_OF_IMAGES = 1 as const;
export * from '../config/task-generation.config';
