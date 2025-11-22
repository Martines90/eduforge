import * as crypto from "crypto";

/**
 * Generates a random 32-character hexadecimal string
 * @returns A random 32-character string
 */
export function generateRandomId(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Generates a task ID with prefix
 * @returns A task ID in format: task_[32_char_random_string]
 */
export function generateTaskId(): string {
  return `task_${generateRandomId()}`;
}

/**
 * Generates an image ID with prefix
 * @returns An image ID in format: image_[32_char_random_string]
 */
export function generateImageId(): string {
  return `image_${generateRandomId()}`;
}
