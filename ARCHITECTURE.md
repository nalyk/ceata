# Ceata Architecture

**Ceata** (pronounced /ˈt͡ʃe.a.ta/) – the Romanian word for a coordinated group. In Ceata, AI agents form exactly such a **ceată**: independent components working in perfect coordination to deliver intelligent, cost-effective AI solutions.

---

## 🏗️ Actual Architecture Overview

Ceata is a production-ready TypeScript framework that implements a sophisticated pipeline architecture for universal AI agent capabilities. The framework's core innovation is **VANILLA tool calling** – enabling any text-based model to perform tool calling through prompt engineering and text parsing.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ CONVERSATION    │───▶│ PLANNER         │───▶│ EXECUTOR        │
│ AGENT           │    │ Step Planning   │    │ Provider Racing │
│ Entry Point     │    │ Tool Detection  │    │ Tool Execution  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AGENT CONTEXT   │    │ REFLECTOR       │    │ VANILLA TOOLS   │
│ State & Memory  │    │ Quality Check   │    │ Text-Based      │
│ Provider Groups │    │ Error Handling  │    │ Universal       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 🌟 Core Components

### 1. Conversation Agents

**Two agent implementations for different use cases:**

#### ConversationAgent (`src/core/ConversationAgent.ts`)
- **Production-ready classical agent** with optimized pipeline execution
- Smart provider selection with racing and fallback logic
- Sequential step execution with error recovery
- **Perfect for production workloads** requiring reliability

#### QuantumConversationAgent (`src/core/QuantumConversationAgent.ts`)  
- **Experimental enhanced agent** with advanced planning capabilities
- Uses QuantumPlanner for intent analysis and multi-step decomposition
- Tree-of-thoughts planning with alternative path generation
- **Best for complex tasks** requiring sophisticated reasoning

### 2. Pipeline Architecture

#### Planner (`src/core/Planner.ts`)
```typescript
class Planner {
  plan(ctx: AgentContext): Plan {
    // Analyzes user message for tool requirements
    // Detects multi-step mathematical operations
    // Creates optimized execution strategy
  }
  
  private detectMultiStepMath(content: string): boolean {
    // Recognizes patterns like "calculate area then divide by 3"
    // Returns true for sequential operations
  }
}
```

**Key Features:**
- Multi-step task detection with sequence indicators
- Tool requirement analysis based on message content
- Strategy selection: `direct`, `iterative`, `parallel_tools`

#### Executor (`src/core/Executor.ts`)
```typescript
class Executor {
  async execute(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    // Smart provider execution strategy
    // Provider racing for paid models
    // Sequential execution for free models (quota preservation)
  }
}
```

**Execution Strategies:**
- **Smart Strategy**: Sequential for free APIs, racing for paid APIs
- **Racing Strategy**: Promise.any() for maximum speed
- **Sequential Strategy**: One provider at a time for reliability

#### Reflector (`src/core/Reflector.ts`)
- Quality assurance and error correction
- Message validation and formatting
- Execution result analysis

### 3. Agent Context (`src/core/AgentContext.ts`)

**Centralized state management:**
```typescript
interface AgentContext {
  readonly messages: ChatMessage[];
  readonly tools: Record<string, Tool<any, any>>;
  readonly providers: ProviderGroup;
  readonly options: AgentOptions;
  readonly state: ConversationState;
}

interface ProviderGroup {
  readonly primary: Provider[];   // Free models tried first
  readonly fallback: Provider[];  // Premium models for fallback
}
```

---

## 🆓 VANILLA Tool Calling Innovation

**The breakthrough that democratizes AI tool calling:**

### The Problem
```typescript
// ❌ Traditional approach - API dependent
const response = await openai.chat.completions.create({
  model: "gpt-4",
  tools: [{ type: "function", function: toolSchema }]
});
// Fails with free models: "No endpoints found that support tool use"
```

### The VANILLA Solution
```typescript
// ✅ VANILLA approach - Universal compatibility
const systemPrompt = `When you need to use a tool, output:
TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}

Rules:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call`;

// Works with ANY text model!
```

### Implementation (`src/providers/openrouterVanilla.ts`)

**Four-step process:**
1. **Enhanced System Prompt**: Inject tool definitions and calling format
2. **Message Enhancement**: Convert tool results back to text format
3. **Text Parsing**: Extract tool calls using regex patterns with JSON repair
4. **Tool Execution**: Convert back to standard tool call format

```typescript
function parseManualToolCalls(content: string): {
  cleanedContent: string;
  toolCalls: any[]
} {
  // Enhanced JSON repair strategies
  const repairStrategies = [
    jsonStr,                    // Original
    jsonStr + '}',             // Add missing brace
    jsonStr.replace(/,\s*$/, '') + '}', // Remove trailing comma
  ];
  
  // Sequential execution: Only process FIRST tool call
  const toolCallMatches = content.match(/TOOL_CALL:\s*\{[^}]*\}/g);
  if (toolCallMatches?.length > 1) {
    console.log(`Sequential execution: Processing first of ${toolCallMatches.length} tool calls`);
  }
}
```

---

## 🚀 Provider System

### Provider Abstraction
```typescript
interface Provider {
  id: string;
  supportsTools: boolean;
  chat(options: ChatOptions): Promise<ChatResult>;
}
```

### Available Providers
- **OpenRouter VANILLA** (`openrouterVanilla.ts`) - Free models with VANILLA tool calling
- **Google OpenAI** (`googleOpenAI.ts`) - Google AI Studio models
- **OpenAI** (`openai.ts`) - Premium OpenAI models
- **Standard OpenRouter** (`openrouter.ts`) - OpenRouter API models

### Provider Racing & Fallback Logic
```typescript
// Smart strategy implementation
if (ctx.options.providerStrategy === 'smart') {
  // Sequential for free models (preserve quotas)
  return await this.smartProviderExecution(messages, ctx);
} else if (ctx.options.enableRacing) {
  // Racing for paid models (speed)
  return await this.raceProviders(ctx.providers.primary, messages, ctx);
}
```

---

## 📊 Performance & Metrics

### Comprehensive Tracking
```typescript
interface PerformanceMetrics {
  readonly startTime: number;
  providerCalls: number;
  toolExecutions: number;
  totalTokens: number;
  costSavings: number; // Based on free vs paid model usage
}
```

### Debug Information
```typescript
interface AgentResult {
  readonly debug?: {
    readonly plan: Plan;
    readonly steps: number;
    readonly reflections: number;
    readonly providerHistory: { id: string; model?: string }[];
  };
}
```

---

## 🧪 Testing & Reliability

### Multi-Step Task Verification
**The critical test that validates sequential execution:**
```typescript
// Input: "Calculate area of 15×8 rectangle, then divide by 3"
// Expected: 15×8=120, then 120÷3=40
// Framework Result: ✅ Correct sequential execution
```

### Comprehensive Test Suite
- **82 test cases** covering core functionality
- **Provider compatibility tests** across multiple models
- **VANILLA tool calling validation** with free models
- **Error handling and recovery** scenarios

---

## 🔧 Practical Usage

### Basic Agent Usage
```typescript
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();
const result = await agent.run(
  messages,
  tools,
  { primary: [vanillaProvider], fallback: [premiumProvider] }
);
```

### Enhanced Quantum Agent
```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent();
const result = await quantumAgent.run(messages, tools, providers);
// Includes advanced planning and intent analysis
```

### VANILLA Provider Setup
```typescript
import { createVanillaOpenRouterProvider } from "ceata/providers";

const vanillaProvider = createVanillaOpenRouterProvider(apiKey, baseUrl, {
  headers: {
    "HTTP-Referer": "https://yourapp.com",
    "X-Title": "Your App Name"
  }
});
```

---

## 🏗️ Project Structure

```
src/
├── core/
│   ├── ConversationAgent.ts      # Production-ready agent
│   ├── QuantumConversationAgent.ts # Experimental enhanced agent
│   ├── Planner.ts                # Classical step planning
│   ├── QuantumPlanner.ts         # Advanced intent-based planning
│   ├── Executor.ts               # Provider racing & tool execution
│   ├── Reflector.ts              # Quality assurance
│   ├── AgentContext.ts           # State management
│   ├── Provider.ts               # Provider interfaces
│   └── Tool.ts                   # Tool definitions
├── providers/
│   ├── openrouterVanilla.ts      # VANILLA tool calling for free models
│   ├── googleOpenAI.ts           # Google AI Studio integration
│   ├── openai.ts                 # OpenAI API integration
│   └── openrouter.ts             # Standard OpenRouter API
├── examples/
│   ├── mathAgent.ts              # Mathematical operations demo
│   ├── quantumMathAgent.ts       # Advanced planning demo
│   └── pipelineExample.ts        # Full architecture showcase
└── __tests__/
    ├── conversationAgent.test.ts # Core agent testing
    ├── vanillaToolCalling.test.ts # VANILLA approach validation
    └── quantumPlanner.test.ts    # Advanced planning tests
```

---

## 🌟 The Ceată Advantage

### Universal Compatibility
- **No API Lock-in**: Works with any text-based LLM
- **Free Model Support**: VANILLA tool calling works with free models
- **Provider Agnostic**: Easy to add new AI providers
- **Tool Independence**: Any tool can be integrated

### Production-Ready Reliability
- **Error Recovery**: Automatic provider fallback
- **Sequential Execution**: Reliable multi-step operations
- **Memory Management**: Intelligent conversation pruning
- **Type Safety**: Full TypeScript coverage

### Cost Optimization
- **Free-First Strategy**: Try free models before paid ones
- **Smart Provider Selection**: Use racing only when cost-effective
- **Quota Preservation**: Sequential execution for free APIs
- **Transparent Metrics**: Track cost savings in real-time

### Developer Experience
- **Clean Pipeline Architecture**: Separation of concerns
- **Comprehensive Debugging**: Full execution visibility
- **Flexible Configuration**: Customize behavior per use case
- **Battle-Tested**: Proven through extensive testing

---

## 🎯 Real-World Impact

**Ceata's VANILLA tool calling represents a paradigm shift:**

- **Before**: Tool calling limited to expensive models with native API support
- **After**: ANY text model can perform tool calling via prompt engineering

This democratizes AI capabilities and enables:
- **Cost-effective production deployments** using free models
- **Universal tool integration** without API dependencies  
- **Reliable multi-step task execution** across any model
- **Provider flexibility** without vendor lock-in

The framework proves that intelligent architecture can achieve what expensive APIs cannot: **universal compatibility with reliable execution at minimal cost**.

---

## 🔮 Future Considerations

### Scalability Patterns
- VANILLA approach can extend to complex nested tool calls
- Provider ecosystem can grow through standardized interfaces
- Planning capabilities can evolve with enhanced LLM integration

### Architectural Evolution
- Additional agent types for specialized use cases
- Enhanced provider racing with intelligent load balancing
- Advanced tool calling patterns for complex workflows

**Ceata represents the future of AI frameworks: intelligent, universal, and cost-effective.**