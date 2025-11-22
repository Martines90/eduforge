import OpenAI from "openai";
import { config } from "../config";
import { ImageOptions, ImageResult, ImageSize, ImageQuality } from "../types";

export class ImageGeneratorService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: config.apiKey });
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

    const response = await this.client.images.generate({
      model: config.imageModel,
      prompt,
      size,
      quality,
      style,
      n: 1,
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No URL in response");
    }

    const cost = this.calculateCost(size, quality);
    const filename = this.generateFilename();

    console.log(`✅ Image generated ($${cost.toFixed(4)})\n`);

    return { url: imageUrl, filename, cost };
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
