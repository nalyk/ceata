# Configuration Guide

The Agentic Framework supports flexible configuration through environment variables and runtime configuration updates. This allows you to easily customize API keys, models, timeouts, and other settings without modifying code.

## Environment Variables

The framework automatically reads configuration from environment variables. Copy `.env.example` to `.env` and update with your actual values:

```bash
cp .env.example .env
```

### OpenAI Configuration

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000
OPENAI_TIMEOUT_MS=30000
```

### OpenRouter Configuration

```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai
OPENROUTER_DEFAULT_MODEL=mistralai/devstral-small:free
OPENROUTER_MAX_TOKENS=4000
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_TIMEOUT_MS=30000
```

### Google AI Configuration

```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
GOOGLE_TIMEOUT_MS=30000
```

### Global Defaults

```bash
DEFAULT_TIMEOUT_MS=30000
DEFAULT_MAX_TOKENS=4000
DEFAULT_TEMPERATURE=0.7
```

### Configuration Validation

After loading your `.env` file the framework validates the configuration.
Timeouts and token limits must be positive numbers and temperatures must fall
between `0` and `2`.  If any value is outside these ranges an error is thrown at
startup.

## Runtime Configuration

You can also configure providers at runtime:

### Creating Custom Provider Instances

```typescript
import {
  createOpenAIProvider,
  createOpenRouterProvider,
  createGoogleProvider,
} from "./providers";

// Create providers with custom configuration
const customOpenAI = createOpenAIProvider(
  "your-api-key",
  "https://api.openai.com",
  { maxTokens: 8000, timeoutMs: 60000 }
);

const customOpenRouter = createOpenRouterProvider(
  "your-api-key",
  "https://openrouter.ai",
  { maxTokens: 4000, temperature: 0.5, timeoutMs: 45000 }
);

const customGoogle = createGoogleProvider(
  "your-api-key",
  "https://generativelanguage.googleapis.com",
  { timeoutMs: 30000 }
);
```

### Updating Global Configuration

```typescript
import { updateConfig, config } from "./config";

// Update configuration at runtime
updateConfig({
  providers: {
    openai: {
      defaultModel: "gpt-4",
      maxTokens: 8000,
    },
  },
  defaults: {
    timeoutMs: 60000,
  },
});

// Access current configuration
console.log(config.providers.openai.defaultModel);
```

### Using Configuration in Examples

```typescript
import { config } from "./config";
import { openRouter, google, openai } from "./providers";

const providers: ProviderConfig[] = [
  // Use configured default models
  {
    p: openRouter,
    model: config.providers.openrouter.defaultModel,
    priority: "primary",
  },
  {
    p: google,
    model: config.providers.google.defaultModel,
    priority: "primary",
  },
  {
    p: openai,
    model: config.providers.openai.defaultModel,
    priority: "fallback",
  },
];

// Or override with specific models
const customProviders: ProviderConfig[] = [
  {
    p: openRouter,
    model: "anthropic/claude-3-haiku:beta",
    priority: "primary",
  },
  { p: google, model: "models/gemini-pro", priority: "primary" },
  { p: openai, model: "gpt-4", priority: "fallback" },
];
```

## Configuration Hierarchy

The framework uses the following configuration hierarchy (highest priority first):

1. **Runtime parameters** - Values passed directly to provider creation functions
2. **Environment variables** - Values from `.env` file or system environment
3. **Default values** - Built-in fallback values

## Security Best Practices

1. **Never commit API keys** - Add `.env` to your `.gitignore`
2. **Use environment variables** - Especially in production environments
3. **Rotate keys regularly** - Update API keys periodically
4. **Limit key permissions** - Use API keys with minimal required permissions

## Provider-Specific Notes

### OpenAI

- Supports custom base URLs for OpenAI-compatible APIs
- Default model: `gpt-4o-mini`
- Supports all OpenAI chat completion parameters

### OpenRouter

- Provides access to multiple AI models through a single API
- Default model: `mistralai/devstral-small:free` (free tier)
- Includes robust JSON parsing for tool calls
- Custom headers for better rate limiting

### Google AI

- Supports Gemini models through the Generative AI API
- Default model: `models/gemini-2.0-flash-thinking-exp`
- Handles model name normalization automatically
- Custom base URL support for proxy setups

## Troubleshooting

### Common Issues

1. **API Key Not Found**

   ```
   Error: API key not configured
   ```

   Solution: Set the appropriate environment variable or pass the key directly

2. **Model Not Available**

   ```
   Error: Model not found
   ```

   Solution: Check if the model name is correct and available for your API key

3. **Timeout Errors**

   ```
   Error: Request timeout
   ```

   Solution: Increase the timeout value in configuration

4. **Rate Limiting**
   ```
   Error: Too many requests
   ```
   Solution: Implement retry logic or reduce request frequency

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=agentic:*
```

This will show detailed information about configuration loading and API requests.
