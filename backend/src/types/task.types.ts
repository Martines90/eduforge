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

export interface TaskGenerationResult {
  taskId: string;
  storagePath: string;
  generatedTask: import("./task-generator.types").GeneratedTask;
}
