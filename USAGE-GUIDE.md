# Ceata Usage Guide

> Complete guide for using the Ceata universal AI agent framework with VANILLA tool calling and multi-agent orchestration.

---

## 🚀 Quick Start

### Installation

```bash
git clone <repository>
cd ceata
npm install
npm run build
```

### Environment Setup

```bash
# Required for free models
OPENROUTER_API_KEY=sk-or-v1-xxx

# Optional fallbacks
GOOGLE_API_KEY=xxx
OPENAI_API_KEY=sk-xxx
```

### Basic Usage

```typescript
import { runAgent, defineTool, createVanillaOpenRouterProvider } from 'ceata';

// Define a tool
const calculator = defineTool({
  name: 'add',
  description: 'Add two numbers',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  }
}, async ({ a, b }) => a + b);

// Run with free models
const result = await runAgent(
  [{ role: 'user', content: 'Add 15 and 27' }],
  { add: calculator },
  {
    primary: [createVanillaOpenRouterProvider()],
    fallback: []
  },
  { maxSteps: 5 }
);
```

---

## 🔧 Provider Configuration

### VANILLA Tool Calling (Free Models)

```typescript
import { createVanillaOpenRouterProvider } from 'ceata';

const vanillaProvider = createVanillaOpenRouterProvider({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: 'mistralai/mistral-small-3.2-24b-instruct:free'
});
```

**Supported Free Models:**
- `mistralai/mistral-small-3.2-24b-instruct:free`
- `deepseek/deepseek-r1-0528-qwen3-8b:free`
- `qwen/qwen-2.5-coder-32b-instruct`

### Standard Providers

```typescript
import { 
  createOpenRouterProvider,
  createGoogleOpenAIProvider,
  createOpenAIProvider 
} from 'ceata';

const providers = {
  primary: [
    createVanillaOpenRouterProvider(), // Free first
    createGoogleOpenAIProvider(),     // Fast fallback
  ],
  fallback: [
    createOpenAIProvider(),           // Reliable backup
    createOpenRouterProvider()        // Paid OpenRouter
  ]
};
```

---

## 🛠️ Tool Definition

### Basic Tool

```typescript
import { defineTool } from 'ceata';

const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' }
    },
    required: ['location']
  }
}, async ({ location }) => {
  // Your implementation
  return `Weather in ${location}: Sunny, 22°C`;
});
```

### Async Tool with Error Handling

```typescript
const complexTool = defineTool({
  name: 'api_call',
  description: 'Make external API call',
  parameters: {
    type: 'object',
    properties: {
      endpoint: { type: 'string' },
      data: { type: 'object' }
    },
    required: ['endpoint']
  }
}, async ({ endpoint, data }) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    throw new Error(`API call failed: ${error.message}`);
  }
});
```

---

## 🤖 Agent Usage

### ConversationAgent (Production)

```typescript
import { ConversationAgent } from 'ceata';

const agent = new ConversationAgent();

const result = await agent.run(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Calculate 15 × 8 ÷ 3' }
  ],
  { multiply, divide },
  providers,
  {
    maxSteps: 10,
    providerStrategy: 'smart',
    enableDebug: true
  }
);

console.log(result.messages);
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Cost savings: $${result.metrics.costSavings}`);
```

### QuantumConversationAgent (Advanced)

```typescript
import { QuantumConversationAgent } from 'ceata';

const quantumAgent = new QuantumConversationAgent();

const result = await quantumAgent.run(
  [{ role: 'user', content: 'Plan a complex business strategy' }],
  tools,
  providers,
  {
    maxSteps: 15,
    enableQuantumFeatures: true,
    adaptivePlanning: true
  }
);

// Access quantum metrics
console.log('Planning depth:', result.debug?.quantumMetrics?.planningDepth);
console.log('Adaptations made:', result.debug?.quantumMetrics?.adaptationCount);
```

---

## 🎭 Multi-Agent System

### Moldova Multi-Agent Setup

```typescript
import { createMoldovaMultiAgentSystem } from 'ceata/multi-agent';

const { coordinator, registry, agents } = createMoldovaMultiAgentSystem();

console.log(`Initialized ${agents.length} specialized agents:`);
agents.forEach(agent => {
  const caps = agent.getCapabilities();
  console.log(`- ${caps.id}: ${caps.domains.join(', ')}`);
});
```

### Basic Coordination

```typescript
// Simple query (UDP mode)
const result1 = await coordinator.coordinate(
  "Vremea în Chișinău?",
  { weather_api: weatherTool },
  providers
);

// Complex query (Orchestra mode)
const result2 = await coordinator.coordinate(
  "Vreau vremea în Chișinău și bilet la București și informații despre schimbarea buletinului",
  { weather_api: weatherTool, travel_search: travelTool, gov_database: govTool },
  providers
);
```

### Manual Mode Override

```typescript
// Force Orchestra mode for comprehensive analysis
const result = await coordinator.coordinate(
  userInput,
  tools,
  providers,
  { coordinationMode: 'orchestra' }
);

// Force UDP mode for speed
const result = await coordinator.coordinate(
  userInput,
  tools,
  providers,
  { coordinationMode: 'udp' }
);
```

---

## ⚙️ Configuration Options

### Agent Options

```typescript
interface AgentOptions {
  maxSteps?: number;                    // Default: 8
  maxHistoryLength?: number;            // Default: 50
  enableDebug?: boolean;                // Default: false
  providerStrategy?: 'smart' | 'racing' | 'sequential'; // Default: 'smart'
  enableRacing?: boolean;               // Default: true
  timeoutMs?: number;                   // Default: 120000
  enableQuantumFeatures?: boolean;      // Default: false
  adaptivePlanning?: boolean;           // Default: false
}
```

### Provider Strategies

#### Smart Strategy (Recommended)
```typescript
const options = {
  providerStrategy: 'smart',
  enableRacing: true
};

// Behavior:
// 1. Sequential execution for free providers (preserve quotas)
// 2. Racing for paid providers (optimize speed)
// 3. Automatic fallback on failures
```

#### Racing Strategy
```typescript
const options = {
  providerStrategy: 'racing',
  enableRacing: true
};

// Behavior: All providers compete simultaneously
// Use for: Low-latency requirements, sufficient budget
```

#### Sequential Strategy
```typescript
const options = {
  providerStrategy: 'sequential',
  enableRacing: false
};

// Behavior: Try providers one by one
// Use for: Maximum cost control, debugging
```

---

## 🔍 Debugging & Monitoring

### Debug Output

```typescript
const result = await agent.run(messages, tools, providers, {
  enableDebug: true
});

// Access debug information
console.log('Plan:', result.debug?.plan);
console.log('Steps executed:', result.debug?.steps);
console.log('Provider history:', result.debug?.providerHistory);
```

### Performance Metrics

```typescript
console.log('Execution metrics:');
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Provider calls: ${result.metrics.providerCalls}`);
console.log(`Tool executions: ${result.metrics.toolExecutions}`);
console.log(`Cost savings: $${result.metrics.costSavings}`);
console.log(`Efficiency: ${result.metrics.efficiency} ops/sec`);
```

### Error Handling

```typescript
try {
  const result = await agent.run(messages, tools, providers);
} catch (error) {
  if (error.message.includes('All providers failed')) {
    console.log('Provider issue - check API keys and quotas');
  } else if (error.message.includes('Tool execution failed')) {
    console.log('Tool issue - check tool implementation');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

---

## 🚀 Performance Optimization

### Free Model Optimization

```typescript
// Optimize for free models
const optimizedProviders = {
  primary: [
    createVanillaOpenRouterProvider({
      model: 'mistralai/mistral-small-3.2-24b-instruct:free',
      maxRetries: 2,
      timeoutMs: 30000
    }),
    createVanillaOpenRouterProvider({
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free',
      maxRetries: 1,
      timeoutMs: 20000
    })
  ],
  fallback: [
    createGoogleOpenAIProvider() // Fast paid fallback
  ]
};
```

### Memory Management

```typescript
const options = {
  maxHistoryLength: 30, // Reduce for longer conversations
  maxSteps: 6,          // Limit steps for simple tasks
};
```

### Tool Call Optimization

```typescript
// Keep tools simple and fast
const fastTool = defineTool({
  name: 'quick_calc',
  description: 'Fast calculation',
  parameters: { /* minimal schema */ }
}, async (args) => {
  // Synchronous or very fast async operation
  return result;
});
```

---

## 🏭 Production Deployment

### Environment Configuration

```bash
# Production environment
NODE_ENV=production

# Provider keys
OPENROUTER_API_KEY=sk-or-v1-xxx
GOOGLE_API_KEY=xxx
OPENAI_API_KEY=sk-xxx

# Optional: Model preferences
DEFAULT_FREE_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
DEFAULT_PAID_MODEL=gpt-4o-mini
```

### Production Agent Setup

```typescript
import { ConversationAgent, createVanillaOpenRouterProvider } from 'ceata';

const productionAgent = new ConversationAgent();

const productionProviders = {
  primary: [
    createVanillaOpenRouterProvider(), // Cost optimization
    createGoogleOpenAIProvider(),     // Reliability
  ],
  fallback: [
    createOpenAIProvider()            // Ultimate fallback
  ]
};

const productionOptions = {
  maxSteps: 8,
  maxHistoryLength: 50,
  providerStrategy: 'smart',
  timeoutMs: 60000,
  enableDebug: false
};
```

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from 'ceata/multi-agent';

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  recoveryTimeout: 30000,
  successThreshold: 3
});

const protectedExecution = async (input) => {
  return await circuitBreaker.execute(async () => {
    return await agent.run(input, tools, providers, options);
  });
};
```

---

## 🔧 Troubleshooting

### Common Issues

#### "All providers failed"
```typescript
// Check API keys
console.log('OpenRouter key:', process.env.OPENROUTER_API_KEY?.slice(0, 10));

// Test provider individually
const testProvider = createVanillaOpenRouterProvider();
try {
  const result = await testProvider.chat({
    messages: [{ role: 'user', content: 'Hello' }]
  });
  console.log('Provider working:', result);
} catch (error) {
  console.log('Provider error:', error.message);
}
```

#### VANILLA Tool Calling Issues
```typescript
// Check if model supports instruction following
const simpleTest = await vanillaProvider.chat({
  messages: [{
    role: 'user',
    content: 'Respond with exactly: TOOL_CALL: {"name": "test", "arguments": {}}'
  }]
});
console.log('VANILLA test:', simpleTest.message.content);
```

#### Multi-Step Execution Stops
```typescript
// Increase step limit
const options = {
  maxSteps: 15, // Increase from default 8
  enableDebug: true // See where it stops
};

// Check tool results
console.log('Last tool result:', result.debug?.steps);
```

#### Rate Limiting
```typescript
// Add delays between requests
const options = {
  providerStrategy: 'sequential', // Avoid racing
  timeoutMs: 180000 // Longer timeout
};
```

### Performance Issues

#### Slow Execution
```typescript
// Profile execution
const start = Date.now();
const result = await agent.run(messages, tools, providers, {
  enableDebug: true
});
console.log(`Total: ${Date.now() - start}ms`);
console.log(`Provider calls: ${result.metrics.providerCalls}`);
```

#### High Costs
```typescript
// Optimize for free models
const costOptimizedProviders = {
  primary: [
    createVanillaOpenRouterProvider(), // Free first
  ],
  fallback: [
    createGoogleOpenAIProvider()       // Only when needed
  ]
};
```

---

## 📚 Examples & Recipes

### Multi-Step Math Problem
```typescript
// From src/examples/mathAgent.ts
import { ConversationAgent, defineTool, createVanillaOpenRouterProvider } from 'ceata';

const multiply = defineTool({
  name: 'multiply',
  description: 'Multiply two numbers',
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  }
}, async ({ a, b }) => a * b);

const divide = defineTool({
  name: 'divide',
  description: 'Divide two numbers', 
  parameters: {
    type: 'object',
    properties: {
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['a', 'b']
  }
}, async ({ a, b }) => a / b);

const agent = new ConversationAgent();
const result = await agent.run(
  [{ role: 'user', content: 'Calculate 15 × 8 ÷ 3' }],
  { multiply, divide },
  {
    primary: [createVanillaOpenRouterProvider()],
    fallback: []
  }
);

console.log('Result:', result.messages[result.messages.length - 1].content);
```

### Moldova Mixed Language Query
```typescript
// From examples/multi-agent/quickDemo.ts
import { createMoldovaMultiAgentSystem } from 'ceata/multi-agent';

const { coordinator } = createMoldovaMultiAgentSystem();

const result = await coordinator.coordinate(
  "Salut, vreau să știu vremea în Chișinău și также мне нужен билет în București",
  {
    weather_api: weatherTool,
    travel_search: travelTool
  },
  providers
);

// Result: Coordinates weather and travel agents for mixed Romanian/Russian query
```

### Custom Agent with Specialized Tools
```typescript
import { SpecializedAgent, SpecializationLevel } from 'ceata/multi-agent';

const businessAgent = new SpecializedAgent({
  id: 'business-analyst',
  domains: ['business', 'finance', 'strategy'],
  languages: ['en', 'ro'],
  tools: ['market_analysis', 'financial_calc', 'competitor_research'],
  specialization: SpecializationLevel.EXPERT,
  providerPreference: { type: 'free-first', fallbackEnabled: true },
  maxConcurrentTasks: 3,
  averageResponseTime: 5000
});

const result = await businessAgent.run(
  [{ role: 'user', content: 'Analyze market opportunity for tech startup in Moldova' }],
  businessTools,
  providers
);
```

---

## 🧪 Testing

### Run Test Suite
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:examples      # Example validation
```

### Test VANILLA Tool Calling
```bash
node dist/examples/mathAgent.js
# Should execute: 15 × 8 = 120, then 120 ÷ 3 = 40
```

### Test Multi-Agent System
```bash
node dist/examples/multi-agent/quickDemo.js
# Validates UDP/Orchestra coordination
```

---

## 📖 Additional Resources

- **[Architecture](./ARCHITECTURE.md)** - Detailed system architecture
- **[Configuration](./CONFIGURATION.md)** - Complete configuration reference  
- **[Rationale](./RATIONALE.md)** - Design decisions and trade-offs
- **[Claude's Perspective](./CLAUDE.md)** - Development insights and lessons

---

*Ceata democratizes agentic AI through free model compatibility - making advanced tool calling accessible to everyone.*