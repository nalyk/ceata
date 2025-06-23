# Ceata Architecture

**Ceata** (pronounced /ˈt͡ʃe.a.ta/) – the Romanian word for a coordinated group. In Ceata, AI agents form exactly such a **ceată**: independent components working in perfect coordination to deliver intelligent, cost-effective AI solutions.

---

## 🏗️ Architecture Overview

Ceata is a production-ready TypeScript framework that implements a sophisticated multi-agent system with **VANILLA tool calling** – enabling any text-based model to perform tool calling through prompt engineering and text parsing. The architecture supports both single-agent pipeline execution and multi-agent coordination.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CEATA MULTI-AGENT SYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │ DUAL MODE       │───▶│ UDP AGENT       │    │ ORCHESTRA       ││
│  │ COORDINATOR     │    │ SYSTEM          │    │ ROUTER          ││
│  │ (Intelligent    │    │ (Fast Routing)  │    │ (Complex        ││
│  │  Mode Selection)│    │                 │    │  Coordination)  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AGENT EXECUTION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │ CONVERSATION    │    │ QUANTUM         │    │ SPECIALIZED     ││
│  │ AGENT           │    │ CONVERSATION    │    │ AGENTS          ││
│  │ (Production     │    │ AGENT           │    │ (Domain-        ││
│  │  Ready)         │    │ (Enhanced)      │    │  Specific)      ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PIPELINE COMPONENTS                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │ PLANNER         │───▶│ EXECUTOR        │───▶│ REFLECTOR       ││
│  │ Step Planning   │    │ Provider Racing │    │ Quality Check   ││
│  │ Tool Detection  │    │ Tool Execution  │    │ Error Handling  ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROVIDER & TOOL LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │ VANILLA TOOLS   │    │ PROVIDER SYSTEM │    │ CONFIGURATION   ││
│  │ Text-Based      │    │ Multi-Provider  │    │ Environment     ││
│  │ Universal       │    │ Racing/Fallback │    │ Variables       ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Architecture Components

### 1. Multi-Agent System Architecture

#### DualModeCoordinator (`src/multi-agent/DualModeCoordinator.ts`)
**The central intelligence that orchestrates agent selection and task routing:**

```typescript
class DualModeCoordinator {
  private udpSystem: UDPAgentSystem;
  private orchestraRouter: OrchestraRouter;
  
  async coordinate(userInput: string, tools: any, providers: any): Promise<any> {
    // 1. Intelligent mode selection (UDP vs Orchestra)
    const mode = await this.selectMode(userInput, options);
    
    // 2. Route to appropriate coordination system
    if (mode === 'udp') {
      return await this.udpSystem.route(userInput, tools, providers);
    } else {
      return await this.orchestraRouter.coordinate(userInput, tools, providers);
    }
  }
}
```

**Key Features:**
- **Universal Complexity Detection**: Uses LLM-based assessment for task complexity
- **Automatic Mode Selection**: Chooses UDP for simple tasks, Orchestra for complex ones
- **Fallback Heuristics**: Language-agnostic complexity detection when LLM fails
- **Moldova Optimizations**: Specialized patterns for optimal performance

#### UDP Agent System (`src/multi-agent/UDPAgentSystem.ts`)
**Fast routing system for simple to medium complexity tasks:**
- Direct agent-to-task matching
- Minimal coordination overhead
- Optimized for single-domain tasks
- High-performance execution

#### Orchestra Router (`src/multi-agent/OrchestraRouter.ts`)
**Sophisticated coordination for complex multi-domain tasks:**
- Multi-agent orchestration
- Cross-domain task decomposition
- Parallel execution coordination
- Result synthesis and integration

#### Agent Registry (`src/multi-agent/AgentRegistry.ts`)
**Central registry for agent management:**
- Agent capability discovery
- Health monitoring and circuit breaking
- Dynamic agent registration/deregistration
- Capability matching and routing

### 2. Agent Execution Layer

#### ConversationAgent (`src/core/ConversationAgent.ts`)
**Production-ready pipeline agent with optimized execution:**

```typescript
class ConversationAgent {
  private readonly planner = new Planner();
  private readonly executor = new Executor();
  private readonly reflector = new Reflector();

  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool<any, any>>,
    providers: ProviderGroup,
    options?: Partial<AgentOptions>
  ): Promise<AgentResult> {
    // Pipeline execution: Plan → Execute → Reflect
  }
}
```

**Key Features:**
- **Smart Provider Selection**: Racing for paid models, sequential for free models
- **Sequential Tool Execution**: Ensures proper multi-step task handling
- **Error Recovery**: Automatic provider fallback and error correction
- **Performance Metrics**: Comprehensive tracking of execution efficiency

#### QuantumConversationAgent (`src/core/QuantumConversationAgent.ts`)
**Enhanced agent with advanced planning capabilities:**
- Uses QuantumPlanner for sophisticated intent analysis
- Tree-of-thoughts planning with alternative path generation
- Enhanced multi-step task decomposition
- Experimental features for complex reasoning tasks

#### SpecializedAgent (`src/multi-agent/SpecializedAgent.ts`)
**Domain-specific agents with specialized capabilities:**
- Configurable skill sets and domain expertise
- Capability-based task matching
- Performance scoring and optimization
- Integration with multi-agent coordination

### 3. Pipeline Components

#### Planner (`src/core/Planner.ts`)
**Intelligent task analysis and execution planning:**

```typescript
class Planner {
  plan(ctx: AgentContext): Plan {
    // Multi-step task detection
    const isMultiStep = this.detectMultiStepMath(ctx.messages);
    
    // Strategy selection based on task complexity
    return {
      strategy: isMultiStep ? 'iterative' : 'direct',
      steps: this.createExecutionSteps(ctx)
    };
  }
  
  private detectMultiStepMath(content: string): boolean {
    const sequenceIndicators = [
      /then.*?(divide|multiply|add|subtract)/,
      /after.*?(calculate|compute)/,
      /area.*?(divide|multiply)/
    ];
    return sequenceIndicators.some(pattern => pattern.test(content.toLowerCase()));
  }
}
```

#### QuantumPlanner (`src/core/QuantumPlanner.ts`)
**Advanced LLM-powered planning with enhanced capabilities:**
- Intent analysis and user goal understanding
- Hierarchical task decomposition (HTN-inspired)
- Tree-of-thoughts reasoning
- Dynamic planning adaptation

#### Executor (`src/core/Executor.ts`)
**Smart provider coordination and tool execution:**

```typescript
class Executor {
  async execute(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    // Smart execution strategy
    if (ctx.options.providerStrategy === 'smart') {
      return await this.smartProviderExecution(messages, ctx);
    } else if (ctx.options.enableRacing) {
      return await this.raceProviders(ctx.providers.primary, messages, ctx);
    }
  }
}
```

**Execution Strategies:**
- **Smart Strategy**: Sequential for free APIs (quota preservation), racing for paid APIs
- **Racing Strategy**: Promise.any() for maximum speed with paid providers
- **Sequential Strategy**: One provider at a time for reliability

#### Reflector (`src/core/Reflector.ts`)
**Quality assurance and error correction:**
- Execution result validation
- Error detection and correction
- Message formatting and consistency
- Performance quality assessment

### 4. Agent Context Management

#### AgentContext (`src/core/AgentContext.ts`)
**Centralized state management for agent execution:**

```typescript
interface AgentContext {
  readonly messages: ChatMessage[];
  readonly tools: Record<string, Tool<any, any>>;
  readonly providers: ProviderGroup;
  readonly options: AgentOptions;
  readonly state: ConversationState;
  readonly metrics: PerformanceMetrics;
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

CRITICAL RULES:
1. FOR SEQUENTIAL TASKS: Make ONE tool call at a time
2. ALWAYS use actual result from previous tools
3. Wait for tool result before making next call`;

// Works with ANY text model!
```

### Implementation (`src/providers/openrouterVanilla.ts`)

**Four-step VANILLA process:**

1. **Enhanced System Prompt**: Inject tool definitions and calling format
2. **Message Enhancement**: Convert tool results back to text format
3. **Text Parsing**: Extract tool calls using regex with JSON repair strategies
4. **Tool Execution**: Convert back to standard tool call format

```typescript
function parseManualToolCalls(content: string): {
  cleanedContent: string;
  toolCalls: any[]
} {
  // Multiple JSON repair strategies
  const repairStrategies = [
    jsonStr,                    // Original
    jsonStr + '}',             // Add missing brace
    jsonStr.replace(/,\s*$/, '') + '}', // Remove trailing comma
    jsonStr.replace(/'/g, '"'), // Fix single quotes
  ];
  
  // Sequential execution: Only process FIRST tool call
  const toolCallMatches = content.match(/TOOL_CALL:\s*\{[^}]*\}/g);
  if (toolCallMatches?.length > 1) {
    console.log(`Sequential execution: Processing first of ${toolCallMatches.length} tool calls`);
  }
}
```

---

## 🚀 Provider System Architecture

### Provider Abstraction (`src/core/Provider.ts`)
```typescript
interface Provider {
  id: string;
  supportsTools: boolean;
  chat(options: ChatOptions): Promise<ChatResult>;
}
```

### Available Providers
- **OpenRouter VANILLA** (`src/providers/openrouterVanilla.ts`) - Free models with VANILLA tool calling
- **Google OpenAI** (`src/providers/googleOpenAI.ts`) - Google AI Studio models
- **OpenAI** (`src/providers/openai.ts`) - Premium OpenAI models
- **Standard OpenRouter** (`src/providers/openrouter.ts`) - OpenRouter API models
- **OpenAI-Like Base** (`src/providers/openaiLikeBase.ts`) - Base for OpenAI-compatible APIs

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

## ⚙️ Configuration System

### Environment-Based Configuration (`src/config/index.ts`)

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

**Key Features:**
- **Environment Variable Support**: Automatic .env file loading
- **Validation**: Comprehensive configuration validation
- **Runtime Updates**: Dynamic configuration updates
- **Provider-Specific Settings**: Tailored configurations per provider

### Default Models & Settings
- **OpenRouter**: `mistralai/devstral-small:free` (free model)
- **Google**: `models/gemini-2.0-flash-thinking-exp`
- **OpenAI**: `gpt-4o-mini`
- **Timeouts**: 30 seconds default
- **Temperature**: 0.7 default

---

## 📊 Performance & Monitoring

### Comprehensive Metrics (`src/core/AgentContext.ts`)
```typescript
interface PerformanceMetrics {
  readonly startTime: number;
  providerCalls: number;
  toolExecutions: number;
  totalTokens: number;
  costSavings: number; // Based on free vs paid model usage
  efficiency: number;  // Operations per second
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

### Circuit Breaker Pattern (`src/multi-agent/CircuitBreaker.ts`)
- **Failure Detection**: Automatic detection of provider failures
- **Circuit States**: CLOSED, OPEN, HALF_OPEN
- **Recovery Logic**: Gradual recovery from failures
- **Timeout Management**: Configurable timeouts and retry logic

---

## 🧪 Testing & Reliability

### Comprehensive Test Suite (`src/__tests__/`)
- **conversationAgent.test.ts**: Core agent functionality testing
- **vanillaToolCalling.test.ts**: VANILLA approach validation
- **quantumPlanner.test.ts**: Advanced planning tests
- **providerCreation.test.ts**: Provider instantiation and health
- **quantumIntegration.test.ts**: Multi-agent system integration

### Critical Test Cases

#### Multi-Step Sequential Execution
```typescript
// Input: "Calculate area of 15×8 rectangle, then divide by 3"
// Expected: 15×8=120, then 120÷3=40
// Framework Result: ✅ Correct sequential execution
```

#### Provider Fallback Validation
```typescript
// Test provider racing and fallback logic
// Verify free model → paid model cascading
// Ensure no quota exhaustion
```

#### VANILLA Tool Calling Validation
```typescript
// Test with actual free models
const testScenarios = [
  { model: "mistralai/mistral-small-3.2-24b-instruct:free", expectedTools: ["add"] },
  { model: "deepseek/deepseek-r1-0528-qwen3-8b:free", expectedTools: ["multiply", "divide"] }
];
```

---

## 🔧 Module Organization & Exports

### Main Entry Point (`src/index.ts`)
```typescript
// Core Agent Architecture
export { ConversationAgent } from "./core/ConversationAgent.js";
export { QuantumConversationAgent } from "./core/QuantumConversationAgent.js";
export { QuantumPlanner } from "./core/QuantumPlanner.js";
export * from "./core/AgentContext.js";

// Provider System
export * from "./providers/openrouter.js";
export * from "./providers/openrouterVanilla.js";
export * from "./providers/google.js";
export * from "./providers/openai.js";

// Unified Interface
export { runAgent, ProviderCache, ProviderConfig } from "./core/AgentRunner.js";
```

### Multi-Agent System (`src/multi-agent/index.ts`)
```typescript
// Multi-Agent Coordination
export { DualModeCoordinator } from './DualModeCoordinator.js';
export { SpecializedAgent } from './SpecializedAgent.js';
export { AgentRegistry, AgentHealth } from './AgentRegistry.js';
export { UDPAgentSystem } from './UDPAgentSystem.js';
export { OrchestraRouter } from './OrchestraRouter.js';
export { CircuitBreaker, CircuitState } from './CircuitBreaker.js';

// Moldova Optimization
export function createMoldovaMultiAgentSystem() {
  const registry = new AgentRegistry();
  const coordinator = new DualModeCoordinator(registry.getAllAgents());
  return { coordinator, registry };
}
```

### Project Structure
```
src/
├── core/                           # Core pipeline architecture
│   ├── ConversationAgent.ts        # Production-ready agent
│   ├── QuantumConversationAgent.ts # Enhanced experimental agent
│   ├── Planner.ts                  # Classical step planning
│   ├── QuantumPlanner.ts           # Advanced LLM-based planning
│   ├── Executor.ts                 # Provider racing & tool execution
│   ├── Reflector.ts                # Quality assurance & error handling
│   ├── AgentContext.ts             # State & context management
│   ├── AgentRunner.ts              # Unified interface
│   ├── Provider.ts                 # Provider interfaces
│   ├── Tool.ts                     # Tool definitions
│   ├── Stream.ts                   # Streaming support
│   ├── logger.ts                   # Logging utilities
│   └── http.ts                     # HTTP client utilities
├── multi-agent/                    # Multi-agent system
│   ├── DualModeCoordinator.ts      # Central coordination intelligence
│   ├── UDPAgentSystem.ts           # Fast routing system
│   ├── OrchestraRouter.ts          # Complex task orchestration
│   ├── AgentRegistry.ts            # Agent management & discovery
│   ├── SpecializedAgent.ts         # Domain-specific agents
│   ├── CircuitBreaker.ts           # Failure handling
│   ├── AgentCapabilities.ts        # Capability definitions
│   └── index.ts                    # Multi-agent exports
├── providers/                      # Provider implementations
│   ├── openrouterVanilla.ts        # VANILLA tool calling (free models)
│   ├── openrouter.ts               # Standard OpenRouter API
│   ├── googleOpenAI.ts             # Google AI Studio integration
│   ├── openai.ts                   # OpenAI API integration
│   ├── google.ts                   # Google AI integration
│   ├── openaiLikeBase.ts           # Base for OpenAI-compatible APIs
│   └── utils.ts                    # Provider utilities
├── config/                         # Configuration management
│   └── index.ts                    # Environment-based configuration
├── examples/                       # Working examples
│   ├── mathAgent.ts                # Mathematical operations demo
│   ├── quantumMathAgent.ts         # Advanced planning demo
│   ├── pipelineExample.ts          # Full architecture showcase
│   ├── chatWithTools.ts            # Basic tool calling example
│   ├── memoryManagementExample.ts  # Memory management patterns
│   └── testCorrectAnswer.ts        # Correctness validation
└── __tests__/                      # Comprehensive test suite
    ├── conversationAgent.test.ts   # Core agent testing
    ├── vanillaToolCalling.test.ts  # VANILLA approach validation
    ├── quantumPlanner.test.ts      # Advanced planning tests
    ├── quantumIntegration.test.ts  # Multi-agent integration
    ├── providerCreation.test.ts    # Provider health & creation
    ├── openrouterNormalize.test.ts # Provider normalization
    └── tryParseJson.test.ts        # JSON parsing utilities
```

---

## 🔧 Practical Usage Examples

### Single Agent Usage
```typescript
import { ConversationAgent } from "ceata";

const agent = new ConversationAgent();
const result = await agent.run(
  messages,
  tools,
  { primary: [vanillaProvider], fallback: [premiumProvider] }
);
```

### Multi-Agent System Usage
```typescript
import { createMoldovaMultiAgentSystem } from "ceata/multi-agent";

const { coordinator, registry } = createMoldovaMultiAgentSystem();
const result = await coordinator.coordinate(
  "Complex multi-domain task", 
  tools, 
  providers,
  { coordinationMode: 'auto' }
);
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

### Unified Interface (Simplified)
```typescript
import { runAgent } from "ceata";

const result = await runAgent({
  messages: [{ role: "user", content: "Calculate 15 * 8 then divide by 3" }],
  tools: { multiply, divide },
  providers: [
    { p: vanillaProvider, model: "mistral-free", priority: "primary" },
    { p: openaiProvider, model: "gpt-4o-mini", priority: "fallback" }
  ]
});
```

---

## 🌟 The Ceată Advantage

### Universal Accessibility
- **No API Lock-in**: Works with any text-based LLM
- **Free Model Support**: VANILLA tool calling democratizes AI capabilities
- **Provider Agnostic**: Easy integration of new AI providers
- **Tool Independence**: Any tool can be integrated seamlessly

### Production-Ready Reliability
- **Multi-Agent Coordination**: Intelligent task routing and agent selection
- **Error Recovery**: Automatic provider fallback and circuit breaking
- **Sequential Execution**: Reliable multi-step operations
- **Memory Management**: Intelligent conversation pruning
- **Type Safety**: Full TypeScript coverage with comprehensive interfaces

### Cost Optimization
- **Free-First Strategy**: Try free models before paid ones
- **Smart Provider Selection**: Use racing only when cost-effective
- **Quota Preservation**: Sequential execution for free APIs
- **Transparent Metrics**: Real-time cost savings tracking

### Developer Experience
- **Clean Multi-Agent Architecture**: Separation of concerns across coordination layers
- **Comprehensive Debugging**: Full execution visibility with detailed metrics
- **Flexible Configuration**: Environment-based configuration with runtime updates
- **Battle-Tested**: Proven through extensive testing across multiple scenarios

### Moldova Optimizations
- **Specialized Routing**: UDP system for fast simple tasks
- **Orchestra Coordination**: Complex multi-domain task handling
- **Universal Compatibility**: Language-agnostic complexity detection
- **Intelligent Fallbacks**: Robust error handling and recovery

---

## 🎯 Real-World Impact

**Ceata's multi-agent architecture with VANILLA tool calling represents a paradigm shift:**

- **Before**: Tool calling limited to expensive models, single-agent systems
- **After**: ANY text model can perform tool calling, coordinated multi-agent intelligence

This democratizes AI capabilities and enables:
- **Cost-effective production deployments** using coordinated free models
- **Universal tool integration** without API dependencies
- **Intelligent task routing** across specialized agents
- **Reliable multi-step execution** with error recovery
- **Provider flexibility** without vendor lock-in

The framework proves that intelligent architecture can achieve what expensive APIs cannot: **universal compatibility with coordinated intelligence at minimal cost**.

---

## 🔮 Architectural Evolution

### Current Capabilities (Implemented)
- **Dual-mode coordination** with UDP and Orchestra systems
- **VANILLA tool calling** for universal model compatibility
- **Provider racing** with smart fallback strategies
- **Multi-agent registry** with health monitoring
- **Circuit breaker** patterns for reliability
- **Environment-based configuration** with validation

### Future Extensibility Patterns
- **Additional coordination modes** for specialized use cases
- **Enhanced provider ecosystem** with intelligent load balancing
- **Advanced planning algorithms** with improved LLM integration
- **Custom agent specializations** for domain-specific tasks
- **Distributed agent networks** for scaled deployments

### Scalability Considerations
- **Modular agent architecture** supports unlimited specializations
- **Provider abstraction** enables seamless integration of new AI services
- **Configuration system** scales across deployment environments
- **Monitoring and metrics** provide operational visibility

**Ceata represents the future of AI frameworks: intelligent, coordinated, universal, and cost-effective.**

---

## 📚 Related Resources

- [CLAUDE.md](./CLAUDE.md) - Development insights and lessons learned
- [RATIONALE.md](./RATIONALE.md) - Project philosophy and design decisions
- [USAGE-GUIDE.md](./USAGE-GUIDE.md) - Comprehensive implementation guide
- [CONFIGURATION.md](./CONFIGURATION.md) - Configuration options and environment setup
- [examples/](./src/examples/) - Working code examples and demonstrations
- [examples/multi-agent/](./examples/multi-agent/) - Multi-agent system examples

---

*This document reflects the current state of Ceata's architecture as implemented in the codebase. It serves as the definitive reference for understanding the system's design, capabilities, and usage patterns.*

**The ceată grows stronger with each coordinated action – independent agents united in purpose, each contributing unique capabilities to achieve collective intelligence.**