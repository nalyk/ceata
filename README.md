# CEATA – Universal AI Agent Architecture

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group—be it soldiers, haiduci, or carol singers. The AI agents created with this framework form exactly such a **ceată**: independent minds working towards a common goal.

**Intelligent AI framework featuring adaptive planning and universal model compatibility** – replacing hardcoded logic with intelligent reasoning. Built for cost-effective AI with free model compatibility and production-ready reliability.

---

## 🚀 What Makes This Framework Special?

### Intelligent Agent Architecture

The framework eliminates hardcoded logic through intelligent provider racing and universal tool calling:

```typescript
// ❌ OLD WAY: Hardcoded logic (brittle, model-specific)
if (message.includes("calculate") && message.includes("then")) {
  return { isMultiStep: true, tools: ["multiply", "divide"] };
}

// ✅ INTELLIGENT WAY: Universal compatibility
const result = await agent.run(messages, tools, providers);
// Automatically handles: provider selection, tool calling, error recovery
```

### Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AGENT CONTEXT   │───▶│ EXECUTOR        │───▶│ PROVIDER RACING │
│ Message & State │    │ Step Planning   │    │ Fastest Response│
│ Management      │    │ Tool Execution  │    │ Error Fallback  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ REFLECTOR       │    │ TOOL CALLING    │    │ RESULT          │
│ Quality Check   │    │ Universal Text  │    │ Conversation    │
│ Validation      │    │ Based Approach  │    │ Messages        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## ✨ The Philosophy of Ceată

**Ceată** represents the essence of coordinated intelligence - multiple AI agents working together like a well-orchestrated group. The framework enables this through:

- **Universal Compatibility**: Like a diverse group where everyone contributes their unique skills
- **Provider Racing**: Multiple AI providers competing and collaborating for the best outcome  
- **Intelligent Coordination**: Each component (agent, executor, reflector) plays its role perfectly
- **Shared Purpose**: All agents work towards the common goal of solving user problems effectively

---

## Cost-Effective AI Strategy

**CEATA** is designed for the **modern AI landscape** where free models have become surprisingly capable with the right architecture.

### The Cost Challenge
- Premium models (GPT-4, Claude) are powerful but expensive at scale
- Free models work well with proper prompt engineering and tool calling
- Most frameworks lock you into specific provider APIs

### The Framework Solution
```
Primary: FREE Models (OpenRouter free tier, Google AI Studio)
         ↓ (enhanced with vanilla tool calling)
Fallback: Premium Models (only when needed)
```

**Result**: Significant cost reduction while maintaining reliability through intelligent provider management.

---

## 🧠 Intelligent Framework Features

### Universal Compatibility
- **No API Lock-in**: Works with any LLM through text-based tool calling
- **Provider Agnostic**: Supports OpenAI, Google, OpenRouter, and more
- **Model Flexibility**: Free models, premium models, experimental models
- **Tool Independence**: Any tool can be integrated through simple text parsing

### Robust Architecture
- **Error Recovery**: Automatic provider fallback when failures occur
- **Provider Racing**: Multiple providers compete for fastest response
- **Sequential Logic**: Reliable multi-step execution (proven with 15×8÷3=40 test)
- **Memory Management**: Intelligent conversation pruning for cost optimization

### Production-Ready Features
- **Universal Tool Compatibility**: Works with ANY tool through vanilla calling
- **Intelligent Routing**: Smart provider selection based on task and availability
- **Type Safety**: Full TypeScript coverage for reliable development
- **Comprehensive Testing**: 82 tests covering core functionality

---

## 📦 Quick Start

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
cp .env.example .env # add your API keys
npm run build

# Run Examples
npm run example                    # Basic math agent
npm run example:quantum           # Advanced quantum planning
npm run example:test-correctness  # Verify correctness (15×8÷3=40)
npm test                         # Run test suite
```

### Basic Usage Example

```typescript
import { ConversationAgent, defineTool } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Define universal tools
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

// Create intelligent agent with pipeline architecture
const agent = new ConversationAgent();

// FREE provider with quantum intelligence
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Quantum CEATA Agent",
  },
});

const tools = { multiply: multiplyTool, divide: divideTool };

// Execute with intelligent planning
const result = await agent.run(
  [
    {
      role: "system", 
      content: "You are a helpful math assistant with intelligent planning capabilities."
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
console.log(result.messages[result.messages.length - 1].content); // Contains "40"
```

---

## 🔧 Framework Features Comparison

| Feature | Basic Approach | CEATA Framework | Improvement |
|---------|----------------|---------------------------|-------------|
| Planning Logic | Hardcoded rules | Provider racing + intelligent routing | Universal adaptability |
| Task Decomposition | Static patterns | Adaptive step planning | Dynamic breakdown |
| Error Handling | Basic retry | Provider fallback + recovery | Intelligent recovery |
| Multi-step Execution | Regex detection | Vanilla tool calling | Perfect logical flow |
| Tool Compatibility | Framework-specific | Universal text-based approach | Any model, any tool |
| Memory Management | Simple pruning | Intelligent conversation management | Optimal performance |

### Sequential Logic Correctness Test

The critical test case that proves intelligent sequential execution works:

**Input**: "Calculate area of 15×8 rectangle, then divide by 3"  
**Expected**: 15 × 8 = 120, then 120 ÷ 3 = 40  
**Framework Result**: ✅ Perfect sequential execution with correct answer (40)

---

## 🛠️ Architecture Deep Dive

### Core Framework Components

```typescript
// Main Agent Interface
export class ConversationAgent {
  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool>,
    providers: ProviderGroup,
    options?: AgentOptions
  ): Promise<ConversationResult>
}

// Unified API
export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool>,
  providers: ProviderConfig[],
  options?: AgentOptions
): Promise<ChatMessage[]>
```

### Universal Vanilla Tool Calling

The framework's breakthrough **vanilla tool calling** approach works with ANY model:

```typescript
// UNIVERSAL COMPATIBILITY: Prompt engineering + text parsing
const promptEnhancement = `
Rules for sequential tasks:
1. Make ONE tool call at a time
2. Wait for result before next tool
3. Use ACTUAL results as input to subsequent tools
4. Format: TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}
`;

// Works with: OpenRouter free models, Google AI Studio, ANY LLM
// No hardcoded function calling required!
```

---

## 📚 Complete Examples

### Available Example Scripts
```bash
npm run example                    # Basic math agent demonstration
npm run example:quantum           # Advanced quantum planning demo
npm run example:test-correctness  # Correctness verification (15×8÷3=40)
npm run example:memory            # Memory management showcase
npm run example:pipeline          # Pipeline architecture demo
npm run example:chat              # Chat with tools example
```

### Testing Scripts
```bash
npm test                          # Run full test suite (82 tests)
npm run test:vanilla              # Test vanilla tool calling specifically
npm run test:quantum              # Test quantum planning features
npm run test:integration          # End-to-end integration tests
```

---

## 🔧 Provider Setup

### Environment Configuration
```bash
# .env file
OPENROUTER_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here  # Fallback only
```

### FREE Model Strategy
```typescript
const providers = [
  // PRIMARY: Free models with quantum enhancement
  { p: vanillaOpenRouter, model: "mistralai/mistral-small-3.2-24b-instruct:free" },
  { p: googleAI, model: "models/gemini-2.0-flash-thinking-exp" },
  
  // FALLBACK: Premium only when needed
  { p: openai, model: "gpt-4o-mini" }
];
```

---

## ⚡ Advanced Quantum Features

### Intent Analysis
```typescript
// Quantum Planner automatically recognizes:
// - Sequential operations ("then", "after", "next")  
// - Parallel tasks ("and", "also", "simultaneously")
// - Conditional logic ("if", "when", "unless")
// - Tool dependencies (math → formatting → output)
```

### Hierarchical Task Networks (HTN)
```typescript
// Automatic decomposition:
"Calculate area then divide by 3" →
├── Calculate area (15 × 8)
│   └── Use multiply tool
└── Divide result by 3  
    └── Use divide tool with previous result
```

### Tree-of-Thoughts Reasoning
```typescript
// Multiple reasoning paths evaluated:
Path A: multiply(15,8) → divide(result,3) ✅ Optimal
Path B: divide(15,3) → multiply(result,8) ❌ Wrong semantics  
Path C: calculate manually → parse result ❌ Tool bypass
```

---

## 🧪 Testing & Verification

```bash
npm test                           # Full test suite
node dist/examples/testCorrectAnswer.js  # Quantum correctness
npm run build && npm run example         # Integration test
```

### Quantum Metrics
```typescript
interface QuantumMetrics {
  strategyType: 'sequential' | 'parallel' | 'adaptive';
  intentConfidence: number;           // Intent analysis accuracy
  planComplexity: number;            // Task decomposition depth  
  adaptations: number;               // Self-healing activations
  learningPatterns: string[];        // Discovered patterns
}
```

---

## 🗺️ Project Structure

```
src/
├── core/
│   ├── ConversationAgent.ts        # 🚀 Main agent implementation
│   ├── QuantumConversationAgent.ts # 🧠 Advanced planning agent
│   ├── QuantumPlanner.ts           # 🎯 Intelligent planning engine
│   ├── Executor.ts                 # ⚡ Provider racing + tools
│   ├── Reflector.ts               # 🛡️  Quality assurance
│   ├── AgentRunner.ts              # 🔧 Unified API interface
│   └── AgentContext.ts            # 📊 State management
├── providers/
│   ├── openrouterVanilla.ts       # 🆓 FREE model optimization
│   ├── openrouter.ts              # 🔧 Standard OpenRouter
│   ├── google.ts                  # 🧪 Google AI integration
│   └── openai.ts                  # 💰 OpenAI integration
├── examples/
│   ├── mathAgent.ts               # 🧮 Basic math demonstration
│   ├── quantumMathAgent.ts        # 🧠 Advanced planning demo
│   ├── testCorrectAnswer.ts       # ✅ Correctness verification
│   ├── memoryManagementExample.ts # 💾 Memory optimization
│   └── pipelineExample.ts         # 🏗️  Architecture showcase
└── __tests__/
    ├── conversationAgent.test.ts  # 🧪 Core agent tests
    ├── quantumPlanner.test.ts     # 🧠 Planning intelligence tests
    ├── vanillaToolCalling.test.ts # 🛠️  Tool calling tests
    ├── quantumIntegration.test.ts # 🔗 Integration tests
    └── tryParseJson.test.ts       # 📝 JSON parsing tests
```

---

## 🎯 Getting Started Guide

### Basic Agent Usage
```typescript
import { ConversationAgent, defineTool, runAgent } from "ceata";

// Simple unified API approach
const messages = [
  { role: "user", content: "Calculate 15 × 8 then divide by 3" }
];

const tools = {
  multiply: defineTool({...}),
  divide: defineTool({...})
};

const providers = [
  { p: freeProvider, model: "mistral-free", priority: "primary" },
  { p: premiumProvider, model: "gpt-4o-mini", priority: "fallback" }
];

const result = await runAgent(messages, tools, providers);
```

### Advanced Features Available
| Feature | Implementation | Benefit |
|---------|----------------|---------|
| Provider Racing | Multiple providers compete | Fastest response wins |
| Vanilla Tool Calling | Text-based tool invocation | Universal model compatibility |
| Memory Management | Intelligent conversation pruning | Cost and performance optimization |
| Error Recovery | Provider fallback chains | Robust execution |

---

## 🛡️ Production Readiness

### Reliability Features
- **Error Recovery**: Quantum self-healing for failed executions
- **Provider Fallback**: Intelligent degradation when free models fail
- **Memory Management**: Efficient conversation pruning  
- **Type Safety**: Full TypeScript coverage
- **Zero Dependencies**: Pure Node.js implementation

### Performance Optimizations
- **Provider Racing**: Fastest response wins
- **Parallel Tool Execution**: Concurrent tool calls when possible
- **Smart Caching**: Provider health monitoring
- **Efficient Parsing**: Structured JSON extraction

---

## 🤝 Contributing

1. **Fork & Feature Branch**: Create feature branches for new capabilities
2. **Add Tests**: Extend quantum intelligence tests in `src/__tests__/`
3. **Follow Patterns**: Use the quantum planning architecture
4. **Document**: Update examples and documentation

### Development Guidelines
- Leverage provider racing for optimal performance
- Use vanilla tool calling for universal compatibility
- Implement proper error handling with fallback providers
- Test with both free and premium models for cost optimization

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🌟 The CEATA Advantage

**CEATA** represents intelligent AI agent architecture with practical benefits:

- **🎯 Universal**: Works with any model through vanilla tool calling
- **🧠 Intelligent**: Provider racing and adaptive routing
- **🔄 Resilient**: Automatic error detection and provider fallback
- **💰 Cost-Effective**: Free-model-first strategy with premium fallbacks
- **🚀 Practical**: Production-ready with comprehensive testing

**Ready to build intelligent AI agents?**

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata && npm install && npm run build
npm run example  # Start with basic math agent
```

---

Built with ❤️ and intelligent engineering by the CEATA team - where AI agents form a coordinated **ceată** for intelligent problem solving.