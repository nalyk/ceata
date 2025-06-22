# CEATA Quantum Usage Guide

Complete guide to using CEATA with revolutionary **Quantum Intelligence**

---

## 🚀 Quick Start with Quantum Intelligence

### 1. Installation & Setup
```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
npm run build
```

### 2. Quantum Agent Usage
```typescript
import { QuantumConversationAgent, defineTool } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Define universal tools with type safety
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
  execute: async ({ a, b }) => a * b,
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
  execute: async ({ a, b }) => a / b,
});

// Create quantum-enhanced agent
const quantumAgent = new QuantumConversationAgent();

// FREE providers with universal tool calling
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Quantum CEATA Agent",
  },
});

const tools = { multiply: multiplyTool, divide: divideTool };

// Execute with Quantum Planning
const result = await quantumAgent.run(
  [
    {
      role: "system", 
      content: "You are a quantum-enhanced assistant with adaptive planning capabilities."
    },
    {
      role: "user",
      content: "Calculate the area of a rectangle that is 15 units long and 8 units wide, then divide that area by 3."
    }
  ],
  tools,
  { primary: [provider], fallback: [] },
  { maxSteps: 10, providerStrategy: 'smart' }
);

// Result: Perfect sequential execution yielding 40
console.log("Final Answer:", result.messages[result.messages.length - 1].content);
console.log("Quantum Metrics:", result.debug?.quantumMetrics);
```

---

## 🎯 Migration Strategies

### Strategy 1: Zero-Breaking Migration (Classical)
```typescript
// Your existing code continues working unchanged
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providers);
// All features work, legacy planning with modern optimizations
```

### Strategy 2: Quantum Upgrade (Recommended)
```typescript
// Drop-in quantum intelligence replacement
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();
const result = await quantumAgent.run(messages, tools, providers, options);
// Same API, revolutionary planning intelligence
```

### Strategy 3: Full Quantum Control (Advanced)
```typescript
import { QuantumPlanner, Executor, Reflector } from "ceata";

// Direct access to quantum components
const planner = new QuantumPlanner();
const intent = await planner.analyzeIntent(message, context);
const plan = await planner.decomposeTask(intent, context);
const steps = await planner.generateExecutionPaths(plan);

// Custom execution flow with quantum intelligence
```

---

## ⚡ Quantum Planning Features

### 1. Intent Recognition Engine
```typescript
// Quantum Planner automatically recognizes:
"Calculate area then divide by 3" → Sequential execution strategy
"Get weather and check calendar" → Parallel execution strategy  
"If temperature > 20, recommend outfit" → Conditional logic strategy
"Process files in batches of 10" → Iterative pattern strategy
"Find errors and fix them" → Error detection and correction strategy
```

### 2. HTN-Inspired Task Decomposition
```typescript
// Automatic hierarchical breakdown:
"Calculate area of 15×8 rectangle, then divide by 3" →

PHASE 1: Intent Analysis
├── Recognize sequential operation: "calculate...then divide"
├── Identify inputs: length=15, width=8, divisor=3
└── Determine strategy: Sequential tool execution

PHASE 2: HTN Decomposition  
├── PRIMARY TASK: Calculate area
│   ├── SUB-TASK: Identify operation (multiplication)
│   ├── TOOL CALL: multiply(15, 8)
│   └── EXPECTED RESULT: 120
└── SEQUENTIAL TASK: Divide by 3
    ├── INPUT: Previous result (120)
    ├── TOOL CALL: divide(120, 3)
    └── EXPECTED RESULT: 40

PHASE 3: Tree-of-Thoughts Validation
├── Path A: multiply(15,8) → divide(result,3) ✅ Correct semantics
├── Path B: divide(15,3) → multiply(result,8) ❌ Wrong order
└── Path C: calculate manually → return number ❌ Bypasses tools
// Selects optimal Path A
```

### 3. Self-Healing Architecture
```typescript
// Automatic error detection and recovery:
if (toolExecutionFails) {
  → Analyze error type (network, parameter, logic)
  → Generate corrective action
  → Try alternative approach
  → Switch providers if needed
  → Re-plan with different strategy
}

if (sequentialLogicBroken) {
  → Detect incorrect tool result usage
  → Regenerate plan with proper dependencies
  → Ensure result flow: multiply(15,8)=120 → divide(120,3)=40
}
```

---

## 🔧 Universal Vanilla Tool Calling

CEATA's revolutionary approach works with **ANY** model:

### Free Model Compatibility
```typescript
// Works with ALL these free models:
const freeModels = [
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "deepseek/deepseek-r1-0528-qwen3-8b:free", 
  "qwen/qwen-2.5-72b-instruct:free",
  "models/gemini-2.0-flash-thinking-exp",
  // Any model that can follow instructions!
];

// Universal prompt enhancement:
const vanillaPromptRules = `
Rules for tool usage:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time, wait for result
2. ALWAYS use the actual result from previous tool calls as input
3. Use this format: TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}
4. Never use arbitrary numbers - only given numbers and previous results

Example for "calculate 15×8 area then divide by 3":
Step 1: TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}
Wait for result: 120
Step 2: TOOL_CALL: {"name": "divide", "arguments": {"a": 120, "b": 3}}
Final result: 40
`;
```

### Provider Configuration
```typescript
// FREE-first strategy with intelligent fallback
const providers = {
  primary: [
    // FREE models with quantum enhancement
    createVanillaOpenRouterProvider(undefined, undefined, {
      headers: {
        "HTTP-Referer": "https://example.com",
        "X-Title": "Quantum Agent",
      },
    }),
    googleOpenAI,  // Free Google AI Studio
  ],
  
  fallback: [
    // Premium models only when needed
    openai,  // GPT-4o-mini as safety net
  ]
};
```

---

## 📊 Quantum Performance Monitoring

### 1. Quantum Metrics
```typescript
const result = await quantumAgent.run(messages, tools, providers);

console.log('🧠 Quantum Intelligence Report:');
console.log(`⚡ Strategy: ${result.debug?.quantumMetrics?.strategyType}`);
console.log(`🎯 Intent Confidence: ${result.debug?.quantumMetrics?.intentConfidence}`);
console.log(`📊 Plan Complexity: ${result.debug?.quantumMetrics?.planComplexity}`);
console.log(`🔄 Adaptations: ${result.debug?.quantumMetrics?.adaptations}`);
console.log(`🧪 Learning Patterns: ${result.debug?.quantumMetrics?.learningPatterns}`);

console.log('\n📈 Execution Metrics:');
console.log(`⏱️  Duration: ${result.metrics.duration}ms`);
console.log(`🛠️  Tool Executions: ${result.metrics.toolExecutions}`);
console.log(`🔄 Provider Calls: ${result.metrics.providerCalls}`);
console.log(`💰 Cost Savings: $${result.metrics.costSavings?.toFixed(4) || '0.00'}`);
```

### 2. Debug Information
```typescript
// Enable quantum debug mode
import { logger } from "ceata";
logger.setLevel('debug');

// Access detailed quantum information
if (result.debug?.quantumMetrics) {
  console.log('🧠 Intent Analysis:', result.debug.quantumMetrics.intentAnalysis);
  console.log('📋 Plan Steps:', result.debug.quantumMetrics.planSteps);
  console.log('🌳 Execution Paths:', result.debug.quantumMetrics.executionPaths);
  console.log('🔧 Adaptations:', result.debug.quantumMetrics.adaptations);
}
```

### 3. Correctness Validation
```typescript
// Test the revolutionary correctness benchmark
async function testQuantumCorrectness() {
  const testCases = [
    {
      input: "Calculate area of 15×8 rectangle, then divide by 3",
      expected: "40",
      description: "Sequential math execution"
    },
    {
      input: "Get weather for London and New York simultaneously", 
      expected: ["London", "New York"],
      description: "Parallel API calls"
    },
    {
      input: "If the number 25 is greater than 20, multiply it by 2",
      expected: "50", 
      description: "Conditional logic"
    }
  ];

  for (const test of testCases) {
    const result = await quantumAgent.run([
      { role: "user", content: test.input }
    ], tools, providers);
    
    const finalAnswer = result.messages[result.messages.length - 1].content;
    const isCorrect = Array.isArray(test.expected) 
      ? test.expected.every(e => finalAnswer.includes(e))
      : finalAnswer.includes(test.expected);
      
    console.log(`${isCorrect ? '✅' : '❌'} ${test.description}: ${isCorrect ? 'PASS' : 'FAIL'}`);
  }
}
```

---

## 🧪 Testing Patterns

### 1. Quantum Intelligence Testing
```typescript
import { QuantumPlanner } from "ceata";

// Test intent recognition
const planner = new QuantumPlanner();
const intent = await planner.analyzeIntent("Calculate 15×8 then divide by 3", context);
expect(intent.type).toBe('sequential');
expect(intent.operations).toHaveLength(2);

// Test task decomposition
const hierarchy = await planner.decomposeTask(intent, context);
expect(hierarchy.steps).toHaveLength(2);
expect(hierarchy.steps[0].tool).toBe('multiply');
expect(hierarchy.steps[1].tool).toBe('divide');

// Test path generation
const paths = await planner.generateExecutionPaths(hierarchy);
expect(paths[0].isOptimal).toBe(true);
```

### 2. Universal Tool Compatibility Testing
```typescript
// Test across different model types
const testModels = [
  { provider: vanillaOpenRouter, model: "mistralai/mistral-small-3.2-24b-instruct:free", type: "free" },
  { provider: googleOpenAI, model: "models/gemini-2.0-flash-thinking-exp", type: "experimental" },
  { provider: openai, model: "gpt-4o-mini", type: "premium" }
];

for (const modelConfig of testModels) {
  const result = await quantumAgent.run(
    testMessages, 
    tools, 
    { primary: [modelConfig.provider], fallback: [] }
  );
  
  expect(result.metrics.toolExecutions).toBeGreaterThan(0);
  console.log(`✅ ${modelConfig.type} model: ${modelConfig.model} - Compatible`);
}
```

### 3. Performance Benchmarking
```typescript
// Quantum vs Classical performance comparison
async function benchmarkQuantumVsClassical() {
  const testInput = "Calculate area of 15×8 rectangle, then divide by 3";
  
  // Classical Agent
  const classicalStart = Date.now();
  const classicalAgent = new ConversationAgent();
  const classicalResult = await classicalAgent.run([
    { role: "user", content: testInput }
  ], tools, providers);
  const classicalDuration = Date.now() - classicalStart;
  
  // Quantum Agent  
  const quantumStart = Date.now();
  const quantumAgent = new QuantumConversationAgent();
  const quantumResult = await quantumAgent.run([
    { role: "user", content: testInput }
  ], tools, providers);
  const quantumDuration = Date.now() - quantumStart;
  
  console.log('📊 Performance Comparison:');
  console.log(`Classical: ${classicalDuration}ms, Tools: ${classicalResult.metrics.toolExecutions}`);
  console.log(`Quantum: ${quantumDuration}ms, Tools: ${quantumResult.metrics.toolExecutions}`);
  
  // Verify correctness
  const classicalCorrect = classicalResult.messages[classicalResult.messages.length-1].content.includes('40');
  const quantumCorrect = quantumResult.messages[quantumResult.messages.length-1].content.includes('40');
  
  console.log(`Correctness - Classical: ${classicalCorrect ? '✅' : '❌'}, Quantum: ${quantumCorrect ? '✅' : '❌'}`);
}
```

---

## 🚨 Common Pitfalls & Solutions

### 1. Sequential Logic Issues
```typescript
// ❌ Problem: Wrong tool result usage
// LLM calls divide(15, 3) instead of divide(120, 3)

// ✅ Solution: Enhanced prompting in Quantum Planner
const sequentialPrompt = `
CRITICAL: For multi-step calculations, use the ACTUAL result from the previous step.

Example: "Calculate area of 15×8, then divide by 3"
Step 1: multiply(15, 8) = 120  ← This is the area
Step 2: divide(120, 3) = 40    ← Use the 120, not the original 15!
`;
```

### 2. Free Model Compatibility
```typescript
// ❌ Problem: Using function calling with free models
const provider = createOpenRouterProvider(); // Standard function calling

// ✅ Solution: Use vanilla tool calling approach
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Free Model Agent",
  },
});
```

### 3. Planning vs Execution Balance
```typescript
// ❌ Problem: Over-planning slows execution
const options = {
  maxPlanningSteps: 10,  // Too many planning steps
  planningTimeout: 30000 // Too much planning time
};

// ✅ Solution: Balanced quantum configuration
const options = {
  maxSteps: 10,          // Total execution steps
  providerStrategy: 'smart', // Intelligent provider selection
  quantumPlanning: true  // Enable adaptive planning
};
```

---

## 🏆 Quantum Best Practices

### 1. Universal Tool Design
```typescript
// ✅ Design tools for quantum compatibility
const universalTool = defineTool({
  name: "process_data",
  description: "Process data with specified operation",
  parameters: {
    type: "object",
    properties: {
      operation: { 
        type: "string", 
        enum: ["calculate", "format", "validate"],
        description: "Type of processing to perform"
      },
      data: { 
        type: "any", 
        description: "Input data (number, string, object)"
      },
      options: {
        type: "object",
        description: "Additional processing options"
      }
    },
    required: ["operation", "data"]
  },
  execute: async ({ operation, data, options = {} }) => {
    // Universal processing logic
    switch(operation) {
      case "calculate": return performCalculation(data, options);
      case "format": return formatData(data, options);
      case "validate": return validateData(data, options);
      default: throw new Error(`Unknown operation: ${operation}`);
    }
  }
});
```

### 2. Provider Strategy Optimization
```typescript
// ✅ Optimal provider configuration for quantum agents
const quantumProviders = {
  primary: [
    // Fast free models for initial attempts
    createVanillaOpenRouterProvider(undefined, undefined, {
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      headers: { "HTTP-Referer": "https://example.com" }
    }),
    
    // Experimental models for advanced reasoning
    googleOpenAI, // Gemini Flash Thinking
  ],
  
  fallback: [
    // Premium models for critical accuracy
    openai, // GPT-4o-mini as reliability backup
  ]
};

const quantumOptions = {
  maxSteps: 15,              // Allow complex reasoning
  providerStrategy: 'smart', // Intelligent provider selection
  quantumPlanning: true,     // Enable full quantum intelligence
  retryConfig: {
    maxRetries: 2,
    baseDelayMs: 1000
  }
};
```

### 3. Memory Management for Quantum Agents
```typescript
// ✅ Optimal memory configuration
const quantumMemoryOptions = {
  maxHistoryLength: 30,        // Sufficient for pattern learning
  preserveSystemMessages: true, // Maintain quantum intelligence context
  preservePlanningSteps: true,  // Keep planning context for learning
  adaptiveMemory: true         // Dynamic memory based on conversation complexity
};
```

### 4. Error Recovery Strategy
```typescript
// ✅ Quantum error handling
const quantumErrorHandling = {
  enableSelfHealing: true,     // Automatic error recovery
  maxAdaptations: 3,           // Limit adaptation attempts
  fallbackToClassical: true,   // Classical agent as ultimate fallback
  learningFromErrors: true     // Improve future planning from failures
};
```

---

## 🎯 Quantum Checklist

Before deploying quantum agents to production:

### Intelligence Verification
- ✅ **Intent recognition tested** across different domains
- ✅ **Sequential logic verified** with correctness tests
- ✅ **HTN decomposition working** for complex tasks
- ✅ **Tree-of-Thoughts reasoning** generating optimal paths
- ✅ **Self-healing activated** for error scenarios

### Universal Compatibility  
- ✅ **Free models tested** with vanilla tool calling
- ✅ **Premium models verified** as fallback
- ✅ **Tool compatibility confirmed** across model types
- ✅ **Provider racing optimized** for cost efficiency

### Production Readiness
- ✅ **Type safety verified** across quantum components
- ✅ **Memory management configured** for long conversations
- ✅ **Error handling implemented** with graceful degradation
- ✅ **Performance monitoring** for quantum metrics
- ✅ **Backwards compatibility** with legacy systems

### Correctness Validation
- ✅ **Benchmark test passing**: 15×8÷3 = 40
- ✅ **Multi-domain testing** beyond just math
- ✅ **Edge case handling** for complex scenarios
- ✅ **Learning system functioning** for continuous improvement

**With quantum intelligence verified, your agents will achieve unprecedented adaptability and correctness!** 🧠✨