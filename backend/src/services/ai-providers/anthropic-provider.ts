/**
 * Anthropic (Claude) Provider Implementation
 * Handles text completion using Anthropic's Claude API
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  IAIProvider,
  AICompletionRequest,
  AICompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./base-provider.interface";

export class AnthropicProvider implements IAIProvider {
  public readonly providerName = "anthropic";
  public readonly defaultModel: string;
  private client: Anthropic;

  constructor(apiKey: string, defaultModel: string) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }

    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;

    console.log(`✅ Anthropic Provider initialized`);
    console.log(`   Default model: ${this.defaultModel}`);
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    const model = request.model || this.defaultModel;

    try {
      console.log(`🤖 [Anthropic] Generating completion with model: ${model}`);

      // Anthropic uses a different message format
      // System messages go in a separate parameter
      const systemMessage = request.messages.find((m) => m.role === "system");
      const conversationMessages = request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await this.client.messages.create({
        model: model,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages,
      });

      // Extract text content from response
      const textContent = response.content.find((block) => block.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("Anthropic returned no text content");
      }

      return {
        content: textContent.text,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || undefined,
      };
    } catch (error: any) {
      console.error("❌ [Anthropic] Error generating completion:", error);
      throw new Error(`Anthropic API error: ${error.message}`);
    }
  }

  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    throw new Error("Anthropic does not support image generation. Use OpenAI for images.");
  }

  supportsImageGeneration(): boolean {
    return false;
  }
}
