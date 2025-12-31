import { TextOptions, TextResult } from "../types";
import { AIProviderFactory, AICompletionRequest } from "./ai-providers";

export class TextGeneratorService {
  constructor() {
    // Provider is initialized in index.ts, we just use the factory
  }

  async generate(
    prompt: string,
    options: TextOptions = {}
  ): Promise<TextResult> {
    const { temperature = 0.8, maxTokens = 2000 } = options;

    console.log("🤖 Generating text...");

    const provider = AIProviderFactory.getTextProvider();

    const request: AICompletionRequest = {
      messages: [{ role: "user", content: prompt }],
      temperature,
      maxTokens,
    };

    const response = await provider.generateCompletion(request);

    const promptTokens = response.usage?.promptTokens ?? 0;
    const completionTokens = response.usage?.completionTokens ?? 0;
    const totalTokens = response.usage?.totalTokens ?? 0;

    const cost = this.calculateCost(
      promptTokens,
      completionTokens,
      response.model
    );

    console.log(`✅ Generated ${totalTokens} tokens ($${cost.toFixed(4)})\n`);

    return {
      text: response.content,
      tokens: totalTokens,
      cost,
    };
  }

  /**
   * Generate text with separate system and user prompts
   */
  async generateWithSystemPrompt(
    systemPrompt: string,
    userPrompt: string,
    options: TextOptions = {}
  ): Promise<TextResult> {
    const { temperature = 0.8, maxTokens = 2000 } = options;

    console.log("🤖 Generating text with system prompt...");

    const provider = AIProviderFactory.getTextProvider();

    const request: AICompletionRequest = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      maxTokens,
    };

    const response = await provider.generateCompletion(request);

    const promptTokens = response.usage?.promptTokens ?? 0;
    const completionTokens = response.usage?.completionTokens ?? 0;
    const totalTokens = response.usage?.totalTokens ?? 0;

    const cost = this.calculateCost(
      promptTokens,
      completionTokens,
      response.model
    );

    console.log(`✅ Generated ${totalTokens} tokens ($${cost.toFixed(4)})\n`);

    return {
      text: response.content,
      tokens: totalTokens,
      cost,
    };
  }

  private calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    // Pricing per 1M tokens (input/output)
    const pricing: Record<string, { input: number; output: number }> = {
      // OpenAI models
      "gpt-4o": { input: 2.5, output: 10.0 },
      "gpt-4o-mini": { input: 0.15, output: 0.6 },
      "gpt-4": { input: 30.0, output: 60.0 },
      "gpt-4-turbo": { input: 10.0, output: 30.0 },
      o1: { input: 15.0, output: 60.0 },
      "o1-mini": { input: 3.0, output: 12.0 },
      "o3-mini": { input: 1.1, output: 4.4 },

      // Anthropic/Claude models
      "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
      "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0 },
      "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
      "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
      "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
    };

    // Get pricing for this model (default to GPT-4o if unknown)
    const modelPricing = pricing[model] || pricing["gpt-4o"];

    const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (completionTokens / 1_000_000) * modelPricing.output;
    return inputCost + outputCost;
  }
}
