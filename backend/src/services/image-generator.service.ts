import { config } from "../config";
import { ImageOptions, ImageResult, ImageSize, ImageQuality } from "../types";
import { AIProviderFactory, ImageGenerationRequest } from "./ai-providers";

export class ImageGeneratorService {
  constructor() {
    // Provider is initialized in index.ts, we just use the factory
  }

  async generate(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageResult> {
    const {
      size = "1024x1024",
      quality = "standard",
      style = "vivid",
    } = options;

    console.log(`🎨 Generating image (${size}, ${quality})...`);

    const provider = AIProviderFactory.getImageProvider();

    const request: ImageGenerationRequest = {
      prompt,
      size,
      quality,
      style,
    };

    const response = await provider.generateImage!(request);

    const cost = this.calculateCost(size, quality);
    const filename = this.generateFilename();

    console.log(`✅ Image generated ($${cost.toFixed(4)})\n`);

    return { url: response.url, filename, cost };
  }

  private calculateCost(size: ImageSize, quality: ImageQuality): number {
    const pricing: Record<ImageQuality, Record<ImageSize, number>> = {
      standard: {
        "1024x1024": 0.04,
        "1792x1024": 0.08,
        "1024x1792": 0.08,
      },
      hd: {
        "1024x1024": 0.08,
        "1792x1024": 0.12,
        "1024x1792": 0.12,
      },
    };

    return pricing[quality][size];
  }

  private generateFilename(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    return `image-${timestamp}.png`;
  }
}
