# Ceata Configuration Guide

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group. Configure your AI agents to work together as a **ceată**: independent minds working towards a common goal.

This guide covers all configuration options for the Ceata framework, from environment setup to advanced provider strategies and debugging features.

---

## 🎯 Quick Setup

### Environment Variables

Create a `.env` file in your project root:

```bash
# === PRIMARY PROVIDERS (Free Models) ===
OPENROUTER_API_KEY=your_openrouter_key_here
GOOGLE_API_KEY=your_google_api_key_here

# === FALLBACK PROVIDERS (Paid Models) ===
OPENAI_API_KEY=your_openai_key_here

# === OPTIONAL: Custom Configuration ===
# OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
# GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
# OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

### Basic Usage

```typescript
import { ConversationAgent } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";
import { googleOpenAI } from "ceata/providers/googleOpenAI";

// Free-first provider strategy
const providers = {
  primary: [
    createVanillaOpenRouterProvider(), // VANILLA tool calling for free models
    googleOpenAI, // Google free tier
  ],
  fallback: [] // Add paid providers if needed
};

const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providers);
```

---

## 🔧 Core Configuration Options

### Agent Options (`AgentOptions`)

Configure agent behavior and execution strategies:

```typescript
interface AgentOptions {
  maxSteps?: number;              // Default: 10
  maxHistoryLength?: number;      // Default: 20
  enableDebug?: boolean;          // Default: false
  providerStrategy?: 'smart' | 'racing' | 'sequential'; // Default: 'smart'
  enableRacing?: boolean;         // Default: false
  timeoutMs?: number;            // Default: 30000
}

// Usage
const options: AgentOptions = {
  maxSteps: 15,
  enableDebug: true,
  providerStrategy: 'smart',
};

const result = await agent.run(messages, tools, providers, options);
```

### Provider Groups (`ProviderGroup`)

Configure provider priority and fallback strategies:

```typescript
interface ProviderGroup {
  primary: Provider[];   // Tried first (recommend free models)
  fallback: Provider[];  // Used when primary providers fail
}

// Free-first strategy (recommended)
const providers: ProviderGroup = {
  primary: [
    vanillaOpenRouter1, // Free: Mistral Small 3.2
    vanillaOpenRouter2, // Free: DeepSeek R1
    googleOpenAI,       // Free: Gemini 2.0 Flash
  ],
  fallback: [
    openai,             // Paid: GPT-4o-mini (only when needed)
  ]
};
```

---

## 🔧 Provider Configuration

### VANILLA OpenRouter Provider

**Best for free models with tool calling via prompt engineering:**

```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

const vanillaProvider = createVanillaOpenRouterProvider(
  apiKey?: string,        // Optional: defaults to OPENROUTER_API_KEY
  baseUrl?: string,       // Optional: defaults to https://openrouter.ai
  {
    maxTokens?: number,   // Default: 4000
    temperature?: number, // Default: 0.7
    timeoutMs?: number,   // Default: 30000
    headers?: Record<string, string>, // Custom headers
  }
);

// Recommended configuration with headers
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://yourapp.com",
    "X-Title": "Your Ceata Agent",
  },
});
```

**Free models that work with VANILLA approach:**
- `mistralai/mistral-small-3.2-24b-instruct:free`
- `deepseek/deepseek-r1-0528-qwen3-8b:free`
- `mistralai/devstral-small:free`

### Google OpenAI Provider

**For Google's free Gemini models:**

```typescript
import { googleOpenAI } from "ceata/providers/googleOpenAI";

// Uses environment variable GOOGLE_API_KEY
// Default model: models/gemini-2.0-flash-thinking-exp
```

### OpenAI Provider

**For premium OpenAI models (fallback recommended):**

```typescript
import { openai } from "ceata/providers/openai";

// Uses environment variable OPENAI_API_KEY
// Default model: gpt-4o-mini
```

### Standard OpenRouter Provider

**For paid OpenRouter models with native tool calling:**

```typescript
import { createOpenRouterProvider } from "ceata/providers/openrouter";

const provider = createOpenRouterProvider(apiKey, baseUrl, options);
```

---

## ⚙️ Environment Variables Reference

### Provider API Keys
```bash
# Required for free models
OPENROUTER_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Optional for fallback
OPENAI_API_KEY=your_key_here
```

### Provider Base URLs
```bash
# Optional: Override default URLs
OPENAI_BASE_URL=https://api.openai.com
OPENROUTER_BASE_URL=https://openrouter.ai
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
```

### Default Models
```bash
# Free models (recommended)
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp

# Paid models (fallback)
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

### Timeouts and Limits
```bash
# Provider-specific timeouts (milliseconds)
OPENAI_TIMEOUT_MS=30000
OPENROUTER_TIMEOUT_MS=30000
GOOGLE_TIMEOUT_MS=30000

# Token limits
OPENAI_MAX_TOKENS=4000
OPENROUTER_MAX_TOKENS=4000
DEFAULT_MAX_TOKENS=4000

# Model parameters
OPENROUTER_TEMPERATURE=0.7
DEFAULT_TEMPERATURE=0.7
DEFAULT_TIMEOUT_MS=30000
```

---

## 🚀 Provider Strategies

### Smart Strategy (Recommended)

**Optimizes for both cost and reliability:**

```typescript
const options = {
  providerStrategy: 'smart' as const,
};

// Behavior:
// - Free models: Sequential execution (preserves quotas)
// - Paid models: Racing execution (optimizes speed)
// - Automatic fallback on provider failure
```

### Racing Strategy

**Optimizes for speed (use with paid models):**

```typescript
const options = {
  providerStrategy: 'racing' as const,
  enableRacing: true,
};

// Behavior:
// - All providers execute simultaneously
// - First successful response wins
// - Higher cost but faster results
```

### Sequential Strategy

**Optimizes for quota preservation:**

```typescript
const options = {
  providerStrategy: 'sequential' as const,
};

// Behavior:
// - Providers tried one at a time
// - Stops at first success
// - Best for free model quotas
```

---

## 🧠 Agent Type Configuration

### ConversationAgent (Production Ready)

**Standard pipeline agent for production workloads:**

```typescript
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();
const options = {
  maxSteps: 10,
  providerStrategy: 'smart' as const,
  enableDebug: false,
};
```

### QuantumConversationAgent (Advanced)

**Enhanced agent with advanced planning:**

```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();
const options = {
  maxSteps: 15,
  providerStrategy: 'smart' as const,
  enableDebug: true, // Recommended for quantum insights
};

// Additional quantum metrics available in result.debug.quantumMetrics
```

---

## 🛠️ Tool Configuration

### Defining Tools

```typescript
import { defineTool } from "ceata";

const mathTool = defineTool({
  name: "multiply",
  description: "Multiply two numbers together",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }) => {
    const result = a * b;
    console.log(`🧮 ${a} × ${b} = ${result}`);
    return result;
  },
});

// Tool registry
const tools = {
  multiply: mathTool,
  add: addTool,
  divide: divideTool,
};
```

### VANILLA Tool Calling Configuration

**How VANILLA approach works with free models:**

```typescript
// 1. Enhanced system prompt injection
const systemPrompt = `
When you need to use a tool, output exactly:
TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}

CRITICAL RULES:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call
4. Use exact JSON format shown above
`;

// 2. Text parsing with JSON repair
const toolCallPattern = /TOOL_CALL:\s*(\{[^}]*\})/g;

// 3. Sequential execution enforcement
if (toolCallMatches.length > 1) {
  console.log(`Sequential execution: Processing first of ${toolCallMatches.length} tool calls`);
}
```

---

## 📊 Performance & Debugging

### Debug Configuration

```typescript
const options = {
  enableDebug: true,
};

// Debug information available in result:
interface AgentResult {
  debug?: {
    plan: Plan;
    steps: number;
    reflections: number;
    providerHistory: { id: string; model?: string }[];
  };
}

// Usage
if (result.debug) {
  console.log(`Steps executed: ${result.debug.steps}`);
  console.log(`Providers used:`, result.debug.providerHistory);
}
```

### Performance Metrics

```typescript
// Available in all results
interface PerformanceMetrics {
  duration: number;        // Total execution time (ms)
  providerCalls: number;   // Number of provider API calls
  toolExecutions: number;  // Number of tool executions
  costSavings: number;     // Estimated savings from free models
  efficiency: number;      // Operations per second
}

console.log(`Cost savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`Efficiency: ${result.metrics.efficiency} ops/sec`);
```

### Logging Configuration

```typescript
import { logger } from "ceata";

// Set logging level
logger.setLevel('debug'); // 'error', 'warn', 'info', 'debug'

// View provider execution details
logger.setLevel('debug');
// Output: "🔧 Step 1 executed by: openrouter-vanilla (mistral-small-free)"
```

---

## 🧪 Testing Configuration

### Test Environment Setup

```bash
# .env.test
OPENROUTER_API_KEY=test_key
GOOGLE_API_KEY=test_key
OPENAI_API_KEY=test_key

# Shorter timeouts for testing
DEFAULT_TIMEOUT_MS=5000
```

### Example Test Configuration

```typescript
import { ConversationAgent } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Test with free model
const testProvider = createVanillaOpenRouterProvider();
const testAgent = new ConversationAgent();

const testOptions = {
  maxSteps: 5,
  enableDebug: true,
  timeoutMs: 5000,
};

// Run the critical test case
const messages = [
  {
    role: "user" as const,
    content: "Calculate the area of a 15×8 rectangle, then divide by 3"
  }
];

const result = await testAgent.run(
  messages,
  { multiply: multiplyTool, divide: divideTool },
  { primary: [testProvider], fallback: [] },
  testOptions
);

// Expected: Final answer should contain "40"
```

---

## 🚨 Common Configuration Issues

### Free Model Quotas

**Problem**: Rate limits on free models
**Solution**: Use smart strategy with proper fallback

```typescript
const providers = {
  primary: [
    vanillaProvider1, // First free model
    vanillaProvider2, // Second free model backup
    googleOpenAI,     // Google free tier backup
  ],
  fallback: [
    openai, // Paid fallback when quotas exhausted
  ]
};
```

### VANILLA Tool Calling Issues

**Problem**: JSON parsing failures
**Solution**: Framework includes automatic JSON repair

```typescript
// Automatic repair strategies built-in:
// 1. Add missing closing braces
// 2. Remove trailing commas
// 3. Fix common JSON formatting issues
```

**Problem**: Multi-step execution errors
**Solution**: Sequential execution enforced by default

```typescript
// Framework automatically:
// 1. Parses only FIRST tool call
// 2. Waits for result before next call
// 3. Injects results into conversation
```

### Provider Configuration

**Problem**: API key not found
**Solution**: Check environment variable setup

```bash
# Verify environment loading
echo $OPENROUTER_API_KEY
echo $GOOGLE_API_KEY
```

**Problem**: Provider selection confusion
**Solution**: Use explicit provider models

```typescript
const providerModels = {
  'openrouter-vanilla': 'mistralai/mistral-small-3.2-24b-instruct:free',
  'google': 'models/gemini-2.0-flash-thinking-exp',
  'openai': 'gpt-4o-mini',
};
```

---

## 🎯 Production Configuration

### Recommended Production Setup

```typescript
import { ConversationAgent } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";
import { googleOpenAI } from "ceata/providers/googleOpenAI";
import { openai } from "ceata/providers/openai";

// Production-ready configuration
const productionProviders = {
  primary: [
    // Free models for cost optimization
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: {
        "HTTP-Referer": "https://yourapp.com",
        "X-Title": "Your Production App",
      },
    }),
    googleOpenAI,
  ],
  fallback: [
    // Paid fallback for reliability
    openai,
  ]
};

const productionOptions = {
  maxSteps: 10,
  maxHistoryLength: 20,
  providerStrategy: 'smart' as const,
  enableDebug: false,
  timeoutMs: 30000,
};

const agent = new ConversationAgent();
```

### Environment Variables for Production

```bash
# Production .env
OPENROUTER_API_KEY=prod_openrouter_key
GOOGLE_API_KEY=prod_google_key
OPENAI_API_KEY=prod_openai_key

# Optimized timeouts
DEFAULT_TIMEOUT_MS=30000
OPENROUTER_TIMEOUT_MS=25000
GOOGLE_TIMEOUT_MS=25000

# Production models
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
OPENAI_DEFAULT_MODEL=gpt-4o-mini
```

---

## 🌟 Advanced Configuration

### Custom Provider Integration

```typescript
import { Provider, ChatOptions, ChatResult } from "ceata";

// Implement custom provider
const customProvider: Provider = {
  id: "custom-provider",
  supportsTools: true,
  async chat(options: ChatOptions): Promise<ChatResult> {
    // Your custom implementation
    return {
      message: { role: "assistant", content: "Custom response" },
      toolCalls: [],
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }
};
```

### Dynamic Configuration Updates

```typescript
import { updateConfig } from "ceata/config";

// Update configuration at runtime
updateConfig({
  providers: {
    openai: {
      maxTokens: 8000,
      timeoutMs: 60000,
    }
  },
  defaults: {
    temperature: 0.5,
  }
});
```

### Memory Management Configuration

```typescript
const options = {
  maxHistoryLength: 30, // Keep more history for complex tasks
  // Memory is automatically pruned while preserving:
  // - System messages
  // - Recent conversation context
  // - Tool call results
};
```

---

## 🎯 Best Practices

### 1. **Free-First Strategy**
Always configure free models as primary providers with paid models as fallback.

### 2. **Provider Headers**
Include proper HTTP headers for OpenRouter free models to avoid rate limiting.

### 3. **Debug During Development**
Enable debugging during development to understand provider selection and tool execution.

### 4. **Sequential for Free Models**
Use smart strategy to automatically handle free model quota preservation.

### 5. **Test with Real Models**
Test your configuration with actual free models to verify VANILLA tool calling works.

---

**Ceata's configuration system enables you to build a coordinated **ceată** of AI providers that work together efficiently, cost-effectively, and reliably.**