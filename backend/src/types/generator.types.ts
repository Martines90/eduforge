export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";
export type ImageQuality = "standard" | "hd";
export type ImageStyle = "vivid" | "natural";

export interface TextOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface TextResult {
  text: string;
  tokens: number;
  cost: number;
}

export interface ImageOptions {
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
}

export interface ImageResult {
  url: string;
  filename: string;
  cost: number;
}

/**
 * Weight configuration for weighted random selection
 * Maps item IDs to their weights (higher = more likely to be selected)
 * Special key "_other" is used for items without specific weights
 */
export interface WeightCategory {
  [key: string]: number;
}
