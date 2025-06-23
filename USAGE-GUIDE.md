# Ceata Usage Guide

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group. The AI agents created with this framework form exactly such a **ceată**: independent minds working towards a common goal.

Complete guide to building intelligent AI agents with Ceata's universal framework for cost-effective, production-ready AI applications.

---

## 🚀 Quick Start

### Installation & Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd agentic
npm install
npm run build
```

### Available NPM Scripts

```bash
# Development
npm run build              # Compile TypeScript to dist/
npm run dev               # Watch mode compilation
npm test                  # Run all tests

# Working Examples  
npm run example           # Basic math agent (ConversationAgent)
npm run example:quantum   # Advanced quantum planning agent
npm run example:chat      # Chat with tools example
npm run example:memory    # Memory management demo
npm run example:pipeline  # Pipeline architecture demo
npm run example:test-correctness  # Correctness verification

# Testing Specific Components
npm run test:quantum      # Quantum planner tests
npm run test:vanilla      # VANILLA tool calling tests
npm run test:integration  # Integration tests
```

### Environment Variables

Create a `.env` file in the project root:

```bash
# Required for free models (VANILLA tool calling)
OPENROUTER_API_KEY=your_openrouter_key_here
GOOGLE_API_KEY=your_google_ai_key_here

# Optional premium fallbacks
OPENAI_API_KEY=your_openai_key_here

# Configuration overrides (optional)
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
OPENAI_DEFAULT_MODEL=gpt-4o-mini
DEFAULT_TIMEOUT_MS=30000
DEFAULT_MAX_TOKENS=4000
```

### Your First Agent

```typescript
import { ConversationAgent, defineTool } from "./src/index.js";
import { createVanillaOpenRouterProvider } from "./src/providers/openrouterVanilla.js";
import { googleOpenAI } from "./src/providers/googleOpenAI.js";

// Define a simple tool
const addTool = defineTool({
  name: "add",
  description: "Add two numbers together",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }: { a: number; b: number }) => {
    const result = a + b;
    console.log(`🧮 Adding ${a} + ${b} = ${result}`);
    return result;
  },
});

// Create VANILLA provider for free models
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "My Ceata Agent",
  },
});

// Set up providers with free-first strategy
const providerGroup = {
  primary: [vanillaProvider, googleOpenAI],
  fallback: [] // Add paid providers here if needed
};

const providerModels = {
  [vanillaProvider.id]: "mistralai/mistral-small-3.2-24b-instruct:free",
  [googleOpenAI.id]: "models/gemini-2.0-flash-thinking-exp"
};

const tools = { add: addTool };

// Execute with the agent
const agent = new ConversationAgent();
const result = await agent.run(
  [{ role: "user", content: "What is 5 plus 7?" }],
  tools,
  providerGroup,
  { maxSteps: 5, providerStrategy: 'smart' },
  providerModels
);

console.log(result.messages[result.messages.length - 1].content);
// Output: "Using the add tool: 5 + 7 = 12"
```

---

## 🧮 Working Example: Math Agent

This is the proven example from `src/examples/mathAgent.ts` that demonstrates VANILLA tool calling with free models:

### Complete Math Agent Implementation

```typescript
import { defineTool } from "../core/Tool.js";
import { ConversationAgent } from "../core/ConversationAgent.js";
import { logger } from "../core/logger.js";
import { createVanillaOpenRouterProvider } from "../providers/openrouterVanilla.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";

// Create multiple VANILLA providers for redundancy
const vanillaOpenRouter1 = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Ceata Math Agent",
  },
});

const vanillaOpenRouter2 = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Ceata Math Agent",
  },
});

// Define comprehensive math tools
const addTool = defineTool({
  name: "add",
  description: "Add two numbers together",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "First number" },
      b: { type: "number", description: "Second number" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }: { a: number; b: number }) => {
    const result = a + b;
    console.log(`🧮 Adding ${a} + ${b} = ${result}`);
    return result;
  },
});

const multiplyTool = defineTool({
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
    console.log(`🧮 Multiplying ${a} × ${b} = ${result}`);
    return result;
  },
});

const divideTool = defineTool({
  name: "divide",
  description: "Divide two numbers",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "Dividend (number to be divided)" },
      b: { type: "number", description: "Divisor (number to divide by)" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }: { a: number; b: number }) => {
    if (b === 0) {
      throw new Error("Cannot divide by zero");
    }
    const result = a / b;
    console.log(`🧮 Dividing ${a} ÷ ${b} = ${result}`);
    return result;
  },
});

// Configure providers with intelligent fallback logic
const providers = [
  // Primary providers (FREE - VANILLA tool calling)
  { p: vanillaOpenRouter1, model: "mistralai/mistral-small-3.2-24b-instruct:free", priority: "primary" },
  { p: vanillaOpenRouter2, model: "deepseek/deepseek-r1-0528-qwen3-8b:free", priority: "primary" },
  { p: googleOpenAI, model: config.providers.google.defaultModel, priority: "primary" },
  
  // Fallback provider (PAID - only if free options exhausted)
  { p: openai, model: config.providers.openai.defaultModel, priority: "fallback" },
];

const tools = {
  add: addTool,
  multiply: multiplyTool,
  divide: divideTool,
};

// Enable debug output
logger.setLevel('debug');

// Convert provider configuration to agent format
const providerGroup = {
  primary: providers.filter(p => p.priority === 'primary').map(p => p.p),
  fallback: providers.filter(p => p.priority === 'fallback').map(p => p.p)
};

const providerModels: Record<string, string> = {};
providers.forEach(pc => {
  providerModels[pc.p.id] = pc.model;
});

// Execute the critical test case
const agent = new ConversationAgent();

const messages = [
  {
    role: "system" as const,
    content: "You are a helpful math assistant. You MUST use the available tools to perform ALL calculations. Never calculate manually. Use this format: TOOL_CALL: {\"name\": \"multiply\", \"arguments\": {\"a\": 15, \"b\": 8}}. For multi-step problems, make one tool call at a time, wait for results, then continue.",
  },
  {
    role: "user" as const,
    content: "I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.",
  },
];

const result = await agent.run(
  messages,
  tools,
  providerGroup,
  { maxSteps: 10, providerStrategy: 'smart' },
  providerModels
);
```

### Running the Math Agent

```bash
# Try the working math agent example
npm run example
```

### Expected Output

```
🚀 Starting Math Agent Example - VANILLA TOOL CALLING
📋 Available tools: add, multiply, divide
🧠 VANILLA Strategy: Prompt engineering + text parsing for FREE models
💰 Mistral-Small-3.2:free → DeepSeek-R1:free → Google OpenAI → OpenAI (only if needed)
🛡️  VANILLA tool calling: Works with ANY model, even free ones!
🔧 Enhanced multi-step task detection + Manual tool parsing
==================================================

💭 User question: I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.

🤖 Agent thinking...

🧮 Multiplying 15 × 8 = 120
🧮 Dividing 120 ÷ 3 = 40

==================================================
📝 Final conversation:
👤 user: I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.
🤖 assistant: I'll help you calculate this step by step.

First, let me calculate the area of the rectangle:
🔧 tool: multiply(15, 8) = 120

Now let me divide that area by 3:
🔧 tool: divide(120, 3) = 40

The area of a 15×8 rectangle is 120 square units. When you divide that area by 3, you get 40 square units.

🔧 Provider history:
Step 1: openrouter-vanilla (mistralai/mistral-small-3.2-24b-instruct:free)
Step 2: openrouter-vanilla (mistralai/mistral-small-3.2-24b-instruct:free)
```

**✅ Result: Perfect sequential execution with correct answer (40)**

### Debugging the Output

```typescript
// Enable debug mode to see execution details
logger.setLevel('debug');

// Examine the result
if (result.debug) {
  console.log("📊 Execution Analysis:");
  console.log(`Steps: ${result.debug.steps}`);
  console.log(`Reflections: ${result.debug.reflections}`);
  console.log(`Provider History:`, result.debug.providerHistory);
}

// Performance metrics
console.log("⚡ Performance Metrics:");
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Tool Executions: ${result.metrics.toolExecutions}`);
console.log(`Cost Savings: $${result.metrics.costSavings}`);
```

---

## 🧠 Advanced Agent: Quantum Planning

The `QuantumConversationAgent` provides enhanced planning for complex tasks:

### Quantum Math Agent Example

```typescript
import { QuantumConversationAgent } from "ceata/core/QuantumConversationAgent";

const quantumAgent = new QuantumConversationAgent();

const result = await quantumAgent.run(
  messages,
  tools,
  providers,
  { maxSteps: 15, enableDebug: true }
);

// Quantum-specific debug information
if (result.debug?.quantumMetrics) {
  console.log("🔮 Quantum Insights:");
  console.log(`Intent Complexity: ${result.debug.quantumMetrics.intentComplexity}`);
  console.log(`Strategy Type: ${result.debug.quantumMetrics.strategyType}`);
  console.log(`Hypotheses Generated: ${result.debug.quantumMetrics.hypothesesGenerated}`);
  console.log(`Confidence Score: ${result.debug.quantumMetrics.confidenceScore}`);
}
```

### Quantum Output Example

```
🔮 Quantum Planning Active
📊 Intent Analysis: sequential_math (confidence: 0.95)
🌟 Strategy Selected: step_by_step_execution
🎯 Plan: Calculate area → Divide result → Present answer

🧮 Multiplying 15 × 8 = 120
🧮 Dividing 120 ÷ 3 = 40

🔮 Quantum Insights:
Intent Complexity: high
Strategy Type: sequential
Hypotheses Generated: 3
Confidence Score: 0.95
```

---

## 🆓 VANILLA Tool Calling: The Innovation

### What Makes VANILLA Special

VANILLA tool calling enables ANY language model to use tools through prompt engineering:

```typescript
// ❌ Traditional approach - FAILS with free models
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    tools: [{ name: "multiply", ... }] // Returns "No endpoints found that support tool use"
  })
});

// ✅ VANILLA approach - WORKS with any model
const vanillaProvider = createVanillaOpenRouterProvider();
// Uses prompt engineering + text parsing to enable tool calling
```

### How VANILLA Works

1. **Enhanced System Prompt**: Teaches models the tool calling format
2. **Text Parsing**: Extracts tool calls from model output  
3. **JSON Repair**: Fixes common formatting issues
4. **Sequential Execution**: Ensures proper step-by-step execution

```typescript
// The magic prompt that enables tool calling
const systemPrompt = `
When you need to use a tool, output exactly:
TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}

CRITICAL RULES:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call
`;
```

---

## 🔧 Tool Development Patterns

### Basic Tool Pattern

```typescript
const myTool = defineTool({
  name: "tool_name",
  description: "Clear description of what this tool does",
  parameters: {
    type: "object",
    properties: {
      param1: { type: "string", description: "Parameter description" },
      param2: { type: "number", description: "Another parameter" },
    },
    required: ["param1"],
  },
  execute: async (args) => {
    // Tool implementation
    console.log(`🔧 Executing tool with:`, args);
    return "result";
  },
});
```

### Multi-Tool Agent Pattern

```typescript
// Create a comprehensive tool suite
const tools = {
  // Math tools
  add: addTool,
  multiply: multiplyTool,
  divide: divideTool,
  
  // Text tools
  uppercase: defineTextTool(),
  lowercase: defineTextTool(),
  
  // API tools
  fetchData: defineApiTool(),
  sendNotification: defineNotificationTool(),
};

// Configure agent for multiple tool types
const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providers);
```

### Error Handling in Tools

```typescript
const safeDivideTool = defineTool({
  name: "safe_divide",
  description: "Safely divide two numbers with error handling",
  parameters: {
    type: "object",
    properties: {
      dividend: { type: "number", description: "Number to be divided" },
      divisor: { type: "number", description: "Number to divide by" },
    },
    required: ["dividend", "divisor"],
  },
  execute: async ({ dividend, divisor }) => {
    try {
      if (divisor === 0) {
        return { error: "Cannot divide by zero", result: null };
      }
      
      const result = dividend / divisor;
      console.log(`🧮 ${dividend} ÷ ${divisor} = ${result}`);
      
      return { result, error: null };
    } catch (error) {
      console.error(`❌ Division error:`, error);
      return { error: error.message, result: null };
    }
  },
});
```

---

## 🚀 Provider Strategies

### Free-First Strategy (Recommended)

```typescript
const freeFirstProviders = {
  primary: [
    // FREE models tried first
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: { "HTTP-Referer": "https://yourapp.com" }
    }),
    googleOpenAI,
  ],
  fallback: [
    // Paid models only when free quotas exhausted
    openai,
  ]
};

const options = {
  providerStrategy: 'smart' as const, // Sequential for free, racing for paid
  maxSteps: 10,
};
```

### High-Performance Strategy

```typescript
const performanceProviders = {
  primary: [
    // Racing multiple paid providers for speed
    openai,
    anthropic,
    googlePaid,
  ],
  fallback: []
};

const options = {
  providerStrategy: 'racing' as const,
  enableRacing: true,
  maxSteps: 5,
};
```

### Quota-Conscious Strategy

```typescript
const quotaProviders = {
  primary: [
    vanillaProvider1,
    vanillaProvider2,
    vanillaProvider3,
  ],
  fallback: []
};

const options = {
  providerStrategy: 'sequential' as const, // One at a time
  maxSteps: 15,
};
```

---

## 📊 Debugging & Monitoring

### Enable Debug Mode

```typescript
const debugOptions = {
  enableDebug: true,
  maxSteps: 10,
};

const result = await agent.run(messages, tools, providers, debugOptions);

// Examine debug information
if (result.debug) {
  console.log("📊 Execution Analysis:");
  console.log(`Steps: ${result.debug.steps}`);
  console.log(`Reflections: ${result.debug.reflections}`);
  console.log(`Provider History:`, result.debug.providerHistory);
}
```

### Performance Metrics

```typescript
// Available in all results
console.log("⚡ Performance Metrics:");
console.log(`Duration: ${result.metrics.duration}ms`);
console.log(`Provider Calls: ${result.metrics.providerCalls}`);
console.log(`Tool Executions: ${result.metrics.toolExecutions}`);
console.log(`Cost Savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`Efficiency: ${result.metrics.efficiency} ops/sec`);
```

### Logging Configuration

```typescript
import { logger } from "ceata";

// Set logging level for development
logger.setLevel('debug');

// View detailed execution flow
// Output: "🔧 Step 1 executed by: openrouter-vanilla (mistral-small-free)"
//         "🧮 Multiplying 15 × 8 = 120"
//         "📊 Sequential execution: Processing first of 2 tool calls"
```

---

## 🧪 Testing Your Agents

### Unit Testing Tools

```typescript
import { describe, test, expect } from 'node:test';

describe('Math Agent', () => {
  test('Sequential Math Execution', async () => {
    const messages = [
      {
        role: "user" as const,
        content: "Calculate area of 15×8 rectangle, then divide by 3"
      }
    ];

    const result = await agent.run(messages, tools, providers);
    
    // Verify correct execution
    expect(result.messages.length).toBeGreaterThan(1);
    expect(result.metrics.toolExecutions).toBe(2);
    
    // Check final answer contains expected result
    const finalMessage = result.messages[result.messages.length - 1];
    expect(finalMessage.content).toContain('40');
  });
});
```

### Integration Testing

```typescript
describe('Provider Integration', () => {
  test('VANILLA Tool Calling with Free Models', async () => {
    const vanillaProvider = createVanillaOpenRouterProvider();
    const providers = { primary: [vanillaProvider], fallback: [] };
    
    const result = await agent.run(simpleMessages, tools, providers);
    
    // Verify VANILLA approach worked
    expect(result.debug?.providerHistory[0].id).toBe('openrouter-vanilla');
    expect(result.metrics.costSavings).toBeGreaterThan(0);
  });
});
```

### Performance Testing

```typescript
describe('Performance Benchmarks', () => {
  test('Free vs Paid Model Speed', async () => {
    const freeProviders = { primary: [vanillaProvider], fallback: [] };
    const paidProviders = { primary: [openai], fallback: [] };
    
    const freeResult = await agent.run(messages, tools, freeProviders);
    const paidResult = await agent.run(messages, tools, paidProviders);
    
    console.log(`Free model time: ${freeResult.metrics.duration}ms`);
    console.log(`Paid model time: ${paidResult.metrics.duration}ms`);
    console.log(`Cost savings: $${freeResult.metrics.costSavings}`);
  });
});
```

---

## 🔄 Real-World Examples

### Customer Support Agent

```typescript
const supportTools = {
  searchKB: defineTool({
    name: "search_knowledge_base",
    description: "Search company knowledge base for answers",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
    execute: async ({ query }) => {
      // Search implementation
      return `Found relevant articles for: ${query}`;
    },
  }),
  
  createTicket: defineTool({
    name: "create_ticket",
    description: "Create support ticket for complex issues",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Ticket title" },
        description: { type: "string", description: "Issue description" },
        priority: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: ["title", "description"],
    },
    execute: async ({ title, description, priority = "medium" }) => {
      // Ticket creation logic
      return `Ticket #12345 created: ${title}`;
    },
  }),
};

// Use free models for cost-effective support
const supportAgent = new ConversationAgent();
const result = await supportAgent.run(
  customerMessages,
  supportTools,
  freeFirstProviders
);
```

### Data Analysis Agent

```typescript
const analysisTools = {
  queryDatabase: defineTool({
    name: "query_database",
    description: "Execute SQL query on the database",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to execute" },
      },
      required: ["query"],
    },
    execute: async ({ query }) => {
      // Database query implementation
      return "Query results: [data...]";
    },
  }),
  
  generateChart: defineTool({
    name: "generate_chart",
    description: "Create a chart from data",
    parameters: {
      type: "object",
      properties: {
        data: { type: "array", description: "Data to chart" },
        type: { type: "string", enum: ["bar", "line", "pie"] },
      },
      required: ["data", "type"],
    },
    execute: async ({ data, type }) => {
      // Chart generation logic
      return `Generated ${type} chart with ${data.length} data points`;
    },
  }),
};

// Use Quantum agent for complex analysis
const analysisAgent = new QuantumConversationAgent();
const result = await analysisAgent.run(
  analysisMessages,
  analysisTools,
  providers,
  { maxSteps: 20, enableDebug: true }
);
```

---

## 💡 Best Practices

### 1. **Free-First Development**
Always start with free models and add paid fallbacks:

```typescript
const providers = {
  primary: [vanillaOpenRouter, googleOpenAI],
  fallback: [openai] // Only when needed
};
```

### 2. **Clear Tool Descriptions**
Write descriptive tool names and clear parameter descriptions:

```typescript
const tool = defineTool({
  name: "calculate_mortgage_payment", // Clear, specific name
  description: "Calculate monthly mortgage payment including principal, interest, taxes, and insurance",
  parameters: {
    properties: {
      principal: { type: "number", description: "Loan amount in dollars" },
      interestRate: { type: "number", description: "Annual interest rate as decimal (e.g., 0.05 for 5%)" },
    }
  }
});
```

### 3. **Sequential Task Design**
Design multi-step tasks to work sequentially:

```typescript
// ✅ Good: Sequential steps
"First calculate the area, then divide by 3"

// ❌ Avoid: Parallel operations
"Calculate area and also check if the result is prime"
```

### 4. **Error Handling**
Always include proper error handling in tools:

```typescript
execute: async (args) => {
  try {
    const result = await performOperation(args);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Tool error:`, error);
    return { success: false, error: error.message };
  }
}
```

### 5. **Debug During Development**
Use debug mode to understand execution flow:

```typescript
const devOptions = {
  enableDebug: true,
  providerStrategy: 'sequential' as const, // Easier to debug
};
```

---

## 🎯 Production Deployment

### Environment Setup

```bash
# Production .env
OPENROUTER_API_KEY=prod_key_here
GOOGLE_API_KEY=prod_key_here
OPENAI_API_KEY=fallback_key_here

# Performance tuning
DEFAULT_TIMEOUT_MS=30000
OPENROUTER_TIMEOUT_MS=25000
DEFAULT_MAX_TOKENS=4000
```

### Production Configuration

```typescript
const productionAgent = new ConversationAgent();

const productionProviders = {
  primary: [
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: {
        "HTTP-Referer": "https://yourproductionapp.com",
        "X-Title": "Your Production App",
      },
    }),
    googleOpenAI,
  ],
  fallback: [openai]
};

const productionOptions = {
  maxSteps: 10,
  maxHistoryLength: 20,
  providerStrategy: 'smart' as const,
  enableDebug: false, // Disable in production
  timeoutMs: 30000,
};
```

### Monitoring & Alerting

```typescript
const result = await agent.run(messages, tools, providers, options);

// Log metrics for monitoring
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  duration: result.metrics.duration,
  toolExecutions: result.metrics.toolExecutions,
  costSavings: result.metrics.costSavings,
  providerUsed: result.debug?.providerHistory[0]?.id,
}));

// Alert on errors
if (result.messages[result.messages.length - 1].content.includes('error')) {
  await sendAlert('Agent execution error', result);
}
```

---

## 🎉 Success Stories

### The 15×8÷3=40 Test

This simple test case proves Ceata's reliability:

**Input**: "Calculate area of 15×8 rectangle, then divide by 3"
**Expected**: 40
**Ceata Result**: ✅ Consistent 40 across all models

**Why this matters**: Multi-step mathematical reasoning is a fundamental requirement for practical AI applications. Getting this right unlocks complex workflows.

### Cost Savings

**Real-world impact**:
- **Before Ceata**: $0.03-0.06 per 1K tokens (GPT-4)
- **With Ceata**: $0.00 for most operations (free models)
- **Savings**: 90%+ reduction in AI costs

### Universal Compatibility

**Models that work with VANILLA tool calling**:
- ✅ Mistral-Small 3.2 24B (free)
- ✅ DeepSeek-R1 8B (free)
- ✅ Qwen-2.5 (various sizes)
- ✅ Gemini 2.0 Flash (free)
- ✅ Any instruction-following LLM

---

**Ready to build your coordinated **ceată** of AI agents? Start with the math agent example and expand from there!**

```bash
npm run example          # Try the working math agent
npm run example:quantum  # Experience advanced planning
npm test                 # Run the test suite
```

The framework proves that intelligent architecture can achieve what expensive APIs cannot: **universal compatibility with reliable execution at minimal cost.**