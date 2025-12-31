/**
 * AI Provider Factory
 * Creates the appropriate AI provider based on the model name
 */

import { IAIProvider } from "./base-provider.interface";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { FluxProvider } from "./flux-provider";

export interface AIProviderConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  fluxApiKey?: string;
  textModel: string;
  imageModel?: string;
}

/**
 * Model name to provider mapping
 * This determines which provider to use based on the model name
 */
const MODEL_PROVIDER_MAP: Record<string, "openai" | "anthropic" | "flux"> = {
  // OpenAI models
  "gpt-4": "openai",
  "gpt-4-turbo": "openai",
  "gpt-4-turbo-preview": "openai",
  "gpt-4.1": "openai",
  "gpt-4.1-mini": "openai",
  "gpt-4o": "openai",
  "gpt-4o-mini": "openai",
  o1: "openai",
  "o1-mini": "openai",
  "o3-mini": "openai",
  "o3-mini-high": "openai",
  "gpt-3.5-turbo": "openai",

  // Anthropic/Claude models
  "claude-3-5-sonnet-20241022": "anthropic",
  "claude-3-5-sonnet-latest": "anthropic",
  "claude-3-5-haiku-20241022": "anthropic",
  "claude-3-5-haiku-latest": "anthropic",
  "claude-3-opus-20240229": "anthropic",
  "claude-3-opus-latest": "anthropic",
  "claude-3-sonnet-20240229": "anthropic",
  "claude-3-haiku-20240307": "anthropic",
  "claude-sonnet-4": "anthropic",
  "claude-opus-4": "anthropic",

  // Aliases for convenience
  "claude-3.5-sonnet": "anthropic",
  "claude-3.5-haiku": "anthropic",
  "claude-3-opus": "anthropic",
  "claude-3-sonnet": "anthropic",
  "claude-3-haiku": "anthropic",

  // FLUX models (Black Forest Labs)
  "flux-2-pro": "flux",
  "flux-2-flex": "flux",
  "flux-pro-1.1-ultra": "flux",
  "flux-pro-1.1": "flux",
  "flux-pro": "flux",
  "flux-dev": "flux",
  "dall-e-3": "openai",
};

/**
 * Detect which provider should be used for a given model
 */
function detectProvider(modelName: string): "openai" | "anthropic" | "flux" {
  // Check exact match first
  if (MODEL_PROVIDER_MAP[modelName]) {
    return MODEL_PROVIDER_MAP[modelName];
  }

  // Check if model name starts with known prefixes
  if (
    modelName.startsWith("gpt-") ||
    modelName.startsWith("o1") ||
    modelName.startsWith("o3") ||
    modelName.startsWith("dall-e")
  ) {
    return "openai";
  }

  if (modelName.startsWith("claude")) {
    return "anthropic";
  }

  if (modelName.startsWith("flux")) {
    return "flux";
  }

  // Default to OpenAI for unknown models
  console.warn(
    `⚠️  Unknown model "${modelName}", defaulting to OpenAI provider`
  );
  return "openai";
}

/**
 * Provider Factory
 * Manages AI provider instances and creates them on demand
 */
export class AIProviderFactory {
  private static providers: Map<string, IAIProvider> = new Map();
  private static config: AIProviderConfig | null = null;

  /**
   * Initialize the factory with configuration
   */
  static initialize(config: AIProviderConfig): void {
    this.config = config;
    this.providers.clear(); // Clear existing providers

    console.log("🏭 AI Provider Factory initialized");
    console.log(`   Text Model: ${config.textModel}`);
    console.log(`   Image Model: ${config.imageModel || "N/A"}`);
  }

  /**
   * Get text provider for the configured text model
   */
  static getTextProvider(): IAIProvider {
    if (!this.config) {
      throw new Error(
        "AIProviderFactory not initialized. Call initialize() first."
      );
    }

    return this.getProvider(this.config.textModel);
  }

  /**
   * Get image provider for the configured image model
   */
  static getImageProvider(): IAIProvider {
    if (!this.config) {
      throw new Error(
        "AIProviderFactory not initialized. Call initialize() first."
      );
    }

    if (!this.config.imageModel) {
      throw new Error("Image model not configured");
    }

    const provider = this.getProvider(this.config.imageModel);

    if (!provider.supportsImageGeneration()) {
      throw new Error(
        `Provider "${provider.providerName}" does not support image generation. ` +
          `Configure an OpenAI model for IMAGE_MODEL in .env`
      );
    }

    return provider;
  }

  /**
   * Get or create a provider for a specific model
   */
  private static getProvider(modelName: string): IAIProvider {
    // Check if provider already exists
    const cacheKey = `${modelName}`;
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!;
    }

    // Detect which provider to use
    const providerType = detectProvider(modelName);

    // Create new provider instance
    let provider: IAIProvider;

    if (providerType === "openai") {
      if (!this.config!.openaiApiKey) {
        throw new Error(
          "OPENAI_API_KEY not configured but required for model: " + modelName
        );
      }
      provider = new OpenAIProvider(
        this.config!.openaiApiKey,
        modelName,
        this.config!.imageModel || "dall-e-3"
      );
    } else if (providerType === "anthropic") {
      if (!this.config!.anthropicApiKey) {
        throw new Error(
          "ANTHROPIC_API_KEY not configured but required for model: " +
            modelName
        );
      }
      provider = new AnthropicProvider(this.config!.anthropicApiKey, modelName);
    } else if (providerType === "flux") {
      if (!this.config!.fluxApiKey) {
        throw new Error(
          "FLUX_API_KEY not configured but required for model: " + modelName
        );
      }
      provider = new FluxProvider(this.config!.fluxApiKey, modelName);
    } else {
      throw new Error(`Unknown provider type: ${providerType}`);
    }

    // Cache the provider
    this.providers.set(cacheKey, provider);

    return provider;
  }

  /**
   * Get a provider for a specific model (advanced usage)
   */
  static getProviderForModel(modelName: string): IAIProvider {
    if (!this.config) {
      throw new Error(
        "AIProviderFactory not initialized. Call initialize() first."
      );
    }

    return this.getProvider(modelName);
  }
}
