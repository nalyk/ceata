# Ceata Usage Guide

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group. The AI agents created with this framework form exactly such a **ceată**: independent minds working towards a common goal.

Complete guide to building intelligent AI agents with CEATA's universal framework for cost-effective, production-ready AI applications.

---

## 🚀 Quick Start

### Installation & Setup

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
npm run build
```

### Environment Variables

```bash
# Required for free models
export OPENROUTER_API_KEY="your_openrouter_key"

# Optional premium fallbacks
export OPENAI_API_KEY="your_openai_key"
export GOOGLE_API_KEY="your_google_ai_key"
```

### Your First Agent

```typescript
import { ConversationAgent, defineTool } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

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
  execute: async ({ a, b }) => a + b,
});

// Create a VANILLA provider for free models
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "My Ceata Agent",
  },
});

// Run the agent
const agent = new ConversationAgent();
const result = await agent.run(
  [
    { role: "system", content: "You are a helpful math assistant." },
    { role: "user", content: "What is 25 plus 17?" }
  ],
  { add: addTool },
  { primary: [provider], fallback: [] },
  { maxSteps: 5 }
);

console.log(result.messages[result.messages.length - 1].content);
// Output: "25 plus 17 equals 42."
```

---

## 🎯 Core Concepts

### The Ceată Philosophy

CEATA's power comes from coordinated intelligence - multiple components working together:

- **ConversationAgent**: The orchestrator that manages the conversation flow
- **Providers**: Different AI services (free and premium) working as a team
- **Tools**: Capabilities that extend what your agents can do
- **VANILLA Tool Calling**: Universal approach that works with ANY model

### Provider Strategy

CEATA uses a "free-first" strategy to minimize costs while maintaining reliability:

```typescript
const providers = {
  primary: [
    // FREE models first (VANILLA tool calling)
    vanillaOpenRouter1,  // Mistral 3.2 free
    vanillaOpenRouter2,  // DeepSeek R1 free
    googleOpenAI,        // Gemini 2.0 free
  ],
  fallback: [
    // Premium models only when needed
    openai,              // GPT-4o-mini
  ]
};
```

---

## 🛠️ VANILLA Tool Calling

CEATA's revolutionary approach that makes tool calling work with ANY model, including free ones.

### How VANILLA Works

Instead of relying on API-native tool calling (which most free models don't support), VANILLA uses:

1. **Enhanced System Prompt**: Teaches the model how to format tool calls
2. **Text Parsing**: Extracts tool calls from model responses
3. **Tool Execution**: Runs tools and injects results back into conversation
4. **Sequential Logic**: Ensures proper multi-step execution

### VANILLA Example

```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Create VANILLA provider
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "VANILLA Tool Agent",
  },
});

// Define math tools
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
  execute: async ({ a, b }) => {
    console.log(`🧮 Multiplying ${a} × ${b} = ${a * b}`);
    return a * b;
  },
});

const divideTool = defineTool({
  name: "divide",
  description: "Divide two numbers",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number", description: "Dividend" },
      b: { type: "number", description: "Divisor" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }) => {
    if (b === 0) throw new Error("Cannot divide by zero");
    console.log(`🧮 Dividing ${a} ÷ ${b} = ${a / b}`);
    return a / b;
  },
});

// Run multi-step calculation
const agent = new ConversationAgent();
const result = await agent.run(
  [
    {
      role: "system",
      content: "You are a math assistant. Use tools for ALL calculations. For multi-step problems, make one tool call at a time."
    },
    {
      role: "user", 
      content: "Calculate the area of a 15×8 rectangle, then divide that area by 3."
    }
  ],
  { multiply: multiplyTool, divide: divideTool },
  { primary: [vanillaProvider], fallback: [] },
  { maxSteps: 10 }
);

// Expected output:
// 🧮 Multiplying 15 × 8 = 120
// 🧮 Dividing 120 ÷ 3 = 40
// Final answer: "The area is 120, and when divided by 3, you get 40."
```

### Supported Free Models

VANILLA tool calling works with these free models:

```typescript
const freeModels = [
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "deepseek/deepseek-r1-0528-qwen3-8b:free", 
  "qwen/qwen-2.5-72b-instruct:free",
  "models/gemini-2.0-flash-thinking-exp",
  // Any text model that can follow instructions!
];
```

---

## 🏗️ Building Complex Agents

### Multi-Tool Agent Example

```typescript
import { ConversationAgent, defineTool } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";
import { googleOpenAI } from "ceata/providers/googleOpenAI";

// Create multiple providers for redundancy
const vanillaProvider1 = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Multi-Tool Agent",
  },
});

const vanillaProvider2 = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com", 
    "X-Title": "Multi-Tool Agent Backup",
  },
});

// Define a suite of tools
const tools = {
  // Math tools
  add: defineTool({
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
  }),

  multiply: defineTool({
    name: "multiply", 
    description: "Multiply two numbers",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" },
      },
      required: ["a", "b"],
    },
    execute: async ({ a, b }) => a * b,
  }),

  // Text processing tool
  analyze_text: defineTool({
    name: "analyze_text",
    description: "Analyze text and return word count and character count",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to analyze" },
      },
      required: ["text"],
    },
    execute: async ({ text }) => {
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      const characters = text.length;
      return { words, characters, text_length: characters };
    },
  }),

  // Data formatting tool
  format_data: defineTool({
    name: "format_data",
    description: "Format data into a specific structure",
    parameters: {
      type: "object",
      properties: {
        data: { type: "any", description: "Data to format" },
        format: { type: "string", enum: ["json", "table", "list"] },
      },
      required: ["data", "format"],
    },
    execute: async ({ data, format }) => {
      switch (format) {
        case "json":
          return JSON.stringify(data, null, 2);
        case "table":
          if (Array.isArray(data)) {
            return data.map((item, i) => `Row ${i + 1}: ${JSON.stringify(item)}`).join('\n');
          }
          return `Item: ${JSON.stringify(data)}`;
        case "list":
          if (Array.isArray(data)) {
            return data.map((item, i) => `• ${item}`).join('\n');
          }
          return `• ${data}`;
        default:
          return String(data);
      }
    },
  }),
};

// Configure provider strategy
const providerGroup = {
  primary: [
    vanillaProvider1,  // Try first free provider
    vanillaProvider2,  // Backup free provider
    googleOpenAI,      // Google AI Studio (free)
  ],
  fallback: [
    // Premium providers only if free ones fail
  ]
};

const providerModels = {
  "openrouter-vanilla": "mistralai/mistral-small-3.2-24b-instruct:free",
  "google-openai": "models/gemini-2.0-flash-thinking-exp"
};

// Create the agent
const agent = new ConversationAgent();

// Example usage scenarios
async function runComplexTask() {
  const result = await agent.run(
    [
      {
        role: "system",
        content: `You are a multi-purpose assistant with access to math, text analysis, and formatting tools. 
        Use the appropriate tools for each task. For multi-step problems, complete each step in sequence.`
      },
      {
        role: "user",
        content: `I need help with several tasks:
        1. Calculate 25 * 4 and then add 10 to the result
        2. Analyze this text: "Hello world, this is a test message"
        3. Format the analysis results as a JSON structure`
      }
    ],
    tools,
    providerGroup,
    { maxSteps: 15, providerStrategy: 'smart' },
    providerModels
  );

  console.log("🎯 Multi-tool execution complete!");
  console.log("📊 Metrics:");
  console.log(`  Duration: ${result.metrics.duration}ms`);
  console.log(`  Tool Executions: ${result.metrics.toolExecutions}`);
  console.log(`  Provider Calls: ${result.metrics.providerCalls}`);
  console.log(`  Cost Savings: $${result.metrics.costSavings.toFixed(4)}`);

  return result;
}
```

### Provider Strategy Configuration

```typescript
// Smart provider configuration for different scenarios
const developmentProviders = {
  primary: [
    vanillaOpenRouter,  // Fast and free for development
  ],
  fallback: []
};

const productionProviders = {
  primary: [
    vanillaOpenRouter1,  // First choice: free model
    vanillaOpenRouter2,  // Backup: different free model
    googleOpenAI,        // Third choice: Google free tier
  ],
  fallback: [
    openai,              // Premium fallback for critical accuracy
  ]
};

const highAccuracyProviders = {
  primary: [
    openai,              // Premium models first for accuracy-critical tasks
  ],
  fallback: [
    vanillaOpenRouter,   // Free models as backup for cost optimization
  ]
};
```

---

## 🧠 Enhanced Agent with QuantumConversationAgent

For more advanced planning capabilities, use the QuantumConversationAgent:

```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();

const result = await quantumAgent.run(
  messages,
  tools,
  providers,
  { maxSteps: 10, providerStrategy: 'smart' },
  providerModels
);

// Access enhanced metrics
if (result.debug) {
  console.log("🧠 Planning Intelligence:");
  console.log(`  Strategy: ${result.debug.quantumMetrics.strategyType}`);
  console.log(`  Intent Complexity: ${result.debug.quantumMetrics.intentComplexity}`);
  console.log(`  Confidence: ${result.debug.quantumMetrics.confidenceScore}%`);
  console.log(`  Adaptations: ${result.metrics.adaptations}`);
  console.log(`  Planning Time: ${result.metrics.planningTime}ms`);
}
```

---

## 🔧 Working with Different Provider Types

### OpenRouter VANILLA (Free Models)

```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://your-site.com",
    "X-Title": "Your App Name",
  },
});
```

### OpenRouter Standard (Premium Models)

```typescript
import { createOpenRouterProvider } from "ceata/providers/openrouter";

const standardProvider = createOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://your-site.com",
    "X-Title": "Your App Name",
  },
});
```

### Google AI Studio

```typescript
import { googleOpenAI } from "ceata/providers/googleOpenAI";

// Uses GOOGLE_API_KEY environment variable
// Works with: models/gemini-2.0-flash-thinking-exp
```

### OpenAI

```typescript
import { openai } from "ceata/providers/openai";

// Uses OPENAI_API_KEY environment variable
// Works with: gpt-4o-mini, gpt-4o, etc.
```

---

## 📊 Monitoring and Debugging

### Enable Debug Logging

```typescript
import { logger } from "ceata";

logger.setLevel('debug');

// Now you'll see detailed execution logs:
// [DEBUG] 🎯 Plan created: 5 steps, strategy: iterative
// [DEBUG] ⚡ Executing step 1: chat
// [DEBUG] 🔧 Step 1 executed by: openrouter-vanilla (deepseek/deepseek-r1-0528-qwen3-8b:free)
```

### Access Execution Metrics

```typescript
const result = await agent.run(messages, tools, providers);

// Basic metrics available on all results
console.log("📊 Execution Metrics:");
console.log(`  Duration: ${result.metrics.duration}ms`);
console.log(`  Provider Calls: ${result.metrics.providerCalls}`);
console.log(`  Tool Executions: ${result.metrics.toolExecutions}`);
console.log(`  Cost Savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`  Efficiency: ${result.metrics.efficiency.toFixed(2)} steps/sec`);

// Debug information (when available)
if (result.debug) {
  console.log("\n🔍 Debug Information:");
  console.log(`  Steps Executed: ${result.debug.steps}`);
  console.log(`  Reflections: ${result.debug.reflections}`);
  console.log(`  Provider History:`);
  result.debug.providerHistory.forEach((p, i) => {
    console.log(`    Step ${i + 1}: ${p.id}${p.model ? ` (${p.model})` : ''}`);
  });
}
```

### Understanding Provider Fallback

```typescript
// The framework automatically tries providers in order:
// 1. First primary provider fails → try second primary
// 2. All primary providers fail → try first fallback
// 3. Continue until success or all providers exhausted

const providers = {
  primary: [
    vanillaOpenRouter1,  // First attempt
    vanillaOpenRouter2,  // If first fails
    googleOpenAI,        // If second fails
  ],
  fallback: [
    openai,              // If all primary fail
  ]
};

// Check which provider was actually used
if (result.debug?.providerHistory) {
  const usedProviders = result.debug.providerHistory.map(p => p.id);
  console.log("🔧 Providers used:", usedProviders);
}
```

---

## 📝 Real Example: Math Agent

Here's the complete working example from the codebase:

```typescript
import { defineTool } from "ceata/core/Tool";
import { ConversationAgent } from "ceata/core/ConversationAgent";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";
import { googleOpenAI } from "ceata/providers/googleOpenAI";
import { openai } from "ceata/providers/openai";
import { logger } from "ceata/core/logger";

// Create VANILLA providers for FREE models
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

// Define math tools
const tools = {
  add: defineTool({
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
    execute: async ({ a, b }) => {
      const result = a + b;
      console.log(`🧮 Adding ${a} + ${b} = ${result}`);
      return result;
    },
  }),

  multiply: defineTool({
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
      console.log(`🧮 Multiplying ${a} × ${b} = ${result}`);
      return result;
    },
  }),

  divide: defineTool({
    name: "divide",
    description: "Divide two numbers",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "Dividend" },
        b: { type: "number", description: "Divisor" },
      },
      required: ["a", "b"],
    },
    execute: async ({ a, b }) => {
      if (b === 0) throw new Error("Cannot divide by zero");
      const result = a / b;
      console.log(`🧮 Dividing ${a} ÷ ${b} = ${result}`);
      return result;
    },
  }),
};

// Configure intelligent provider strategy
const providers = [
  { p: vanillaOpenRouter1, model: "mistralai/mistral-small-3.2-24b-instruct:free", priority: "primary" },
  { p: vanillaOpenRouter2, model: "deepseek/deepseek-r1-0528-qwen3-8b:free", priority: "primary" },
  { p: googleOpenAI, model: "models/gemini-2.0-flash-thinking-exp", priority: "primary" },
  { p: openai, model: "gpt-4o-mini", priority: "fallback" },
];

async function runMathAgent() {
  logger.setLevel('debug');

  const agent = new ConversationAgent();
  
  // Map to expected format
  const providerGroup = {
    primary: providers.filter(p => p.priority === 'primary').map(p => p.p),
    fallback: providers.filter(p => p.priority === 'fallback').map(p => p.p)
  };
  
  const providerModels = {};
  providers.forEach(pc => {
    providerModels[pc.p.id] = pc.model;
  });

  const result = await agent.run(
    [
      {
        role: "system",
        content: "You are a helpful math assistant. Use tools for ALL calculations. For multi-step problems, make one tool call at a time, wait for results, then continue.",
      },
      {
        role: "user",
        content: "I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.",
      },
    ],
    tools,
    providerGroup,
    { maxSteps: 10, providerStrategy: 'smart' },
    providerModels
  );

  console.log("\n📝 Final conversation:");
  result.messages.forEach((msg) => {
    const emoji = msg.role === "user" ? "👤" :
                 msg.role === "assistant" ? "🤖" :
                 msg.role === "tool" ? "🔧" : "⚙️";
    console.log(`${emoji} ${msg.role}: ${msg.content}`);
  });

  console.log("\n📊 Execution Summary:");
  console.log(`  Duration: ${result.metrics.duration}ms`);
  console.log(`  Tool Executions: ${result.metrics.toolExecutions}`);
  console.log(`  Provider Calls: ${result.metrics.providerCalls}`);
  console.log(`  Cost Savings: $${result.metrics.costSavings.toFixed(4)}`);

  return result;
}

// Run the example
runMathAgent().catch(console.error);
```

**Expected Output:**
```
🧮 Multiplying 15 × 8 = 120
🧮 Dividing 120 ÷ 3 = 40

📝 Final conversation:
⚙️ system: You are a helpful math assistant...
👤 user: I need to calculate the area...
🤖 assistant: [tool call]
🔧 tool: 120
🤖 assistant: [tool call] 
🔧 tool: 40
🤖 assistant: The area is 120 square units, and when divided by 3, you get 40.

📊 Execution Summary:
  Duration: 3247ms
  Tool Executions: 2
  Provider Calls: 5
  Cost Savings: $0.0032
```

---

## 🚨 Common Pitfalls & Solutions

### 1. Free Model API Limitations

**Problem**: Free models don't support native tool calling APIs

```typescript
// ❌ This will fail with free models
const provider = createOpenRouterProvider(); // Standard function calling
```

**Solution**: Use VANILLA provider for free models

```typescript
// ✅ This works with free models
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Your App",
  },
});
```

### 2. Sequential Tool Execution Issues

**Problem**: Model tries to use original values instead of tool results

```typescript
// Model might try: divide(15, 3) instead of divide(120, 3)
```

**Solution**: Enhanced system prompts in VANILLA provider handle this automatically

```typescript
const systemPrompt = `CRITICAL: For multi-step calculations, use the ACTUAL result from the previous step.
Example: "Calculate area of 15×8, then divide by 3"
Step 1: multiply(15, 8) = 120
Step 2: divide(120, 3) = 40  ← Use the 120, not the original 15!`;
```

### 3. Provider Configuration Mistakes

**Problem**: Using same provider instance with different models

```typescript
// ❌ Wrong - same provider instance
const providers = [
  { p: openRouter, model: "model-a", priority: "primary" },
  { p: openRouter, model: "model-b", priority: "primary" }, // Same instance!
];
```

**Solution**: Create separate provider instances

```typescript
// ✅ Correct - separate instances
const providers = [
  { p: createVanillaOpenRouterProvider(), model: "model-a", priority: "primary" },
  { p: createVanillaOpenRouterProvider(), model: "model-b", priority: "primary" },
];
```

### 4. Missing Required Headers

**Problem**: OpenRouter requires specific headers for free tier access

```typescript
// ❌ Missing headers - may be rejected
const provider = createVanillaOpenRouterProvider();
```

**Solution**: Always include required headers

```typescript
// ✅ Proper headers for free tier
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://your-site.com",  // Required
    "X-Title": "Your App Name",              // Required
  },
});
```

---

## 🏆 Best Practices

### 1. Provider Strategy Design

```typescript
// ✅ Optimal free-first strategy
const providers = {
  primary: [
    // Fast free models for most tasks
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: { "HTTP-Referer": "https://example.com", "X-Title": "App" }
    }),
    googleOpenAI,  // Google AI Studio free tier
  ],
  fallback: [
    // Premium models only for critical accuracy
    openai,  // GPT-4o-mini as safety net
  ]
};
```

### 2. Tool Design for Universal Compatibility

```typescript
// ✅ Design tools to work well with VANILLA parsing
const universalTool = defineTool({
  name: "calculate_percentage",
  description: "Calculate percentage of a number",
  parameters: {
    type: "object",
    properties: {
      number: { type: "number", description: "The base number" },
      percentage: { type: "number", description: "Percentage to calculate (e.g., 15 for 15%)" },
    },
    required: ["number", "percentage"]
  },
  execute: async ({ number, percentage }) => {
    const result = (number * percentage) / 100;
    console.log(`📊 ${percentage}% of ${number} = ${result}`);
    return result;
  }
});
```

### 3. Error Handling & Debugging

```typescript
// ✅ Comprehensive error handling
try {
  const result = await agent.run(messages, tools, providers, {
    maxSteps: 10,
    providerStrategy: 'smart'
  });
  
  // Log success metrics
  console.log(`✅ Success: ${result.metrics.toolExecutions} tools, ${result.metrics.duration}ms`);
  
} catch (error) {
  console.error("❌ Agent execution failed:", error.message);
  
  // Check if it's a provider issue
  if (error.message.includes("API key")) {
    console.log("💡 Check your environment variables");
  } else if (error.message.includes("rate limit")) {
    console.log("💡 Try with fewer concurrent requests");
  }
}
```

### 4. Memory Management

```typescript
// ✅ Efficient conversation management
const options = {
  maxSteps: 15,              // Reasonable limit
  providerStrategy: 'smart', // Intelligent provider selection
  // Framework automatically manages conversation history
};
```

---

## 🧪 Testing Your Agents

### Basic Functionality Test

```typescript
async function testBasicFunctionality() {
  const agent = new ConversationAgent();
  
  const result = await agent.run(
    [
      { role: "system", content: "You are a test assistant." },
      { role: "user", content: "Add 5 and 3" }
    ],
    { add: addTool },
    { primary: [vanillaProvider], fallback: [] }
  );
  
  const finalAnswer = result.messages[result.messages.length - 1].content;
  console.log(finalAnswer.includes('8') ? '✅ Basic test PASSED' : '❌ Basic test FAILED');
}
```

### Multi-Step Logic Test

```typescript
async function testMultiStepLogic() {
  const agent = new ConversationAgent();
  
  const result = await agent.run(
    [
      { role: "system", content: "Use tools for calculations. Make one tool call at a time." },
      { role: "user", content: "Calculate 15 × 8, then divide that result by 3" }
    ],
    { multiply: multiplyTool, divide: divideTool },
    { primary: [vanillaProvider], fallback: [] }
  );
  
  const finalAnswer = result.messages[result.messages.length - 1].content;
  const hasCorrectAnswer = finalAnswer.includes('40');
  const usedBothTools = result.metrics.toolExecutions >= 2;
  
  console.log(hasCorrectAnswer && usedBothTools ? 
    '✅ Multi-step test PASSED' : 
    '❌ Multi-step test FAILED'
  );
}
```

### Provider Fallback Test

```typescript
async function testProviderFallback() {
  // Create a provider that will fail
  const failingProvider = {
    id: "failing-provider",
    supportsTools: true,
    async chat() {
      throw new Error("Simulated provider failure");
    }
  };
  
  const agent = new ConversationAgent();
  
  const result = await agent.run(
    [{ role: "user", content: "Hello" }],
    {},
    { primary: [failingProvider], fallback: [vanillaProvider] }
  );
  
  // Should succeed using fallback provider
  console.log(result.messages.length > 1 ? 
    '✅ Fallback test PASSED' : 
    '❌ Fallback test FAILED'
  );
}
```

---

## 📚 Additional Resources

### Example Files in the Repository

- `/src/examples/mathAgent.ts` - Complete math agent with VANILLA tool calling
- `/src/examples/quantumMathAgent.ts` - Enhanced agent with QuantumConversationAgent
- `/src/examples/chatWithTools.ts` - Streaming conversation with tools
- `/src/examples/testCorrectAnswer.ts` - Correctness verification test

### Key Architecture Files

- `/src/core/ConversationAgent.ts` - Main agent orchestrator
- `/src/core/QuantumConversationAgent.ts` - Enhanced planning agent
- `/src/providers/openrouterVanilla.ts` - VANILLA tool calling implementation
- `/src/core/Tool.ts` - Tool definition system

### Running the Examples

```bash
# Build the project
npm run build

# Run the math agent example
node dist/examples/mathAgent.js

# Run the quantum agent example  
node dist/examples/quantumMathAgent.js

# Run correctness test
node dist/examples/testCorrectAnswer.js
```

---

## 🎉 Summary

CEATA provides a production-ready framework for building intelligent AI agents with:

✅ **Universal Compatibility**: Works with any LLM through VANILLA tool calling  
✅ **Cost Optimization**: Free-first strategy with intelligent fallbacks  
✅ **Reliable Execution**: Proven multi-step logic and error recovery  
✅ **Production Ready**: Full TypeScript, comprehensive testing, real-world examples  
✅ **Coordinated Intelligence**: Multiple providers working together as a ceată  

The framework eliminates the complexity of managing multiple AI providers while providing the flexibility to work with any model, free or premium. Whether you're building simple math agents or complex multi-tool systems, CEATA's architecture scales to meet your needs while keeping costs low and reliability high.

*Build your ceată today - where independent AI minds work towards a common goal.* 🚀