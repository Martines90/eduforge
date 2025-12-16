/**
 * FLUX Provider Implementation
 * Handles image generation using Black Forest Labs FLUX API
 */

import axios, { AxiosInstance } from "axios";
import {
  IAIProvider,
  AICompletionRequest,
  AICompletionResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "./base-provider.interface";

interface FluxGenerateResponse {
  id: string;
  polling_url?: string;
}

interface FluxResultResponse {
  id: string;
  status: "Ready" | "Pending" | "Error" | "Request Moderated" | "Content Moderated";
  result?: {
    sample: string; // Image URL
  };
  error?: string;
}

export class FluxProvider implements IAIProvider {
  public readonly providerName = "flux";
  public readonly defaultModel: string;
  private client: AxiosInstance;
  private apiKey: string;
  private endpoint: string;
  private maxPollingAttempts = 60; // Max 60 attempts (5 minutes with 5s intervals)
  private pollingInterval = 5000; // 5 seconds

  constructor(
    apiKey: string,
    model: string = "flux-2-pro",
    endpoint: string = "https://api.bfl.ai/v1"
  ) {
    if (!apiKey) {
      throw new Error("FLUX API key is required");
    }

    this.apiKey = apiKey;
    this.defaultModel = model;
    this.endpoint = endpoint;

    this.client = axios.create({
      baseURL: endpoint,
      headers: {
        "x-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    console.log(`✅ FLUX Provider initialized`);
    console.log(`   Model: ${this.defaultModel}`);
    console.log(`   Endpoint: ${this.endpoint}`);
  }

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    throw new Error(
      "FLUX provider does not support text completion. Use for image generation only."
    );
  }

  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      console.log(`🎨 [FLUX] Generating image with ${this.defaultModel}`);
      console.log(`   Prompt: ${request.prompt.substring(0, 100)}...`);

      // Convert size to aspect ratio
      const aspectRatio = this.convertSizeToAspectRatio(request.size || "1024x1024");

      // Step 1: Submit generation request
      const generateResponse = await this.client.post<FluxGenerateResponse>(
        `/${this.defaultModel}`,
        {
          prompt: request.prompt,
          aspect_ratio: aspectRatio,
        }
      );

      const { id, polling_url } = generateResponse.data;

      if (!id) {
        throw new Error("FLUX API did not return a request ID");
      }

      console.log(`   Request ID: ${id}`);
      console.log(`   Polling for result...`);

      // Step 2: Poll for result
      const imageUrl = await this.pollForResult(id, polling_url);

      console.log(`✅ [FLUX] Image generated successfully`);

      return {
        url: imageUrl,
        revisedPrompt: request.prompt,
      };
    } catch (error: any) {
      console.error("❌ [FLUX] Error generating image:", error);

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 429) {
          throw new Error("FLUX API rate limit exceeded (24 active tasks max). Please try again later.");
        }

        throw new Error(
          `FLUX API error (${status}): ${data?.error || error.message}`
        );
      }

      throw new Error(`FLUX API error: ${error.message}`);
    }
  }

  private async pollForResult(requestId: string, pollingUrl?: string): Promise<string> {
    const url = pollingUrl || `/get_result?id=${requestId}`;

    for (let attempt = 1; attempt <= this.maxPollingAttempts; attempt++) {
      try {
        const response = await this.client.get<FluxResultResponse>(url);
        const { status, result, error } = response.data;

        console.log(`   Polling attempt ${attempt}/${this.maxPollingAttempts}: ${status}`);

        if (status === "Ready" && result?.sample) {
          return result.sample;
        }

        if (status === "Error") {
          throw new Error(`FLUX generation failed: ${error || "Unknown error"}`);
        }

        if (status === "Request Moderated" || status === "Content Moderated") {
          throw new Error(
            `FLUX generation was moderated: ${error || "Content policy violation"}`
          );
        }

        // Still pending, wait before next attempt
        if (status === "Pending") {
          await this.sleep(this.pollingInterval);
          continue;
        }

        // Unknown status
        throw new Error(`Unknown FLUX status: ${status}`);
      } catch (error: any) {
        if (error.message.includes("FLUX generation")) {
          throw error; // Re-throw our custom errors
        }

        // If it's a network error and we have attempts left, retry
        if (attempt < this.maxPollingAttempts) {
          console.warn(`   Polling error, retrying... (${error.message})`);
          await this.sleep(this.pollingInterval);
          continue;
        }

        throw new Error(`Failed to poll FLUX result: ${error.message}`);
      }
    }

    throw new Error("FLUX generation timed out after maximum polling attempts");
  }

  private convertSizeToAspectRatio(size: string): string {
    // Map common sizes to aspect ratios
    const sizeMap: Record<string, string> = {
      "1024x1024": "1:1",
      "1792x1024": "16:9",
      "1024x1792": "9:16",
      "512x512": "1:1",
      "768x768": "1:1",
    };

    if (sizeMap[size]) {
      return sizeMap[size];
    }

    // Parse width and height
    const [width, height] = size.split("x").map(Number);

    if (isNaN(width) || isNaN(height)) {
      console.warn(`⚠️  Invalid size format "${size}", using default 1:1`);
      return "1:1";
    }

    // Calculate aspect ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const ratioWidth = width / divisor;
    const ratioHeight = height / divisor;

    return `${ratioWidth}:${ratioHeight}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  supportsImageGeneration(): boolean {
    return true;
  }
}
