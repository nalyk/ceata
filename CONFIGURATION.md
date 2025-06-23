# Ceata Configuration Guide

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group. Configure your AI agents to work together as a **ceată**: independent minds working towards a common goal.

This comprehensive guide covers all configuration options for the Ceata framework, from environment setup to advanced provider strategies, multi-agent coordination, and production deployment patterns.

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

# === OPTIONAL: Provider Configuration ===
# Base URLs (usually not needed)
OPENAI_BASE_URL=https://api.openai.com
OPENROUTER_BASE_URL=https://openrouter.ai
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com

# Default Models
OPENROUTER_DEFAULT_MODEL=mistralai/devstral-small:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Timeouts (milliseconds)
DEFAULT_TIMEOUT_MS=30000
OPENAI_TIMEOUT_MS=30000
OPENROUTER_TIMEOUT_MS=30000
GOOGLE_TIMEOUT_MS=30000

# Token Limits
DEFAULT_MAX_TOKENS=4000
OPENAI_MAX_TOKENS=4000
OPENROUTER_MAX_TOKENS=4000

# Model Parameters
DEFAULT_TEMPERATURE=0.7
OPENROUTER_TEMPERATURE=0.7
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

## 🔧 Core Configuration System

### Configuration Loading (`src/config/index.ts`)

The configuration system automatically loads environment variables and provides runtime validation:

```typescript
import { config, updateConfig, getProviderConfig } from "ceata/config";

// Access current configuration
console.log(config.providers.openai.defaultModel); // "gpt-4o-mini"
console.log(config.defaults.timeoutMs); // 30000

// Get provider-specific config
const openaiConfig = getProviderConfig('openai');
const openrouterConfig = getProviderConfig('openrouter');
const googleConfig = getProviderConfig('google');

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

### Configuration Schema

```typescript
interface AgenticConfig {
  providers: {
    openai: {
      apiKey: string;
      baseUrl: string;
      defaultModel: string;
      maxTokens: number;
      timeoutMs: number;
    };
    openrouter: {
      apiKey: string;
      baseUrl: string;
      defaultModel: string;
      maxTokens: number;
      temperature: number;
      timeoutMs: number;
    };
    google: {
      apiKey: string;
      baseUrl: string;
      defaultModel: string;
      timeoutMs: number;
    };
  };
  defaults: {
    timeoutMs: number;
    maxTokens: number;
    temperature: number;
  };
}
```

---

## ⚙️ Agent Configuration

### Agent Options (`AgentContext.ts`)

Configure agent behavior and execution strategies:

```typescript
interface AgentOptions {
  readonly maxSteps: number;               // Default: 8
  readonly timeoutMs: number;              // Default: 30000
  readonly maxHistoryLength: number;       // Default: 50
  readonly preserveSystemMessages: boolean; // Default: true
  readonly enableRacing: boolean;          // Default: true
  readonly providerStrategy: 'racing' | 'sequential' | 'smart'; // Default: 'smart'
  readonly retryConfig: RetryConfig;
}

interface RetryConfig {
  readonly maxRetries: number;     // Default: 3
  readonly baseDelayMs: number;    // Default: 1000
  readonly maxDelayMs: number;     // Default: 10000
  readonly jitter: boolean;        // Default: true
}

// Usage
const options: Partial<AgentOptions> = {
  maxSteps: 15,
  providerStrategy: 'smart',
  maxHistoryLength: 30,
  retryConfig: {
    maxRetries: 5,
    baseDelayMs: 500,
    maxDelayMs: 5000,
    jitter: true,
  }
};

const result = await agent.run(messages, tools, providers, options);
```

### Provider Groups (`ProviderGroup`)

Configure provider priority and fallback strategies:

```typescript
interface ProviderGroup {
  readonly primary: Provider[];   // Tried first (recommend free models)
  readonly fallback: Provider[];  // Used when primary providers fail
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

### Performance Metrics

All agent executions include comprehensive metrics:

```typescript
interface PerformanceMetrics {
  readonly startTime: number;
  providerCalls: number;      // Number of API calls made
  toolExecutions: number;     // Number of tool executions
  totalTokens: number;        // Total tokens consumed
  costSavings: number;        // Estimated savings from free models
}

// Access metrics from results
console.log(`Cost savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`Tool executions: ${result.metrics.toolExecutions}`);
console.log(`Duration: ${result.metrics.duration}ms`);
```

---

## 🔧 Provider Configuration

### VANILLA OpenRouter Provider (Free Models)

**Best for free models with tool calling via prompt engineering:**

```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

const vanillaProvider = createVanillaOpenRouterProvider(
  apiKey?: string,        // Optional: defaults to OPENROUTER_API_KEY
  baseUrl?: string,       // Optional: defaults to config value
  {
    maxTokens?: number,   // Default: from config (4000)
    temperature?: number, // Default: from config (0.7)
    timeoutMs?: number,   // Default: from config (30000)
    headers?: Record<string, string>, // Custom headers
  }
);

// Recommended configuration with headers for free models
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

**VANILLA Tool Calling System:**

The VANILLA provider transforms any text model into a tool-calling model through:

1. **Enhanced System Prompt** with tool definitions
2. **Text Parsing** with JSON repair strategies
3. **Sequential Execution** enforcement for multi-step tasks

```typescript
// System prompt includes:
const systemPrompt = `When you need to use a tool, output:
TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}

CRITICAL RULES:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call`;

// Text parsing with repair strategies
const toolCallPattern = /TOOL_CALL:\s*(\{[^}]*\})/g;
```

### Google OpenAI Provider (Free Tier)

**For Google's free Gemini models:**

```typescript
import { googleOpenAI, createGoogleOpenAIProvider } from "ceata/providers/googleOpenAI";

// Use default instance
const provider = googleOpenAI; // Uses GOOGLE_API_KEY

// Or create custom instance
const customProvider = createGoogleOpenAIProvider(
  "your-api-key", 
  "https://ai-api.yoda.digital/v1beta/openai", // Custom endpoint
  { timeoutMs: 45000 }
);
```

### OpenAI Provider (Paid Models)

**For premium OpenAI models (fallback recommended):**

```typescript
import { openai } from "ceata/providers/openai";

// Uses environment variable OPENAI_API_KEY
// Default model: gpt-4o-mini
// Supports native tool calling
```

### Standard OpenRouter Provider (Paid Models)

**For paid OpenRouter models with native tool calling:**

```typescript
import { createOpenRouterProvider } from "ceata/providers/openrouter";

const provider = createOpenRouterProvider(
  apiKey,
  baseUrl,
  {
    maxTokens: 4000,
    temperature: 0.7,
    timeoutMs: 30000,
  }
);
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
// - Primary providers: Sequential execution (preserves free quotas)
// - Fallback providers: Sequential execution with retry logic
// - Automatic fallback on provider failure
// - Intelligent cost optimization
```

**Smart Strategy Logic:**
1. Try primary providers sequentially to preserve free quotas
2. Fall back to paid providers only when necessary
3. Track cost savings automatically
4. Provider health monitoring

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
// - Best for real-time applications
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
// - Predictable execution order
```

---

## 🧠 Agent Types & Configuration

### ConversationAgent (Production Ready)

**Standard pipeline agent for production workloads:**

```typescript
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();

// Default configuration optimized for production
const options = {
  maxSteps: 8,                    // Reasonable limit for most tasks
  maxHistoryLength: 50,           // Memory management
  preserveSystemMessages: true,   // Keep system context
  providerStrategy: 'smart',      // Cost-optimized strategy
  enableRacing: true,             // Allow racing when beneficial
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    jitter: true
  }
};

const result = await agent.run(messages, tools, providers, options);
```

### QuantumConversationAgent (Advanced Planning)

**Enhanced agent with revolutionary planning capabilities:**

```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();

// Enhanced options for complex tasks
const options = {
  maxSteps: 15,                   // More steps for complex planning
  providerStrategy: 'smart',      // Intelligent provider selection
  maxHistoryLength: 100,          // Extended memory for planning
};

const result = await quantumAgent.run(messages, tools, providers, options);

// Additional quantum metrics available
if (result.debug) {
  console.log(`Intent Complexity: ${result.debug.quantumMetrics.intentComplexity}`);
  console.log(`Strategy Type: ${result.debug.quantumMetrics.strategyType}`);
  console.log(`Confidence Score: ${result.debug.quantumMetrics.confidenceScore}%`);
  console.log(`Hypotheses Generated: ${result.debug.quantumMetrics.hypothesesGenerated}`);
  console.log(`Planning Time: ${result.metrics.planningTime}ms`);
}
```

**Quantum Planning Features:**
- **Intent Recognition**: LLM-powered analysis of user requests
- **HTN Decomposition**: Hierarchical task network planning
- **Tree-of-Thoughts**: Multiple reasoning paths evaluation
- **Adaptive Strategies**: Dynamic strategy selection based on context
- **Self-Healing**: Automatic error recovery and plan adaptation

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
  execute: async ({ a, b }: { a: number; b: number }) => {
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

### Tool Execution Flow

**For Native Tool Calling (Paid Models):**
1. Tools converted to OpenAI format
2. Native API tool calling
3. Structured responses

**For VANILLA Tool Calling (Free Models):**
1. Tools injected into system prompt
2. Text-based tool call parsing
3. Sequential execution enforcement
4. Automatic JSON repair

### Advanced Tool Patterns

```typescript
// Async tool with error handling
const apiTool = defineTool({
  name: "fetch_data",
  description: "Fetch data from external API",
  parameters: {
    type: "object",
    properties: {
      endpoint: { type: "string", description: "API endpoint" },
      params: { type: "object", description: "Query parameters" },
    },
    required: ["endpoint"],
  },
  execute: async ({ endpoint, params = {} }) => {
    try {
      // API call logic
      const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`);
      return await response.json();
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  },
});

// Tool with complex validation
const validationTool = defineTool({
  name: "validate_input",
  description: "Validate input data",
  parameters: {
    type: "object",
    properties: {
      data: { type: "string" },
      schema: { type: "string", enum: ["email", "phone", "url"] },
    },
    required: ["data", "schema"],
  },
  execute: async ({ data, schema }) => {
    const patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^\+?[\d\s-()]+$/,
      url: /^https?:\/\/.+/,
    };
    
    return {
      valid: patterns[schema].test(data),
      schema,
      input: data,
    };
  },
});
```

---

## 🎭 Multi-Agent Configuration

### Agent Capabilities

Define specialized agent capabilities:

```typescript
import { AgentCapabilities, SpecializationLevel } from "ceata/multi-agent";

const moldovaLegalAgent: AgentCapabilities = {
  id: "moldova-legal-expert",
  domains: ["legal", "moldova", "compliance"],
  languages: ["ro", "ru", "en"],
  tools: ["legal_search", "document_analysis", "regulation_lookup"],
  specialization: SpecializationLevel.EXPERT,
  localKnowledge: {
    cities: ["Chișinău", "Bălți", "Cahul", "Ungheni"],
    currencies: ["MDL", "EUR", "USD"],
    legalFramework: ["Moldova Civil Code", "EU Association Agreement"],
    culturalNotes: {
      "business_hours": "09:00-18:00 Moldova time",
      "language_preference": "Romanian for official documents",
      "currency_preference": "MDL for local transactions"
    }
  },
  providerPreference: {
    type: "free-first",
    fallbackEnabled: true
  },
  maxConcurrentTasks: 3,
  averageResponseTime: 2500
};
```

### Multi-Agent System Setup

```typescript
import { 
  createMoldovaMultiAgentSystem,
  DualModeCoordinator,
  AgentRegistry
} from "ceata/multi-agent";

// Quick setup for Moldova context
const { coordinator, registry, agents } = createMoldovaMultiAgentSystem();

// Or manual setup
const registry = new AgentRegistry();
registry.registerAgent(moldovaLegalAgent);
registry.registerAgent(weatherAgent);
registry.registerAgent(travelAgent);

const coordinator = new DualModeCoordinator(registry.getAllAgents());

// Execute with coordination
const result = await coordinator.execute(
  "I need help with Moldova business registration and current weather in Chișinău",
  {
    coordinationMode: 'auto',
    maxLatency: 5000,
    fallbackEnabled: true
  }
);
```

### Coordination Modes

```typescript
interface CoordinationOptions {
  coordinationMode?: 'udp' | 'orchestra' | 'auto';
  maxLatency?: number;
  forceMode?: boolean;
}

// UDP Mode: Ultra-fast, parallel execution
const udpResult = await coordinator.execute(query, {
  coordinationMode: 'udp',
  maxLatency: 1000
});

// Orchestra Mode: Sequential, high-quality coordination
const orchestraResult = await coordinator.execute(query, {
  coordinationMode: 'orchestra',
  maxLatency: 10000
});

// Auto Mode: Intelligent selection based on task complexity
const autoResult = await coordinator.execute(query, {
  coordinationMode: 'auto',
  maxLatency: 5000
});
```

---

## 📊 Debugging & Monitoring

### Debug Configuration

```typescript
const options = {
  // Debug settings are passed to createAgentContext
  maxSteps: 10,
  providerStrategy: 'smart' as const,
  maxHistoryLength: 50,
};

// Debug information available in result
if (result.debug) {
  console.log(`Steps executed: ${result.debug.steps}`);
  console.log(`Reflections: ${result.debug.reflections}`);
  console.log(`Plan:`, result.debug.plan);
  console.log(`Provider history:`, result.debug.providerHistory);
  
  // Quantum-specific debug info (QuantumConversationAgent only)
  if (result.debug.quantumMetrics) {
    console.log(`Intent complexity: ${result.debug.quantumMetrics.intentComplexity}`);
    console.log(`Strategy type: ${result.debug.quantumMetrics.strategyType}`);
    console.log(`Confidence score: ${result.debug.quantumMetrics.confidenceScore}`);
    console.log(`Alternative paths: ${result.debug.alternativePaths}`);
    console.log(`Adaptations: ${result.debug.adaptations}`);
  }
}
```

### Logging Configuration

```typescript
import { logger } from "ceata";

// Set logging level
logger.setLevel('debug'); // 'error', 'warn', 'info', 'debug'

// Provider execution logging
logger.setLevel('debug');
// Output: "🔧 Step 1 executed by: openrouter-vanilla (mistral-small-free)"
// Output: "⚡ Trying primary provider: openrouter-vanilla"
// Output: "✅ Primary provider openrouter-vanilla succeeded"
```

### Performance Monitoring

```typescript
// Performance metrics are automatically tracked
interface PerformanceMetrics {
  duration: number;          // Total execution time (ms)
  providerCalls: number;     // Number of provider API calls
  toolExecutions: number;    // Number of tool executions
  costSavings: number;       // Estimated savings from free models
  efficiency: number;        // Operations per second
  planningTime?: number;     // Planning time (QuantumAgent only)
}

// Monitor execution
console.log(`Execution completed in ${result.metrics.duration}ms`);
console.log(`Cost savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`Efficiency: ${result.metrics.efficiency.toFixed(2)} ops/sec`);
console.log(`Provider calls: ${result.metrics.providerCalls}`);
console.log(`Tool executions: ${result.metrics.toolExecutions}`);
```

---

## 🧪 Testing Configuration

### Test Environment Setup

```bash
# .env.test
OPENROUTER_API_KEY=test_key_here
GOOGLE_API_KEY=test_key_here
OPENAI_API_KEY=test_key_here

# Shorter timeouts for testing
DEFAULT_TIMEOUT_MS=5000
OPENROUTER_TIMEOUT_MS=5000
GOOGLE_TIMEOUT_MS=5000

# Test models
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
```

### Test Configuration Examples

```typescript
import { ConversationAgent } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Test with free model
const testProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  timeoutMs: 5000,
  headers: {
    "HTTP-Referer": "https://test.example.com",
    "X-Title": "Test Agent",
  }
});

const testAgent = new ConversationAgent();
const testOptions = {
  maxSteps: 5,
  timeoutMs: 5000,
  maxHistoryLength: 20,
  providerStrategy: 'sequential' as const,
};

// Critical test case: 15×8÷3=40
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

// Verify result contains "40"
assert(result.messages.some(msg => 
  msg.content?.includes("40")
), "Expected final answer to contain 40");
```

### VANILLA Testing Patterns

```typescript
// Test VANILLA tool calling with free models
const vanillaTests = [
  {
    name: "Simple Single Tool Call",
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    input: "What is 25 multiplied by 8?",
    expectedTools: ["multiply"],
    expectedResult: "200"
  },
  {
    name: "Multi-Step Sequential",
    model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    input: "Calculate 15×8 then divide by 3",
    expectedTools: ["multiply", "divide"],
    expectedResult: "40"
  },
  {
    name: "Complex Multi-Step",
    model: "mistralai/devstral-small:free",
    input: "Add 50 and 30, then multiply by 2, then subtract 10",
    expectedTools: ["add", "multiply", "subtract"],
    expectedResult: "150"
  }
];

for (const test of vanillaTests) {
  console.log(`Testing: ${test.name}`);
  // Run test with specified model
  // Verify expected tools were called
  // Verify final result matches expected
}
```

---

## 🚨 Common Configuration Issues & Solutions

### 1. Free Model Quotas & Rate Limits

**Problem**: Rate limits on free models
**Solution**: Use smart strategy with proper fallback

```typescript
const providers = {
  primary: [
    // Multiple free providers for redundancy
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: { "HTTP-Referer": "https://yourapp.com" }
    }),
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: { "HTTP-Referer": "https://yourapp-backup.com" }
    }),
    googleOpenAI, // Google free tier
  ],
  fallback: [
    openai, // Paid fallback when quotas exhausted
  ]
};

const options = {
  providerStrategy: 'smart', // Sequential for free, racing for paid
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 2000, // Wait longer between retries
    maxDelayMs: 15000,
  }
};
```

### 2. VANILLA Tool Calling Issues

**Problem**: JSON parsing failures
**Solution**: Framework includes automatic JSON repair

```typescript
// Built-in repair strategies:
const repairStrategies = [
  jsonStr,                           // Original
  jsonStr + '}',                     // Add missing closing brace
  jsonStr.replace(/,\s*$/, '') + '}', // Remove trailing comma
  jsonStr.replace(/([^"}])$/, '$1"}'), // Add missing quote and brace
];

// Sequential execution enforced automatically
if (toolCallMatches.length > 1) {
  console.log(`Sequential execution: Processing first of ${toolCallMatches.length} tool calls`);
}
```

**Problem**: Multi-step execution errors
**Solution**: Enhanced system prompts and sequential enforcement

```typescript
// System prompt includes explicit sequential instructions
const systemPrompt = `
CRITICAL RULES:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call
4. Example: "area 15×8 then divide by 3" = multiply(15,8) → get result → divide(result,3)
`;
```

### 3. Provider Configuration Issues

**Problem**: API key not found
**Solution**: Verify environment variable loading

```bash
# Debug environment loading
echo "OpenRouter: ${OPENROUTER_API_KEY:0:10}..."
echo "Google: ${GOOGLE_API_KEY:0:10}..."
echo "OpenAI: ${OPENAI_API_KEY:0:10}..."
```

**Problem**: Provider selection confusion
**Solution**: Use explicit provider models and IDs

```typescript
// Clear provider identification
const providerModels: Record<string, string> = {
  'openrouter-vanilla': 'mistralai/mistral-small-3.2-24b-instruct:free',
  'google-openai': 'models/gemini-2.0-flash-thinking-exp',
  'openai': 'gpt-4o-mini',
};

// Debug provider usage
if (result.debug) {
  result.debug.providerHistory.forEach((p, i) => {
    console.log(`Step ${i + 1}: ${p.id}${p.model ? ` (${p.model})` : ''}`);
  });
}
```

### 4. Memory Management Issues

**Problem**: Conversation history too long
**Solution**: Intelligent pruning with system message preservation

```typescript
const options = {
  maxHistoryLength: 50,           // Limit total messages
  preserveSystemMessages: true,   // Keep system context
};

// Pruning logic preserves:
// - All system messages
// - Recent conversation context
// - Tool call results
```

### 5. Multi-Agent Coordination Issues

**Problem**: Agent selection conflicts
**Solution**: Clear capability definitions and scoring

```typescript
const capabilities = {
  id: "specialized-agent",
  domains: ["specific_domain"],     // Clear domain boundaries
  specialization: SpecializationLevel.EXPERT,
  providerPreference: {
    type: "free-first",
    fallbackEnabled: true
  },
  maxConcurrentTasks: 2,           // Prevent overload
};

// Task matching with clear scoring
interface TaskMatch {
  score: number;      // 0-1, how well agent matches
  confidence: number; // 0-1, agent's confidence
  reasoning: string;  // Explanation for selection
}
```

---

## 🎯 Production Configuration

### Recommended Production Setup

```typescript
import { ConversationAgent } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";
import { googleOpenAI } from "ceata/providers/googleOpenAI";
import { openai } from "ceata/providers/openai";

// Production-optimized provider configuration
const productionProviders = {
  primary: [
    // Primary free providers with proper headers
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: {
        "HTTP-Referer": "https://yourapp.com",
        "X-Title": "Your Production App",
      },
      timeoutMs: 25000, // Slightly shorter timeout
    }),
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: {
        "HTTP-Referer": "https://yourapp-backup.com",
        "X-Title": "Your Production App Backup",
      },
      timeoutMs: 25000,
    }),
    googleOpenAI,
  ],
  fallback: [
    // Reliable paid fallback
    openai,
  ]
};

const productionOptions = {
  maxSteps: 10,                    // Conservative limit
  maxHistoryLength: 30,            // Optimized memory usage
  providerStrategy: 'smart' as const, // Cost-optimized
  preserveSystemMessages: true,     // Maintain context
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 8000,
    jitter: true,
  },
  timeoutMs: 30000,                // Production timeout
};

const agent = new ConversationAgent();

// Production execution with monitoring
const result = await agent.run(
  messages,
  tools,
  productionProviders,
  productionOptions,
  providerModels
);

// Log production metrics
console.log(`Execution: ${result.metrics.duration}ms`);
console.log(`Cost savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`Provider calls: ${result.metrics.providerCalls}`);
```

### Production Environment Variables

```bash
# Production .env
OPENROUTER_API_KEY=prod_openrouter_key_here
GOOGLE_API_KEY=prod_google_key_here
OPENAI_API_KEY=prod_openai_key_here

# Production timeouts
DEFAULT_TIMEOUT_MS=30000
OPENROUTER_TIMEOUT_MS=25000
GOOGLE_TIMEOUT_MS=25000
OPENAI_TIMEOUT_MS=35000

# Production models
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Performance tuning
DEFAULT_MAX_TOKENS=4000
OPENROUTER_MAX_TOKENS=4000
OPENAI_MAX_TOKENS=4000
DEFAULT_TEMPERATURE=0.7
```

### Health Monitoring

```typescript
// Production health checks
async function healthCheck() {
  const providers = [
    createVanillaOpenRouterProvider(),
    googleOpenAI,
  ];
  
  const healthResults = await Promise.allSettled(
    providers.map(async provider => {
      const start = Date.now();
      try {
        await provider.chat({
          model: "test-model",
          messages: [{ role: "user", content: "Health check" }],
          timeoutMs: 5000,
        });
        return { 
          provider: provider.id, 
          status: 'healthy', 
          latency: Date.now() - start 
        };
      } catch (error) {
        return { 
          provider: provider.id, 
          status: 'unhealthy', 
          error: error.message 
        };
      }
    })
  );
  
  return healthResults;
}

// Monitor every 5 minutes in production
setInterval(healthCheck, 5 * 60 * 1000);
```

---

## 🌟 Advanced Configuration Patterns

### Custom Provider Integration

```typescript
import { Provider, ChatOptions, ChatResult } from "ceata";

// Implement custom provider
const customProvider: Provider = {
  id: "custom-provider",
  supportsTools: true,
  async chat(options: ChatOptions): Promise<ChatResult> {
    const { model, messages, tools, timeoutMs } = options;
    
    // Custom implementation
    const response = await customApiCall(model, messages, tools, timeoutMs);
    
    return {
      messages: [...messages, {
        role: "assistant",
        content: response.content,
        tool_calls: response.toolCalls,
      }],
      finishReason: response.toolCalls ? "tool_call" : "stop",
      usage: response.usage,
    };
  }
};

// Use in provider group
const providers = {
  primary: [customProvider],
  fallback: [openai]
};
```

### Dynamic Configuration Updates

```typescript
// Runtime configuration updates
updateConfig({
  providers: {
    openai: {
      maxTokens: 8000,       // Increase for complex tasks
      timeoutMs: 60000,      // Longer timeout
    },
    openrouter: {
      temperature: 0.5,      // More deterministic
    }
  },
  defaults: {
    temperature: 0.5,
    maxTokens: 6000,
  }
});

// Environment-specific configurations
const configs = {
  development: {
    defaults: { timeoutMs: 10000 },
    providers: { openai: { maxTokens: 2000 } }
  },
  staging: {
    defaults: { timeoutMs: 20000 },
    providers: { openai: { maxTokens: 4000 } }
  },
  production: {
    defaults: { timeoutMs: 30000 },
    providers: { openai: { maxTokens: 4000 } }
  }
};

updateConfig(configs[process.env.NODE_ENV || 'development']);
```

### Advanced Memory Management

```typescript
// Custom memory management for specific use cases
const advancedOptions = {
  maxHistoryLength: 100,           // Extended history
  preserveSystemMessages: true,    // Keep system context
  
  // Custom pruning could be implemented by extending AgentContext
  // The framework automatically:
  // - Preserves system messages
  // - Keeps recent conversation context
  // - Maintains tool call results
  // - Prunes older non-essential messages
};

// For very long conversations, consider periodic summarization
async function summarizeConversation(messages: ChatMessage[]) {
  const summaryProvider = createVanillaOpenRouterProvider();
  const summaryResult = await summaryProvider.chat({
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    messages: [
      {
        role: "system",
        content: "Summarize the key points from this conversation, preserving important context and decisions."
      },
      ...messages.slice(-20) // Last 20 messages
    ],
    timeoutMs: 15000,
  });
  
  return summaryResult.messages[summaryResult.messages.length - 1].content;
}
```

---

## 🎯 Configuration Best Practices

### 1. **Free-First Strategy**
Always configure free models as primary providers with paid models as fallback.

```typescript
// ✅ Recommended
const providers = {
  primary: [vanillaOpenRouter, googleOpenAI],
  fallback: [openai]
};

// ❌ Avoid
const providers = {
  primary: [openai], // Expensive first
  fallback: [vanillaOpenRouter] // Free as fallback
};
```

### 2. **Provider Headers for Free Models**
Include proper HTTP headers for OpenRouter free models to avoid rate limiting.

```typescript
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://yourapp.com", // Required for free tier
    "X-Title": "Your App Name",
  },
});
```

### 3. **Smart Strategy Configuration**
Use smart strategy to automatically optimize for cost and performance.

```typescript
const options = {
  providerStrategy: 'smart', // Automatic optimization
  retryConfig: {
    maxRetries: 3,           // Reasonable retry count
    baseDelayMs: 1000,       // Progressive backoff
    maxDelayMs: 10000,
    jitter: true,            // Avoid thundering herd
  }
};
```

### 4. **Debugging During Development**
Enable comprehensive debugging during development, disable in production.

```typescript
const developmentOptions = {
  maxSteps: 15,              // Higher limit for debugging
  // Debug info automatically tracked in result.debug
};

const productionOptions = {
  maxSteps: 10,              // Conservative limit
  timeoutMs: 30000,          // Production timeout
};
```

### 5. **Tool Design Patterns**

```typescript
// ✅ Good tool design
const weatherTool = defineTool({
  name: "get_weather",
  description: "Get current weather for a specific city",
  parameters: {
    type: "object",
    properties: {
      city: { 
        type: "string", 
        description: "City name (e.g., 'Chișinău', 'New York')" 
      },
      units: { 
        type: "string", 
        enum: ["celsius", "fahrenheit"],
        description: "Temperature units"
      }
    },
    required: ["city"]
  },
  execute: async ({ city, units = "celsius" }) => {
    // Robust implementation with error handling
    try {
      const weather = await fetchWeather(city, units);
      return {
        city,
        temperature: weather.temperature,
        description: weather.description,
        units
      };
    } catch (error) {
      throw new Error(`Weather data unavailable for ${city}: ${error.message}`);
    }
  },
});
```

### 6. **Multi-Agent Best Practices**

```typescript
// ✅ Clear agent specialization
const moldovaAgent: AgentCapabilities = {
  id: "moldova-expert",
  domains: ["moldova", "legal", "travel"], // Specific domains
  languages: ["ro", "ru", "en"],           // Supported languages
  specialization: SpecializationLevel.EXPERT, // Clear level
  localKnowledge: {
    // Comprehensive local context
    cities: ["Chișinău", "Bălți", "Cahul"],
    currencies: ["MDL", "EUR"],
    culturalNotes: { /* ... */ }
  },
  maxConcurrentTasks: 2, // Reasonable limit
};
```

---

## 📚 Configuration Reference Summary

### Required Environment Variables
```bash
OPENROUTER_API_KEY=    # For free models via VANILLA
GOOGLE_API_KEY=        # For Google free tier
```

### Optional Environment Variables
```bash
OPENAI_API_KEY=        # For paid fallback
*_TIMEOUT_MS=          # Provider timeouts
*_MAX_TOKENS=          # Token limits
*_DEFAULT_MODEL=       # Default models
*_TEMPERATURE=         # Model parameters
```

### Key Configuration Interfaces
- `AgentOptions`: Core agent behavior
- `ProviderGroup`: Provider organization
- `AgenticConfig`: System-wide configuration
- `AgentCapabilities`: Multi-agent specialization
- `PerformanceMetrics`: Execution monitoring

### Provider Strategies
- **smart**: Sequential free → paid fallback (recommended)
- **racing**: Parallel execution for speed
- **sequential**: One-by-one execution for quota preservation

### Agent Types
- **ConversationAgent**: Production-ready standard pipeline
- **QuantumConversationAgent**: Advanced planning with quantum intelligence

---

**Ceata's configuration system enables you to build a coordinated **ceată** of AI providers and agents that work together efficiently, cost-effectively, and reliably across any scale of deployment.**

*The framework's VANILLA tool calling breakthrough democratizes agentic AI, making advanced capabilities available with free models while maintaining production-grade reliability and performance.*