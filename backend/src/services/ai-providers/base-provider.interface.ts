/**
 * Base AI Provider Interface
 * Defines the contract that all AI providers must implement
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string; // Override default model for this request
}

export interface AICompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  size?: string;
  quality?: string;
  style?: string;
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
}

/**
 * Base interface for AI providers
 */
export interface IAIProvider {
  /**
   * Provider name (e.g., 'openai', 'anthropic')
   */
  readonly providerName: string;

  /**
   * Default model for text completions
   */
  readonly defaultModel: string;

  /**
   * Generate text completion
   */
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;

  /**
   * Generate image (optional - not all providers support this)
   */
  generateImage?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;

  /**
   * Check if provider supports image generation
   */
  supportsImageGeneration(): boolean;
}
