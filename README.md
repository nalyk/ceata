# Ceata – Universal AI Agent Framework

> **Ceata** (pronounced /ˈt͡ʃe.a.ta/) is the Romanian word for a coordinated group. The AI agents created with this framework form exactly such a **ceată**: independent minds working towards a common goal.

**TypeScript AI framework that makes advanced tool calling work with ANY model** – including free models that don't natively support function calling. Built for cost-effective AI with production-ready reliability.

---

## 🎯 What Makes Ceata Special?

### The VANILLA Tool Calling Innovation

Ceata's breakthrough innovation is **VANILLA tool calling** – using prompt engineering and text parsing to give ANY language model tool calling capabilities, even free models that don't support native function calling APIs.

```typescript
// ❌ This FAILS with free models like Mistral-Small:free
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  body: JSON.stringify({
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    tools: [{ name: "multiply", ... }] // API returns "No endpoints found that support tool use"
  })
});

// ✅ This WORKS with VANILLA approach
const vanillaProvider = createVanillaOpenRouterProvider();
const result = await agent.run(messages, tools, { primary: [vanillaProvider] });
// Uses prompt engineering + text parsing to enable tool calling
```

### Pipeline Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ PLANNER         │───▶│ EXECUTOR        │───▶│ REFLECTOR       │
│ Task Analysis   │    │ Provider Racing │    │ Quality Check   │
│ Step Planning   │    │ Tool Execution  │    │ Error Recovery  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🚀 Free-First Strategy

**Ceata prioritizes free models** and only falls back to paid ones when necessary:

```typescript
const providers = [
  // FREE models with VANILLA tool calling
  { p: vanillaOpenRouter, model: "mistralai/mistral-small-3.2-24b-instruct:free" },
  { p: googleAI, model: "models/gemini-2.0-flash-thinking-exp" },
  
  // PAID fallback (only when free models exhausted)
  { p: openai, model: "gpt-4o-mini" }
];
```

**Result**: Significant cost savings while maintaining reliability through intelligent provider management.

---

## 📦 Quick Start

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
cp .env.example .env # Add your API keys
npm run build

# Try it out
npm run example          # Basic math agent
npm run example:quantum  # Advanced quantum planning
npm test                 # Run test suite
```

### Basic Usage

```typescript
import { ConversationAgent, defineTool } from "ceata";
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

// Define tools that work with ANY model
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

// Create agent with VANILLA provider (works with free models)
const agent = new ConversationAgent();
const provider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "My Ceata Agent",
  },
});

const tools = { multiply: multiplyTool };
const providerGroup = { primary: [provider], fallback: [] };

// Execute with automatic tool calling
const result = await agent.run(
  [
    {
      role: "user",
      content: "Calculate 15 times 8"
    }
  ],
  tools,
  providerGroup,
  { maxSteps: 10 }
);

console.log(result.messages[result.messages.length - 1].content);
// Works even with free models!
```

---

## 🔧 Core Features

### VANILLA Tool Calling
- **Universal Compatibility**: Works with ANY language model
- **Prompt Engineering**: Enhanced system prompts teach models to output structured tool calls
- **Text Parsing**: Robust JSON extraction with multiple repair strategies
- **Sequential Execution**: Ensures proper step-by-step tool execution

### Provider System
- **Provider Racing**: Multiple providers compete for fastest response
- **Intelligent Fallback**: Automatic failover to backup providers
- **Free-First Strategy**: Prioritizes free models, uses paid ones only when needed
- **Provider Health**: Tracks provider success/failure rates

### Pipeline Architecture
- **Planner**: Analyzes tasks and creates execution plans
- **Executor**: Handles provider racing and tool execution
- **Reflector**: Quality assurance and error recovery
- **Agent Context**: Manages conversation state and metrics

---

## 🧠 Two Agent Types

### ConversationAgent
Standard pipeline agent with intelligent planning:

```typescript
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();
const result = await agent.run(messages, tools, providers);
```

### QuantumConversationAgent
Advanced agent with enhanced planning capabilities:

```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();
const result = await quantumAgent.run(messages, tools, providers);
// Includes HTN decomposition, Tree-of-Thoughts, and intent recognition
```

---

## 🛠️ Available Providers

### VANILLA OpenRouter (Recommended for Free Models)
```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers/openrouterVanilla";

const provider = createVanillaOpenRouterProvider();
// Uses prompt engineering for tool calling with free models
```

### Standard Providers
```typescript
import { openai } from "ceata/providers/openai";
import { googleOpenAI } from "ceata/providers/googleOpenAI";
import { createOpenRouterProvider } from "ceata/providers/openrouter";

// For models with native tool calling support
```

---

## 📁 Project Structure

```
src/
├── core/
│   ├── ConversationAgent.ts        # Standard pipeline agent
│   ├── QuantumConversationAgent.ts # Advanced planning agent
│   ├── Planner.ts                  # Task planning engine
│   ├── QuantumPlanner.ts          # Advanced planning with HTN
│   ├── Executor.ts                 # Provider racing + tool execution
│   ├── Reflector.ts               # Quality assurance
│   └── AgentContext.ts            # State management
├── providers/
│   ├── openrouterVanilla.ts       # VANILLA tool calling
│   ├── openrouter.ts              # Standard OpenRouter
│   ├── google.ts                  # Google AI
│   └── openai.ts                  # OpenAI
└── examples/
    ├── mathAgent.ts               # Basic math demonstration
    ├── quantumMathAgent.ts        # Advanced planning demo
    └── testCorrectAnswer.ts       # Correctness verification
```

---

## 🧪 Testing & Examples

### Available Examples
```bash
npm run example                    # Basic math agent
npm run example:quantum           # Quantum planning agent
npm run example:test-correctness  # Sequential execution test (15×8÷3=40)
npm run example:memory            # Memory management demo
npm run example:pipeline          # Pipeline architecture demo
```

### Test Suite
```bash
npm test                          # Full test suite
npm run test:vanilla              # VANILLA tool calling tests
npm run test:quantum              # Quantum planning tests
npm run test:integration          # Integration tests
```

---

## 🌟 Real-World Performance

### The Critical Test Case
**Problem**: "Calculate the area of a rectangle that is 15 units long and 8 units wide, then divide that area by 3."

**Expected**: 15 × 8 = 120, then 120 ÷ 3 = 40

**Ceata Result**: ✅ Perfect sequential execution with correct answer (40)

This proves that Ceata's VANILLA tool calling and pipeline architecture can handle complex multi-step reasoning with free models.

---

## 💰 Cost Effectiveness

### Free Model Strategy
- **Mistral-Small 3.2 24B**: Free on OpenRouter
- **DeepSeek R1 8B**: Free on OpenRouter  
- **Google Gemini 2.0 Flash**: Free on Google AI Studio
- **Fallback to GPT-4o-mini**: Only when free models fail

### Typical Cost Savings
- **Before**: $0.03-0.06 per 1K tokens (GPT-4 class models)
- **After**: $0.00 for most operations (free models)
- **Savings**: 90%+ reduction in AI costs

---

## ⚙️ Configuration

### Environment Setup
```bash
# .env file
OPENROUTER_API_KEY=your_key_here    # For free models
GOOGLE_API_KEY=your_key_here        # For Gemini free tier
OPENAI_API_KEY=your_key_here        # Fallback only
```

### Provider Configuration
```typescript
const providers = [
  { p: vanillaOpenRouter1, model: "mistralai/mistral-small-3.2-24b-instruct:free", priority: "primary" },
  { p: vanillaOpenRouter2, model: "deepseek/deepseek-r1-0528-qwen3-8b:free", priority: "primary" },
  { p: googleAI, model: "models/gemini-2.0-flash-thinking-exp", priority: "primary" },
  { p: openai, model: "gpt-4o-mini", priority: "fallback" }
];
```

---

## 🚨 Important Limitations

### Free Model Constraints
- Most free models don't support native tool calling APIs
- Rate limits and quotas may apply
- Performance varies between free models
- Sequential tool execution may be slower than parallel

### VANILLA Tool Calling
- Relies on prompt engineering (model-dependent quality)
- Text parsing can occasionally fail with malformed JSON
- Sequential execution prevents parallel tool calls
- Requires careful prompt design for complex scenarios

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Add tests**: Extend the test suite in `src/__tests__/`
4. **Follow TypeScript strict mode**: All code must compile without errors
5. **Document changes**: Update examples and documentation
6. **Submit a pull request**

### Development Guidelines
- Test with both free and paid models
- Use VANILLA providers for universal compatibility
- Implement proper error handling with fallback providers
- Follow the pipeline architecture patterns

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🎯 The Ceata Advantage

**Ceata democratizes advanced AI capabilities:**

- **🆓 Free-First**: Works with free models through VANILLA tool calling
- **🔧 Universal**: Any model, any tool, any provider
- **🏗️ Pipeline**: Professional architecture with proper error handling  
- **💰 Cost-Effective**: 90%+ cost reduction while maintaining quality
- **🧪 Production-Ready**: Comprehensive testing and TypeScript safety

**Ready to build cost-effective AI agents?**

```bash
npm install ceata
```

---

Built with ❤️ and intelligent engineering – where AI agents form a coordinated **ceată** for intelligent problem solving.