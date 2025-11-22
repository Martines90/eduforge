import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming } from "openai/resources/chat/completions";
import { config } from "../config";
import { TextOptions, TextResult } from "../types";

export class TextGeneratorService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async generate(
    prompt: string,
    options: TextOptions = {}
  ): Promise<TextResult> {
    const { temperature = 0.8, maxTokens = 2000 } = options;

    console.log("🤖 Generating text...");

    const params: ChatCompletionCreateParamsNonStreaming = {
      model: config.textModel,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
    };

    const response = await this.client.chat.completions.create(params);

    const messageContent = response.choices[0]?.message?.content;
    if (!messageContent) {
      throw new Error("No content in response");
    }

    const promptTokens = response.usage?.prompt_tokens ?? 0;
    const completionTokens = response.usage?.completion_tokens ?? 0;
    const totalTokens = response.usage?.total_tokens ?? 0;

    const cost = this.calculateCost(promptTokens, completionTokens);

    console.log(`✅ Generated ${totalTokens} tokens ($${cost.toFixed(4)})\n`);

    return {
      text: messageContent,
      tokens: totalTokens,
      cost,
    };
  }

  private calculateCost(
    promptTokens: number,
    completionTokens: number
  ): number {
    // GPT-4o pricing: $2.50 per 1M input, $10 per 1M output
    const inputCost = (promptTokens / 1_000_000) * 2.5;
    const outputCost = (completionTokens / 1_000_000) * 10.0;
    return inputCost + outputCost;
  }
}
