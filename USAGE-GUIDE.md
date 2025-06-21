# CEATA Usage Guide

Complete guide to using CEATA

---

## Quick Start

### 1. Installation & Setup
```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
npm run build
```

### 2. Basic Usage
```typescript
import { runAgent, defineTool } from "ceata";

// Define tools with full type safety
const calculator = defineTool({
  name: "calculate",
  description: "Perform math calculations",
  parameters: {
    type: "object",
    properties: {
      expression: { type: "string" }
    },
    required: ["expression"]
  },
  execute: async ({ expression }: { expression: string }) => {
    return eval(expression.replace(/[^0-9+\-*/().\s]/g, ''));
  }
});

// Provider groups for racing
const providers = {
  primary: [openRouter, google],  // Free models race
  fallback: [openai]             // Paid backup
};

// Execute pipeline
const result = await runAgent(
  [{ role: "user", content: "Calculate 15 * 8 + 42" }],
  { calculator },
  providers,
  { enableRacing: true }
);
```

---

## Migration Strategies

### Strategy 1: Zero Changes
```typescript
// Your existing code works unchanged
import { runAgent } from "ceata";

const result = await runAgent(messages, tools, providers);
// All features work, optimizations applied under the hood
```

### Strategy 2: Gradual Upgrade
```typescript
// Step 1: Switch to pipeline API
import { runAgent } from "ceata";

// Step 2: Update provider format
const providers = {
  primary: legacyProviders.filter(p => p.priority === 'primary').map(p => p.p),
  fallback: legacyProviders.filter(p => p.priority === 'fallback').map(p => p.p)
};

// Step 3: Add pipeline options
const result = await runAgent(messages, tools, providers, {
  enableRacing: true,
  maxHistoryLength: 50
});
```

### Strategy 3: Full Pipeline
```typescript
import { ConversationAgent, createAgentContext } from "ceata";

const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providers, {
  maxSteps: 10,
  enableRacing: true,
  maxHistoryLength: 30,
  retryConfig: {
    maxRetries: 3,
    baseDelayMs: 1000,
    jitter: true
  }
});

// Access full metrics
console.log(`Efficiency: ${result.metrics.efficiency} ops/sec`);
console.log(`Saved: $${result.metrics.costSavings}`);
```

---

## ⚡ **Performance Optimization Guide**

### **1. Provider Racing Configuration**
```typescript
// Enable racing for maximum speed
const options = {
  enableRacing: true,  // Race primary providers
  timeoutMs: 15000     // Shorter timeout for faster fallback
};

// Optimize provider order (fastest first)
const providers = {
  primary: [
    fastOpenRouterProvider,
    googleProvider,
    // More primary providers = better racing
  ],
  fallback: [premiumProvider]
};
```

### **2. Memory Management**
```typescript
// Configure for long conversations
const options = {
  maxHistoryLength: 30,        // Keep last 30 messages
  preserveSystemMessages: true  // Always keep system context
};

// For short conversations, disable limits
const options = {
  maxHistoryLength: 0  // No pruning
};
```

### **3. Tool Optimization**
```typescript
// Design tools for parallel execution
const tools = {
  // ✅ Independent tools can run in parallel
  calculator: mathTool,
  weather: weatherTool,
  
  // ⚠️ Dependent tools run sequentially
  fileRead: readTool,
  fileWrite: writeTool  // Depends on read result
};
```

### **4. Circuit Breaker Tuning**
```typescript
const options = {
  retryConfig: {
    maxRetries: 2,        // Fewer retries for speed
    baseDelayMs: 500,     // Shorter delays
    maxDelayMs: 5000,     // Cap maximum delay
    jitter: true          // Prevent thundering herd
  }
};
```

---

## 🔧 **Advanced Usage Patterns**

### **1. Custom Planning**
```typescript
import { Planner } from "ceata";

class CustomPlanner extends Planner {
  plan(ctx: AgentContext): Plan {
    // Custom planning logic
    return super.plan(ctx);
  }
}
```

### **2. Provider Health Monitoring**
```typescript
import { MonsterAgent } from "ceata";

const agent = new MonsterAgent();
const result = await agent.run(messages, tools, providers);

// Monitor provider performance
if (result.debug) {
  console.log(`Plan strategy: ${result.debug.plan.strategy}`);
  console.log(`Reflections applied: ${result.debug.reflections}`);
}
```

### **3. JSON Strategy Customization**
```typescript
import { extractJsonBlock, generateRetryPrompt } from "ceata";

// Custom JSON extraction
const result = extractJsonBlock(modelResponse);
if (!result.success) {
  const retryPrompt = generateRetryPrompt(originalPrompt, result);
  // Send retry prompt to model
}
```

### **4. Context Management**
```typescript
import { createAgentContext, appendMessages, updateMetrics } from "ceata";

// Manual context management
let ctx = createAgentContext(messages, tools, providers);
ctx = appendMessages(ctx, newMessages);
ctx = updateMetrics(ctx, { toolExecutions: 1 });
```

---

## 📊 **Monitoring & Debugging**

### **1. Performance Metrics**
```typescript
const result = await runMonsterAgent(messages, tools, providers);

console.log('📊 Performance Report:');
console.log(`⏱️  Duration: ${result.metrics.duration}ms`);
console.log(`🔄 Provider calls: ${result.metrics.providerCalls}`);
console.log(`🛠️  Tools executed: ${result.metrics.toolExecutions}`);
console.log(`💰 Cost savings: $${result.metrics.costSavings.toFixed(4)}`);
console.log(`⚡ Efficiency: ${result.metrics.efficiency.toFixed(2)} ops/sec`);
```

### **2. Debug Information**
```typescript
// Enable debug mode
import { logger } from "ceata";
logger.setLevel('debug');

// Access debug information
if (result.debug) {
  console.log(`📋 Execution plan:`, result.debug.plan);
  console.log(`🔄 Steps executed: ${result.debug.steps}`);
  console.log(`🔍 Reflections: ${result.debug.reflections}`);
}
```

### **3. Error Handling**
```typescript
try {
  const result = await runMonsterAgent(messages, tools, providers);
} catch (error) {
  if (error.message.includes('All providers failed')) {
    console.log('Provider health report:', error.healthReport);
  }
}
```

---

## 🧪 **Testing Patterns**

### **1. Unit Testing Components**
```typescript
import { Planner, Executor, Reflector } from "ceata";

// Test individual components
const planner = new Planner();
const plan = planner.plan(testContext);
expect(plan.steps.length).toBeGreaterThan(0);
```

### **2. Integration Testing**
```typescript
import { createAgentContext } from "ceata";

// Test full pipeline
const ctx = createAgentContext(messages, tools, providers);
const result = await new MonsterAgent().run(messages, tools, providers);
expect(result.messages.length).toBeGreaterThan(messages.length);
```

### **3. Performance Testing**
```typescript
const startTime = Date.now();
const result = await runMonsterAgent(messages, tools, providers);
const duration = Date.now() - startTime;

expect(duration).toBeLessThan(5000); // Under 5 seconds
expect(result.metrics.efficiency).toBeGreaterThan(1); // At least 1 op/sec
```

---

## 🚨 **Common Pitfalls & Solutions**

### **1. Provider Racing Issues**
```typescript
// ❌ Problem: Racing with incompatible providers
const providers = {
  primary: [streamingProvider, nonStreamingProvider], // Mixed types
  fallback: []
};

// ✅ Solution: Group compatible providers
const providers = {
  primary: [streamingProvider1, streamingProvider2],
  fallback: [nonStreamingProvider]
};
```

### **2. Memory Management**
```typescript
// ❌ Problem: Unbounded conversation growth
const options = { maxHistoryLength: 0 }; // No limits

// ✅ Solution: Reasonable limits
const options = { 
  maxHistoryLength: 50,
  preserveSystemMessages: true 
};
```

### **3. Tool Dependencies**
```typescript
// ❌ Problem: Dependent tools running in parallel
const tools = {
  readFile: readTool,
  processFile: processTool  // Needs read result
};

// ✅ Solution: Design independent tools
const tools = {
  calculator: mathTool,
  weather: weatherTool,  // Completely independent
  translator: translateTool
};
```

---

## 🏆 **Best Practices**

### **1. Provider Configuration**
- 🎯 **Primary providers**: 2-3 fast, free models
- 🛡️ **Fallback providers**: 1-2 reliable, paid models
- ⚡ **Enable racing**: For maximum speed
- 🔄 **Configure timeouts**: Balance speed vs reliability

### **2. Tool Design**
- 🔧 **Small, focused tools**: Easier to parallelize
- 📊 **Type-safe parameters**: Prevent runtime errors
- ⚡ **Fast execution**: Keep tools under 1 second
- 🛡️ **Error handling**: Graceful failure modes

### **3. Memory Management**
- 📏 **Set reasonable limits**: 20-50 messages for most cases
- 🧠 **Preserve system messages**: Maintain context
- 🔄 **Monitor growth**: Watch conversation length
- 🗑️ **Prune aggressively**: For long-running sessions

### **4. Performance Monitoring**
- 📊 **Track metrics**: ops/sec, cost savings, duration
- 🔍 **Enable debug mode**: During development
- 🚨 **Set alerts**: For performance degradation
- 📈 **Optimize continuously**: Based on real usage

---

## 🎯 **MONSTER Checklist**

Before going to production, ensure:

- ✅ **Provider racing enabled** for speed
- ✅ **Memory limits configured** for long conversations
- ✅ **Tools are independent** for parallel execution
- ✅ **Error handling implemented** for graceful failures
- ✅ **Monitoring setup** for performance tracking
- ✅ **Type safety verified** across all components
- ✅ **Backwards compatibility tested** with existing code

**With these optimizations, your MONSTER will be unstoppable!** 🔥