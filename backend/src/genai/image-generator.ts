import OpenAI from "openai";
import { config } from "../config";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";

export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792";
export type ImageQuality = "standard" | "hd";
export type ImageStyle = "vivid" | "natural";

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

export class ImageGenerator {
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

  async download(url: string, filename: string): Promise<string> {
    const filepath = path.join(config.outputDir, filename);

    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    console.log(`📥 Downloading ${filename}...`);

    return new Promise<string>((resolve, reject) => {
      const file = fs.createWriteStream(filepath);

      https
        .get(url, (response) => {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`✅ Saved to ${filepath}\n`);
            resolve(filepath);
          });
        })
        .on("error", (err) => {
          fs.unlink(filepath, () => {});
          reject(err);
        });
    });
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
