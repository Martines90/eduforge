# Multi-AI Provider System

This backend supports multiple AI providers for task generation, allowing you to easily switch between OpenAI and Claude (Anthropic) models.

## Architecture

The system uses a **provider abstraction layer** that automatically selects the appropriate AI provider based on the configured model name.

### Components

1. **Base Provider Interface** (`base-provider.interface.ts`)
   - Defines the contract all providers must implement
   - Standardizes request/response formats across providers

2. **OpenAI Provider** (`openai-provider.ts`)
   - Implements text generation using OpenAI's GPT models
   - Implements image generation using DALL-E-3
   - Supports: GPT-4, GPT-4o, o1, o3, etc.

3. **Anthropic Provider** (`anthropic-provider.ts`)
   - Implements text generation using Claude models
   - Does NOT support image generation
   - Supports: Claude 3 Opus, Sonnet, Haiku, Claude 3.5, etc.

4. **Provider Factory** (`provider-factory.ts`)
   - Automatically detects which provider to use based on model name
   - Manages provider instances
   - Provides easy access to text and image providers

## Configuration

### Environment Variables

```bash
# Required for OpenAI models
OPENAI_API_KEY=your-openai-api-key

# Required for Claude models (optional if only using OpenAI)
ANTHROPIC_API_KEY=your-anthropic-api-key

# Model configuration (auto-detects provider)
TEXT_MODEL=gpt-4.1              # or claude-3-5-sonnet-20241022
IMAGE_MODEL=dall-e-3            # OpenAI only
```

### Switching Between Providers

Simply change the `TEXT_MODEL` in your `.env` file:

**To use OpenAI:**
```bash
TEXT_MODEL=gpt-4.1              # or gpt-4o, o3-mini-high, etc.
```

**To use Claude:**
```bash
TEXT_MODEL=claude-3-5-sonnet-20241022  # or claude-3-opus-20240229, etc.
ANTHROPIC_API_KEY=your-key-here        # Don't forget to add your API key!
```

The system will automatically:
- Detect which provider to use
- Use the appropriate API
- Calculate costs correctly for each provider
- Handle provider-specific message formats

## Supported Models

### OpenAI Models

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| `gpt-4.1` | OpenAI | Best overall, creative | Medium |
| `gpt-4.1-mini` | OpenAI | Cheaper, variations | Low |
| `gpt-4o` | OpenAI | Fast, multimodal | Medium |
| `gpt-4o-mini` | OpenAI | Cheaper, fast | Low |
| `o3-mini-high` | OpenAI | Math reasoning | Very Low |
| `o1-mini` | OpenAI | Reasoning, cheaper | Low |

### Claude/Anthropic Models

| Model | Provider | Use Case | Cost |
|-------|----------|----------|------|
| `claude-3-5-sonnet-20241022` | Anthropic | Best overall, math | Medium |
| `claude-3-5-haiku-20241022` | Anthropic | Fast and cheap | Low |
| `claude-3-opus-20240229` | Anthropic | Most capable | High |
| `claude-3-sonnet-20240229` | Anthropic | Balanced | Medium |
| `claude-3-haiku-20240307` | Anthropic | Cheapest | Very Low |

**Note:** Image generation is only supported with OpenAI models (DALL-E-3).

## Usage Examples

### Generating Tasks with OpenAI

```bash
# .env
TEXT_MODEL=gpt-4.1
IMAGE_MODEL=dall-e-3
OPENAI_API_KEY=sk-...
```

The system will:
- Use OpenAI for text generation
- Use OpenAI DALL-E-3 for images

### Generating Tasks with Claude

```bash
# .env
TEXT_MODEL=claude-3-5-sonnet-20241022
IMAGE_MODEL=dall-e-3
OPENAI_API_KEY=sk-...          # Still needed for images
ANTHROPIC_API_KEY=sk-ant-...   # Add Anthropic key
```

The system will:
- Use Claude for text generation
- Use OpenAI DALL-E-3 for images
- Automatically switch between providers as needed

### Using Only Claude (No Images)

```bash
# .env
TEXT_MODEL=claude-3-5-sonnet-20241022
ANTHROPIC_API_KEY=sk-ant-...
DISABLE_IMAGE_GENERATION=true
```

The system will:
- Use Claude for text generation
- Skip image generation

## Cost Tracking

The system automatically calculates costs based on the model used:

### OpenAI Pricing (per 1M tokens)
- GPT-4o: $2.50 input / $10.00 output
- GPT-4o-mini: $0.15 input / $0.60 output
- o3-mini: $1.10 input / $4.40 output

### Claude Pricing (per 1M tokens)
- Claude 3.5 Sonnet: $3.00 input / $15.00 output
- Claude 3.5 Haiku: $0.80 input / $4.00 output
- Claude 3 Opus: $15.00 input / $75.00 output

## Adding New Providers

To add a new AI provider:

1. Create a new provider class implementing `IAIProvider`
2. Add model mappings to `provider-factory.ts`
3. Add pricing info to `text-generator.service.ts`
4. Update `.env` documentation

Example:

```typescript
// src/services/ai-providers/custom-provider.ts
export class CustomProvider implements IAIProvider {
  public readonly providerName = "custom";
  public readonly defaultModel: string;

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Your implementation
  }

  supportsImageGeneration(): boolean {
    return false;
  }
}
```

## Troubleshooting

### "Provider not initialized" error
Make sure `AIProviderFactory.initialize()` is called in `src/index.ts` before any generation requests.

### "API key not configured" error
Add the required API key to your `.env` file:
- `OPENAI_API_KEY` for OpenAI models
- `ANTHROPIC_API_KEY` for Claude models

### "Model not found" error
Check that the model name in `TEXT_MODEL` matches one of the supported models listed above.

### Image generation fails with Claude
Claude does not support image generation. Either:
- Keep `IMAGE_MODEL=dall-e-3` and `OPENAI_API_KEY` configured
- Set `DISABLE_IMAGE_GENERATION=true` in `.env`

## Best Practices

1. **Model Selection**
   - Use Claude 3.5 Sonnet for math and reasoning tasks
   - Use GPT-4.1 for creative storytelling
   - Use mini/haiku models for faster, cheaper iterations

2. **Cost Optimization**
   - Start with cheaper models (haiku/mini) for testing
   - Use more expensive models only when needed
   - Monitor token usage in logs

3. **Reliability**
   - Have both API keys configured for fallback options
   - Test with multiple providers to find best results
   - Monitor API rate limits

## Architecture Benefits

✅ **Easy Model Switching** - Change one env variable
✅ **Provider Abstraction** - No code changes needed
✅ **Automatic Detection** - System picks the right provider
✅ **Cost Tracking** - Accurate pricing for each provider
✅ **Extensible** - Easy to add new providers
✅ **Type Safety** - Full TypeScript support

## Future Enhancements

- [ ] Support for Google Gemini
- [ ] Support for Mistral AI
- [ ] Automatic fallback between providers
- [ ] Provider health checking
- [ ] Usage analytics and optimization
