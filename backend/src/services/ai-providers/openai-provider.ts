/**
 * OpenAI Provider Implementation
 * Handles text completion and image generation using OpenAI's API
 */

import OpenAI from "openai";
import {
  IAIProvider,
  AICompletionRequest,
  AICompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./base-provider.interface";

export class OpenAIProvider implements IAIProvider {
  public readonly providerName = "openai";
  public readonly defaultModel: string;
  private client: OpenAI;
  private imageModel: string;

  constructor(
    apiKey: string,
    defaultModel: string,
    imageModel: string = "dall-e-3"
  ) {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
    this.imageModel = imageModel;

    console.log(`✅ OpenAI Provider initialized`);
    console.log(`   Default text model: ${this.defaultModel}`);
    console.log(`   Image model: ${this.imageModel}`);
  }

  async generateCompletion(
    request: AICompletionRequest
  ): Promise<AICompletionResponse> {
    const model = request.model || this.defaultModel;

    try {
      console.log(`🤖 [OpenAI] Generating completion with model: ${model}`);

      const response = await this.client.chat.completions.create({
        model: model,
        messages: request.messages as any,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error("OpenAI returned an empty response");
      }

      return {
        content: choice.message.content,
        model: response.model,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason || undefined,
      };
    } catch (error: any) {
      console.error("❌ [OpenAI] Error generating completion:", error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    try {
      console.log(`🎨 [OpenAI] Generating image with DALL-E-3`);
      console.log(`   Prompt: ${request.prompt.substring(0, 100)}...`);

      const response = await this.client.images.generate({
        model: this.imageModel,
        prompt: request.prompt,
        size: (request.size as any) || "1024x1024",
        quality: (request.quality as any) || "standard",
        style: (request.style as any) || "natural",
        n: 1,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("OpenAI returned no image data");
      }

      const image = response.data[0];
      if (!image || !image.url) {
        throw new Error("OpenAI returned no image URL");
      }

      return {
        url: image.url,
        revisedPrompt: image.revised_prompt,
      };
    } catch (error: any) {
      console.error("❌ [OpenAI] Error generating image:", error);
      throw new Error(`OpenAI Image API error: ${error.message}`);
    }
  }

  supportsImageGeneration(): boolean {
    return true;
  }
}
