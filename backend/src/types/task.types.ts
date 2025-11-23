// Legacy types - kept for backward compatibility with storage service
export interface LegacyTaskImage {
  id: string;
  url: string;
}

export interface LegacyTask {
  id: string;
  description: string;
  images: LegacyTaskImage[];
}

// TaskGenerationResult is now defined in task-generator.types.ts
// Re-export it for backward compatibility
export type { TaskGenerationResult } from "./task-generator.types";
