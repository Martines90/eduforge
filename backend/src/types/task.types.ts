export interface TaskImage {
  id: string;
  url: string;
}

export interface Task {
  id: string;
  description: string;
  images: TaskImage[];
}

export interface TaskGenerationResult {
  task: Task;
  storagePath: string;
}
