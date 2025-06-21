# Ceata – Universal Agentic Framework

> Pronounced /ˈt͡ʃe.a.ta/ (Romanian **ceață** = a tight-knit band acting in unison)

A TypeScript agentic framework with pipeline architecture featuring provider racing, parallel tool execution, and smart memory management. Built for the commodity AI era - maximize free model utility while maintaining performance.

---

## ✨ Why “Ceata”?

**Ceata** is the Romanian word for a coordinated group—be it soldiers, haiduci, or carol singers.  
Your AI agents form exactly such a **ceată**: independent minds working towards a common goal.

---

## The Economic Strategy

**Ceata** is built for the **commodity AI era** - the breakthrough moment when free, tool-capable models became viable for production agentic workflows.

### The Cost Problem
- Premium models (GPT-4, Claude) are powerful but expensive at scale
- Free models are getting surprisingly capable, especially with tools
- Most frameworks lock you into expensive providers

### The Ceata Solution
```
Primary: OpenRouter Free Models + Google AI Studio (experimental/free)
         ↓ (only if all primary providers fail)
Fallback: Premium Models (GPT-4o-mini, etc.)
```

**Result**: Significant cost reduction while maintaining production reliability.

For a deeper dive into the project's design philosophy and technical decisions, please see our [**Rationale Document**](./RATIONALE.md).

---

## Pipeline Architecture

Efficient pipeline design

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PLANNER   │───▶│  EXECUTOR   │───▶│ REFLECTOR   │───▶│   RESULT    │
│ Strategic   │    │ Provider    │    │ Quality     │    │ Performance │
│ Planning    │    │ Racing      │    │ Assurance   │    │ Metrics     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Performance Features:**
- Provider Racing: Faster response times with `Promise.any()`
- Parallel Tools: Concurrent tool execution
- Smart Memory: Efficient memory management
- Type Safety: Full TypeScript type coverage
- Reliable JSON: Structured JSON parsing

---

## 🚀 Features

### Performance Features
- Provider Racing – multiple providers compete for fastest response
- Parallel Tool Execution – tools run simultaneously
- Smart Memory Management – automatic conversation pruning
- Real-Time Metrics – operations/sec, cost savings, efficiency tracking
- Circuit Breaker – intelligent retry with exponential backoff

### Cost-Optimized Intelligence
- Economic Strategy – free models first, paid models only when critical
- Provider Health Monitoring – avoid repeatedly trying failed free providers
- Memory Efficiency – smart conversation pruning preserves context while controlling costs
- Provider Caching – remember working providers to reduce API waste

### Production-Ready Architecture
- First-Class Tools – JSON-Schema-typed, automatically executable
- Structured JSON Parsing – reliable JSON block extraction
- Pluggable Providers – OpenRouter, Google Gemini, OpenAI (drop-in new ones)
- Pure TypeScript, Zero Deps – uses only built-in Node 18+ APIs
- Type-Safe End-to-End – strict generics for messages, providers, and tools
- 100% Backwards Compatible – legacy API still works

---

## 📦 Quick Start

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
cp .env.example .env # add your API keys
npm run build     # ES Modules in dist/
npm run example   # run the sample math agent
node dist/examples/chatWithTools.js  # multi-step streaming demo
node dist/examples/memoryManagementExample.js  # memory management demo
```

### Pipeline Architecture Mode

```typescript
import { runAgent, defineTool } from "./dist/index.js";
import { createOpenRouterProvider } from "./dist/providers/openrouter.js";
import { google } from "./dist/providers/google.js";
import { openai } from "./dist/providers/openai.js";

// Define tools with full type safety
const calculator = defineTool({
  name: "calculate",
  description: "Perform calculations",
  parameters: {
    type: "object",
    properties: { expression: { type: "string" } },
    required: ["expression"]
  },
  execute: async ({ expression }) => eval(expression.replace(/[^0-9+\-*/().\\s]/g, ''))
});

// Provider configuration with smart strategy
const providers = [
  { p: createOpenRouterProvider(), model: "mistralai/mistral-small-3.1-24b-instruct:free", priority: "primary" },
  { p: google, model: "models/gemini-2.0-flash-thinking-exp", priority: "primary" },
  { p: openai, model: "gpt-4o-mini", priority: "fallback" }
];

// Execute with smart provider strategy
const result = await runAgent(
  [{ role: "user", content: "Calculate 15 * 8 + 42" }],
  { calculator },
  providers,
  { providerStrategy: 'smart', maxHistoryLength: 50 }
);

```

### Hello Ceata (Legacy Compatible)

```typescript
import { defineTool } from "./dist/core/Tool.js";
import { runAgent, ProviderConfig, ProviderCache } from "./dist/core/AgentRunner.js";
import { createOpenRouterProvider } from "./dist/providers/openrouter.js";
import { google } from "./dist/providers/google.js";
import { openai } from "./dist/providers/openai.js";
import { config } from "./dist/config/index.js";

// Create an OpenRouter provider with custom headers
const openRouter = createOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Ceata Example",
  },
});

// 1️⃣  Define a calculator tool
const add = defineTool({
  name: "add",
  description: "Add two numbers",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }) => a + b,
});

// 2️⃣  Configure providers (free → paid fallback)
const providers: ProviderConfig[] = [
  // Primary providers (free models)
  {
    p: openRouter,
    model: "mistralai/mistral-small-3.1-24b-instruct:free",
    priority: "primary",
  },
  {
    p: google,
    model: config.providers.google.defaultModel,
    priority: "primary",
  },

  // Fallback provider (paid model)
  {
    p: openai,
    model: config.providers.openai.defaultModel,
    priority: "fallback",
  },
];

// 3️⃣  Run with advanced options!
const cache = new ProviderCache(); // Reuse across conversations
const response = await runAgent(
  [{ role: "user", content: "What is 15 + 27?" }],
  { add },
  providers,
  {
    maxSteps: 10,
    maxHistoryLength: 50, // Keep conversations manageable
    preserveSystemMessages: true,
    providerCache: cache, // Optimize provider selection
  }
);
console.log(response);
```

---

## 🔧 Provider Setup

Provider configuration is handled by the central `src/config/index.ts` file, which directly reads from environment variables. If a `.env` file is present, it is loaded automatically using built-in Node.js APIs. You can override the defaults by setting the corresponding environment variables.

Each `create*Provider` function verifies that an API key is available. If the resolved key is empty, it throws an error, so be sure to set the appropriate environment variable or pass the key explicitly.

### `.env.example`

```
# OPENAI
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# OPENROUTER
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai
OPENROUTER_DEFAULT_MODEL=mistralai/devstral-small:free

# GOOGLE
GOOGLE_API_KEY=
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
```

---

## 🛠️ Defining Tools

```typescript
const getWeather = defineTool({
  name: "get_weather",
  description: "Return current weather for a city",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  },
  execute: async ({ location, units = "celsius" }) => {
    // call your weather API here
    return { location, temperature: 22, units, condition: "sunny" };
  },
});
```

---

## ⚡ Advanced Usage

### Pipeline Architecture Components

```typescript
import { ConversationAgent, Planner, Executor, Reflector } from "./dist/index.js";

// Full control over the pipeline
const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providerGroup, {
  maxSteps: 10,
  providerStrategy: 'smart',
  maxHistoryLength: 30,
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    jitter: true
  }
});

// Access detailed debug information
console.log(`Plan strategy: ${result.debug.plan.strategy}`);
console.log(`Steps executed: ${result.debug.steps}`);
console.log(`Reflections: ${result.debug.reflections}`);
// See which provider responded
console.log(
  `Provider used: ${result.debug.providerHistory[0].id} (${result.debug.providerHistory[0].model})`
);
```

### Migration Strategies

```typescript
// Strategy 1: Zero Changes (Immediate)
import { runAgent } from "./dist/index.js";
const result = await runAgent(messages, tools, providers);
// All features work, optimizations applied under the hood

// Strategy 2: Smart Provider Strategy
import { runAgent } from "./dist/index.js";
const result = await runAgent(messages, tools, providers, {
  providerStrategy: 'smart'
});

// Strategy 3: Full Pipeline Control
import { ConversationAgent } from "./dist/index.js";
const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providerGroup, fullOptions);
```

### Memory Management for Long Conversations

```typescript
import { runAgent, ProviderCache } from "./dist/core/AgentRunner.js";

// Create a persistent cache across conversations
const cache = new ProviderCache();

// Configure memory-conscious agent
const options = {
  maxHistoryLength: 20,        // Keep last 20 messages
  preserveSystemMessages: true, // Always keep system context
  providerCache: cache,        // Reuse provider health
};

// Long-running conversation won't consume unbounded memory
const response = await runAgent(longConversation, tools, providers, options);

// Debug provider performance
console.log(cache.getHealthReport());
```

### Cost Monitoring

```typescript
// Track which providers are actually being used
const providers = [
  { p: openRouter, model: "mistralai/mistral-small-3.1-24b-instruct:free", priority: "primary" },
  { p: openai, model: "gpt-4o-mini", priority: "fallback" },
];

// Check logs for cost insights:
// [INFO] 🔄 Trying primary provider: openrouter (free)
// [INFO] ✅ Selected provider: openrouter (free)
```

### Provider Health Monitoring

```typescript
const cache = new ProviderCache();

// Failed providers get cooldown periods
// Healthy providers are preferred
// No more wasted API calls on known failures

const healthReport = cache.getHealthReport();
console.log(healthReport);
// {
//   "openrouter": { "isHealthy": true, "consecutiveFailures": 0 },
//   "google": { "isHealthy": false, "consecutiveFailures": 3 }
// }
```

---

## 📚 API Reference

### Pipeline API

#### `ConversationAgent` Class

```typescript
class ConversationAgent {
  async run(messages, tools, providers, options?, providerModels?): Promise<AgentResult>
}
```

```typescript
interface AgentResult {
  messages: ChatMessage[];              // Conversation result
  metrics: {
    duration: number;                   // Total execution time (ms)
    providerCalls: number;             // API calls made
    toolExecutions: number;            // Tools executed
    costSavings: number;               // Money saved using free models
    efficiency: number;                // Operations per second
  };
  debug?: {
    plan: Plan;                        // Execution strategy
    steps: number;                     // Pipeline steps
    reflections: number;               // Quality corrections applied
  };
}
```

### Legacy API (100% Compatible)

#### `runAgent(messages, tools, providers, options?)`

Executes the agent loop with automatic tool invocation and provider fallback.

#### Backward Compatible Signatures:
```typescript
// Legacy signature (still supported)
runAgent(messages, tools, providers, maxSteps?, timeoutMs?, providerCache?)

// New signature with enhanced options
runAgent(messages, tools, providers, options?)
```

#### Agent Options:
```typescript
interface AgentOptions {
  maxSteps?: number;                    // Max conversation turns (default: 8)
  timeoutMs?: number;                   // Request timeout
  providerCache?: ProviderCache;        // Reuse provider health across calls
  maxHistoryLength?: number;            // Memory management (default: 50)
  preserveSystemMessages?: boolean;     // Keep system msgs during pruning (default: true)
  enableRacing?: boolean;               // Enable provider racing
  providerStrategy?: 'racing' | 'sequential' | 'smart'; // Provider selection strategy
  retryConfig?: RetryConfig;            // Circuit breaker configuration
}
```

### `defineTool(options)`

Creates a type-safe tool: JSON-Schema parameters + async executor.

### `ProviderCache`

Smart caching for provider health and selection:
```typescript
const cache = new ProviderCache();
const healthReport = cache.getHealthReport(); // Debug provider status
```

### Core Types

```typescript
interface ProviderConfig {
  p: Provider;
  model: string;
  priority: "primary" | "fallback";
  timeoutMs?: number;
  stream?: boolean;
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
```

---

## 🗺️ Project Layout

```
src/
├── core/            # Pipeline Architecture + Legacy Components
│   ├── ConversationAgent.ts  # Pipeline orchestrator
│   ├── Planner.ts            # Strategic planning
│   ├── Executor.ts           # Provider racing + tools
│   ├── Reflector.ts          # Quality assurance
│   ├── AgentContext.ts       # State management
│   ├── AgentRunner.ts        # Legacy compatibility (enhanced)
│   ├── Provider.ts           # Provider interface & types
│   ├── Tool.ts              # Tool definition utilities
│   ├── logger.ts            # Configurable logging
│   ├── http.ts              # HTTP utilities
│   └── Stream.ts            # Streaming support
├── providers/       # Provider implementations
│   ├── openrouter.ts     # OpenRouter with free model support
│   ├── google.ts         # Google AI Studio integration
│   ├── openai.ts         # OpenAI compatible
│   ├── openaiLikeBase.ts # Shared OpenAI-style logic
│   └── utils.ts          # Provider utilities
├── examples/        # Demonstration code
│   ├── mathAgent.ts           # Basic tool usage
│   ├── chatWithTools.ts       # Streaming conversation
│   ├── pipelineExample.ts     # Pipeline architecture demo
│   └── memoryManagementExample.ts # Advanced memory features
├── config/          # Centralized configuration
├── __tests__/       # Comprehensive test suite
│   ├── conversationAgent.test.ts   # Pipeline architecture tests
│   └── ...                        # Legacy test coverage
├── ARCHITECTURE.md   # Complete architecture guide
├── USAGE-GUIDE.md   # Usage patterns & best practices
└── index.ts         # Public API exports
```

~800 lines of code implementing clean pipeline architecture

---

## 🛡️ Security & Cost

### Cost Optimization
- Provider Racing – free models compete for fastest response
- Real-Time Cost Tracking – track cost savings
- Smart Memory Management – prevent unbounded conversation growth
- Provider Health Monitoring – avoid wasting calls on failed providers
- Parallel Execution – maximize throughput, minimize time costs

### Security Features
- Structured JSON Parsing – reliable JSON block extraction
- Input Validation – tool arguments are sanitized and size-limited
- Safe Parsing – no regex-based vulnerabilities
- No Persistent Storage – chats stay in memory only
- Rate-Limiting Ready – integrates with rate limiting systems

---

## 🧪 Testing

```bash
npm install
npm test
```

`npm test` builds the TypeScript sources and then runs the unit tests using Node's test runner.

GitHub Actions CI runs lint, unit tests, and an end-to-end agent flow.

---

## 🤝 Contributing

1. Fork → feature branch → PR
2. Add/extend unit tests (`src/__tests__`)
3. Follow the conventional commits style

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

---

## Architecture Comparison

| Feature | Legacy | Pipeline | Improvement |
|---------|--------|----------|-------------|
| Provider Selection | Sequential | Racing | Faster response |
| Tool Execution | Sequential | Parallel | Concurrent execution |
| Memory Usage | O(n²) | O(1) | Efficient pruning |
| Type Safety | `any` types | Full generics | Type-safe |
| JSON Parsing | Regex-based | Structured blocks | More reliable |
| Architecture | Single loop (460 LOC) | Pipeline (800 LOC) | Clean separation |

---

Built with ❤️ by Yoda.Digital - a _ceată_ of open-source enthusiasts who believe in efficient, honest software.
