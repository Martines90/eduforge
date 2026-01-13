import { CountryCode } from './i18n';
import { EducationalModel } from '@/lib/context/UserContext';
import { DifficultyLevel } from '@/lib/data/difficulty-levels';

export type TargetGroup = 'boys' | 'girls' | 'mixed';
export type DisplayTemplate = 'classic' | 'modern' | 'comic' | 'minimal' | 'illustrated';

export interface PrecisionSettings {
  constant_precision: number;
  intermediate_precision: number;
  final_answer_precision: number;
  use_exact_values: boolean;
}

export interface TaskGeneratorRequest {
  curriculum_path: string;
  country_code: CountryCode;
  target_group: TargetGroup;
  difficulty_level: DifficultyLevel;
  educational_model: EducationalModel;
  display_template: DisplayTemplate;
  precision_settings: PrecisionSettings;
  custom_keywords?: string[];
  template_id?: string;
}

export interface TaskImage {
  id: string;
  url: string;
}

export interface GeneratedTask {
  id: string;
  description: string;
  solution: string;
  images: TaskImage[];
}

export interface TaskGeneratorResponse {
  success: boolean;
  task?: GeneratedTask;
  error?: string;
  message?: string;
}
