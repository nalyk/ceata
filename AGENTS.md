# AGENTS.md - AI Agent Navigation Guide

> **CRITICAL**: This file is specifically designed for AI agents (Codex, Claude, GPT, etc.) working on the Ceata universal agentic framework. Every section provides actionable intelligence for optimal AI-driven development and codebase navigation.

**🎯 AI AGENT PRIORITY DIRECTIVES:**

- **ALWAYS** read this file completely before making ANY code changes
- **MANDATORY** understand the VANILLA tool calling paradigm before modifications
- **CRITICAL** maintain sequential execution patterns for multi-step operations
- **REQUIRED** test all changes with the provided validation scripts

---

## 🚀 AGENT QUICK START PROTOCOL

### **IMMEDIATE ACTIONS** (Execute in Order):

1. **Environment Validation**: Verify [`.env`](./.env) contains required API keys
2. **Core Test**: Run `npm run example:test-correctness` to validate 15×8÷3=40
3. **Provider Check**: Test free models via [`src/examples/mathAgent.ts`](./src/examples/mathAgent.ts)
4. **Memory Bank**: Read all files in [`memory-bank/`](./memory-bank/) directory

### **AGENT DECISION MATRIX**:

```
User Request Type → Recommended Action Path
├─ "Add new feature" → Use src/examples/ as templates
├─ "Fix bug" → Check src/__tests__/ for existing patterns
├─ "Tool calling issue" → Examine src/providers/openrouterVanilla.ts
├─ "Multi-agent task" → Use src/multi-agent/ system
├─ "Performance issue" → Check provider racing strategies
└─ "Documentation" → Update relevant .md files consistently
```

---

## 🏗️ CODEBASE ARCHITECTURE MAP

### **CORE DIRECTORIES** (Priority Order):

1. **[`src/core/`](./src/core/)** - Main pipeline architecture

   - [`ConversationAgent.ts`](./src/core/ConversationAgent.ts) - Production-ready agent
   - [`QuantumConversationAgent.ts`](./src/core/QuantumConversationAgent.ts) - Enhanced planning
   - [`Planner.ts`](./src/core/Planner.ts) - Task decomposition
   - [`Executor.ts`](./src/core/Executor.ts) - Tool execution engine
   - [`Reflector.ts`](./src/core/Reflector.ts) - Result analysis

2. **[`src/providers/`](./src/providers/)** - AI model integrations

   - [`openrouterVanilla.ts`](./src/providers/openrouterVanilla.ts) - **CRITICAL**: VANILLA tool calling
   - [`openrouter.ts`](./src/providers/openrouter.ts) - Native tool calling
   - [`google.ts`](./src/providers/google.ts) - Google AI integration
   - [`openai.ts`](./src/providers/openai.ts) - OpenAI integration

3. **[`src/multi-agent/`](./src/multi-agent/)** - Coordination system

   - [`DualModeCoordinator.ts`](./src/multi-agent/DualModeCoordinator.ts) - UDP/Orchestra modes
   - [`AgentRegistry.ts`](./src/multi-agent/AgentRegistry.ts) - Agent management
   - [`CircuitBreaker.ts`](./src/multi-agent/CircuitBreaker.ts) - Fault tolerance

4. **[`src/examples/`](./src/examples/)** - Working demonstrations

   - [`mathAgent.ts`](./src/examples/mathAgent.ts) - Basic tool calling
   - [`quantumMathAgent.ts`](./src/examples/quantumMathAgent.ts) - Enhanced planning
   - [`testCorrectAnswer.ts`](./src/examples/testCorrectAnswer.ts) - Validation script

5. **[`src/__tests__/`](./src/__tests__/)** - Comprehensive testing
   - [`vanillaToolCalling.test.ts`](./src/__tests__/vanillaToolCalling.test.ts) - VANILLA validation
   - [`conversationAgent.test.ts`](./src/__tests__/conversationAgent.test.ts) - Pipeline testing
   - [`quantumIntegration.test.ts`](./src/__tests__/quantumIntegration.test.ts) - Enhanced features

---

## 🧠 CRITICAL AGENT KNOWLEDGE

### **VANILLA Tool Calling Paradigm** (MANDATORY UNDERSTANDING):

```typescript
// BREAKTHROUGH: Any text model can do tool calling via prompt engineering
// Location: src/providers/openrouterVanilla.ts

// Instead of native API tool calling (which free models don't support):
const nativeCall = {
  tools: [{ name: "multiply", parameters: {...} }] // ❌ Fails with free models
};

// Use VANILLA approach (works with ANY instruction-following model):
const vanillaPrompt = `When you need to use a tool, output:
TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}

CRITICAL: Make ONE tool call at a time for sequential tasks`;
```

### **Sequential Execution Pattern** (CRITICAL FOR CORRECTNESS):

```typescript
// Problem: 15×8÷3 = ? (Should be 40, not 120)
// Solution: Sequential tool execution enforcement

// In parseManualToolCalls() function:
const toolCallMatches = content.match(/TOOL_CALL:\s*\{[^}]*\}/g);
if (toolCallMatches && toolCallMatches.length > 1) {
  // Only process first tool call to enforce sequencing
  console.log(
    `Sequential execution: Processing first of ${toolCallMatches.length} tool calls`
  );
}
```

### **Provider Selection Intelligence**:

```typescript
// Agent decision logic for provider selection:
const providerStrategy = {
  free_models: [
    "mistralai/mistral-small-3.2-24b-instruct:free",
    "deepseek/deepseek-r1-0528-qwen3-8b:free",
    "qwen/qwen-2.5-72b-instruct:free",
  ],
  use_vanilla: true, // MANDATORY for free models
  sequential_execution: true, // CRITICAL for multi-step tasks
};
```

---

## 🔧 AGENT DEVELOPMENT PATTERNS

### **PATTERN 1: Adding New Features**

```bash
# Agent workflow for new features:
1. Study existing examples in src/examples/
2. Copy closest template (mathAgent.ts for tool calling)
3. Modify for specific use case
4. Test with npm run example
5. Add tests in src/__tests__/
6. Update documentation
```

### **PATTERN 2: Debugging Issues**

```bash
# Agent debugging protocol:
1. Check API keys in .env file
2. Verify model availability (free models change)
3. Test with known working example
4. Enable debug logging: logger.setLevel('debug')
5. Check sequential execution if multi-step
6. Examine JSON parsing in VANILLA provider
```

### **PATTERN 3: Provider Integration**

```typescript
// Agent pattern for adding new providers:
1. Extend OpenAILikeBase class (src/providers/openaiLikeBase.ts)
2. Implement required methods: chat(), streamChat()
3. Add VANILLA variant if free models supported
4. Create test file in src/__tests__/
5. Add example in src/examples/
```

### **PATTERN 4: Multi-Agent Coordination**

```typescript
// Agent pattern for complex tasks:
import { DualModeCoordinator } from "./src/multi-agent/DualModeCoordinator.js";

// Automatic mode selection:
// - UDP mode: Fast routing (2-3s) for simple tasks
// - Orchestra mode: Complex coordination (8-12s) for multi-step tasks
const coordinator = new DualModeCoordinator(agents);
const result = await coordinator.coordinate(userQuery, tools, providers);
```

---

## 🎯 AGENT TESTING PROTOCOLS

### **MANDATORY TESTS** (Run Before Any Commit):

```bash
# Core validation sequence:
npm run build                    # TypeScript compilation
npm run example                  # Basic functionality
npm run example:test-correctness # Validates 15×8÷3=40
npm test                         # Full test suite
```

### **SPECIFIC TEST SCENARIOS**:

```bash
# Test VANILLA tool calling:
npm run example  # Uses mathAgent.ts with free models

# Test enhanced planning:
npm run example:quantum  # Uses quantumMathAgent.ts

# Test multi-agent coordination:
node examples/multi-agent/moldovaScenarios.js

# Test provider fallback:
# Disable primary provider in .env, verify fallback works
```

### **VALIDATION CRITERIA**:

- ✅ 15×8÷3 = 40 (not 120) - Sequential execution working
- ✅ Free models can call tools - VANILLA approach working
- ✅ Provider fallback functions - Error handling working
- ✅ Multi-step tasks complete correctly - Planning working

---

## ⚠️ CRITICAL AGENT CONSTRAINTS

### **NEVER DO** (Will Break System):

- ❌ Use paid models for initial testing (start with free)
- ❌ Modify sequential execution logic without understanding
- ❌ Skip testing with testCorrectAnswer.ts after changes
- ❌ Assume native tool calling works with free models
- ❌ Make multiple tool calls simultaneously in VANILLA mode

### **ALWAYS DO** (Required for Success):

- ✅ Read memory-bank/ files before starting
- ✅ Test with free models first
- ✅ Validate sequential execution for math operations
- ✅ Use VANILLA approach for free model tool calling
- ✅ Update documentation when making changes

### **DEBUGGING CHECKLIST**:

```typescript
// When agent encounters issues, check in order:
1. API keys present in .env?
2. Model available? (curl -s "https://openrouter.ai/api/v1/models")
3. VANILLA approach used for free models?
4. Sequential execution enforced for multi-step?
5. JSON parsing working in parseManualToolCalls()?
6. Provider fallback configured correctly?
```

---

## 📊 AGENT PERFORMANCE METRICS

### **EXPECTED PERFORMANCE** (Validate Against These):

- **VANILLA Tool Calls**: 1.2-2.1s execution time
- **Sequential Math**: 100% accuracy (15×8÷3=40)
- **Multi-Agent UDP**: 2-3s coordination time
- **Multi-Agent Orchestra**: 8-12s coordination time
- **Cost Savings**: 90%+ through free model usage

### **PERFORMANCE MONITORING**:

```typescript
// Agent should monitor these metrics:
interface AgentMetrics {
  duration: number; // Total execution time
  providerCalls: number; // Number of API calls
  toolExecutions: number; // Number of tools used
  costSavings: number; // Money saved vs paid models
  accuracy: number; // Correctness percentage
}
```

---

## 🔮 AGENT ADVANCED CAPABILITIES

### **Multi-Agent Moldova System** (Production Ready):

```typescript
// Real-world mixed language support:
const query = "Salut, vreau vremea în Chișinău și мне нужен билет în Bucuresti";
// System automatically handles Romanian/Russian/English mix
```

### **Quantum Planning Enhancement**:

```typescript
// Enhanced reasoning capabilities:
- LLM-powered intent analysis
- HTN-inspired task decomposition
- Tree-of-thoughts reasoning paths
- Adaptive strategy selection
```

### **Provider Coordination Patterns**:

```typescript
// Smart provider selection:
if (isFreeTier && hasQuotaLimits) {
  return await sequentialExecution(providers);
} else if (isUrgent && hasBudget) {
  return await raceProviders(providers);
}
```

---

## 📚 AGENT REFERENCE MATERIALS

### **ESSENTIAL READING** (In Priority Order):

1. [`CLAUDE.md`](./CLAUDE.md) - Comprehensive development guide
2. [`RATIONALE.md`](./RATIONALE.md) - Design philosophy and decisions
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Technical architecture details
4. [`CONFIGURATION.md`](./CONFIGURATION.md) - Configuration options
5. [`USAGE-GUIDE.md`](./USAGE-GUIDE.md) - Implementation examples

### **WORKING EXAMPLES** (Copy These Patterns):

- [`src/examples/mathAgent.ts`](./src/examples/mathAgent.ts) - Basic tool calling
- [`src/examples/quantumMathAgent.ts`](./src/examples/quantumMathAgent.ts) - Enhanced planning
- [`examples/multi-agent/moldovaScenarios.ts`](./examples/multi-agent/moldovaScenarios.ts) - Multi-agent coordination

### **CONFIGURATION TEMPLATES**:

```typescript
// Standard provider configuration:
const config = {
  providers: {
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: "https://openrouter.ai",
      defaultModel: "mistralai/mistral-small-3.2-24b-instruct:free",
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      defaultModel: "gemini-1.5-flash",
    },
  },
};
```

---

## 🏆 AGENT SUCCESS METRICS

### **CEATA ACHIEVEMENT VALIDATION**:

- ✅ **Universal Tool Calling**: ANY text model can use tools via VANILLA
- ✅ **Free Model Support**: 90%+ cost reduction proven
- ✅ **Sequential Execution**: Multi-step reliability (15×8÷3=40)
- ✅ **Multi-Agent Coordination**: UDP + Orchestra modes working
- ✅ **Production Ready**: 9,000+ lines of TypeScript, comprehensive testing

### **AGENT IMPACT MEASUREMENT**:

```typescript
// Measure these outcomes:
const impact = {
  costReduction: "90%+ through free model usage",
  universalCompatibility: "12+ different models tested",
  reliability: "100% success rate in sequential math",
  developerExperience: "Complete TypeScript APIs with examples",
};
```

---

_This document provides complete navigation intelligence for AI agents working on the Ceata framework. The system has achieved production readiness across all major components, with proven VANILLA tool calling, multi-agent coordination, and comprehensive testing infrastructure._

**The ceată (coordinated intelligence) is fully operational - independent AI minds working together, each contributing unique capabilities to achieve what none could accomplish alone.**
