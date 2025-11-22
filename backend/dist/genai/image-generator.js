"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const path = __importStar(require("path"));
class ImageGenerator {
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
    async download(url, filename) {
        const filepath = path.join(config_1.config.outputDir, filename);
        // Ensure output directory exists
        if (!fs.existsSync(config_1.config.outputDir)) {
            fs.mkdirSync(config_1.config.outputDir, { recursive: true });
        }
        console.log(`📥 Downloading ${filename}...`);
        return new Promise((resolve, reject) => {
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
                fs.unlink(filepath, () => { });
                reject(err);
            });
        });
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
exports.ImageGenerator = ImageGenerator;
