"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextGenerator = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
class TextGenerator {
    constructor() {
        this.client = new openai_1.default({ apiKey: config_1.config.apiKey });
    }
    async generate(prompt, options = {}) {
        const { temperature = 0.8, maxTokens = 2000 } = options;
        console.log("🤖 Generating text...");
        const params = {
            model: config_1.config.textModel,
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
    calculateCost(promptTokens, completionTokens) {
        // GPT-4o pricing: $2.50 per 1M input, $10 per 1M output
        const inputCost = (promptTokens / 1000000) * 2.5;
        const outputCost = (completionTokens / 1000000) * 10.0;
        return inputCost + outputCost;
    }
}
exports.TextGenerator = TextGenerator;
