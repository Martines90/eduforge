"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGeneratorService = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
class ImageGeneratorService {
    constructor() {
        this.client = new openai_1.default({ apiKey: config_1.config.apiKey });
    }
    async generate(prompt, options = {}) {
        const { size = "1024x1024", quality = "standard", style = "vivid", } = options;
        console.log(`🎨 Generating image (${size}, ${quality})...`);
        const response = await this.client.images.generate({
            model: config_1.config.imageModel,
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
    calculateCost(size, quality) {
        const pricing = {
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
    generateFilename() {
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        return `image-${timestamp}.png`;
    }
}
exports.ImageGeneratorService = ImageGeneratorService;
