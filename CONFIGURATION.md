# CEATA Quantum Configuration Guide

Complete configuration guide for CEATA with **Quantum Intelligence** capabilities, universal tool calling, and free model optimization.

---

## 🚀 Quick Setup for Quantum Agents

### 1. Environment Configuration
Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

### 2. Quantum-Optimized Environment Variables

```bash
# FREE MODELS (Primary - Quantum Enhanced)
OPENROUTER_API_KEY=your_openrouter_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# PREMIUM MODELS (Fallback Only)
OPENAI_API_KEY=your_openai_api_key_here

# Quantum Configuration
CEATA_QUANTUM_PLANNING=true
CEATA_VANILLA_TOOL_CALLING=true
CEATA_SELF_HEALING=true
```

---

## 🧠 Quantum Agent Configuration

### OpenRouter Configuration (FREE Models)
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai
OPENROUTER_DEFAULT_MODEL=mistralai/mistral-small-3.2-24b-instruct:free
OPENROUTER_MAX_TOKENS=4000
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_TIMEOUT_MS=30000

# Quantum-specific OpenRouter settings
OPENROUTER_QUANTUM_HEADERS=true
OPENROUTER_VANILLA_PARSING=true
```

### Google AI Configuration (Experimental Models)
```bash
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
GOOGLE_TIMEOUT_MS=30000

# Quantum-specific Google settings
GOOGLE_THINKING_MODE=true
GOOGLE_QUANTUM_REASONING=true
```

### OpenAI Configuration (Premium Fallback)
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com
OPENAI_DEFAULT_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=4000
OPENAI_TIMEOUT_MS=30000

# Use as fallback only
OPENAI_PRIORITY=fallback
```

### Quantum Intelligence Settings
```bash
# Quantum Planner Configuration
QUANTUM_INTENT_ANALYSIS=true
QUANTUM_HTN_DECOMPOSITION=true
QUANTUM_TREE_OF_THOUGHTS=true
QUANTUM_SELF_HEALING=true
QUANTUM_MEMORY_LEARNING=true

# Performance Optimization
QUANTUM_MAX_PLANNING_STEPS=5
QUANTUM_INTENT_CONFIDENCE_THRESHOLD=0.8
QUANTUM_ADAPTATION_LIMIT=3
QUANTUM_LEARNING_ENABLED=true

# Universal Tool Calling
VANILLA_TOOL_CALLING=true
VANILLA_SEQUENTIAL_ENFORCEMENT=true
VANILLA_PROMPT_ENHANCEMENT=true
```

---

## ⚡ Runtime Quantum Configuration

### Creating Quantum-Enhanced Providers

```typescript
import {
  createVanillaOpenRouterProvider,
  createGoogleOpenAIProvider,
  createOpenAIProvider,
} from "ceata/providers";

// FREE Model with Quantum Enhancement
const quantumOpenRouter = createVanillaOpenRouterProvider(
  process.env.OPENROUTER_API_KEY,
  "https://openrouter.ai/api/v1",
  {
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    headers: {
      "HTTP-Referer": "https://example.com",
      "X-Title": "Quantum CEATA Agent",
    },
    quantumEnhanced: true,
    vanillaToolCalling: true,
  }
);

// Experimental Model with Thinking Capabilities
const quantumGoogle = createGoogleOpenAIProvider(
  process.env.GOOGLE_API_KEY,
  "https://generativelanguage.googleapis.com",
  {
    model: "models/gemini-2.0-flash-thinking-exp",
    thinkingMode: true,
    quantumReasoning: true,
  }
);

// Premium Fallback
const fallbackOpenAI = createOpenAIProvider(
  process.env.OPENAI_API_KEY,
  "https://api.openai.com",
  {
    model: "gpt-4o-mini",
    priority: "fallback",
  }
);
```

### Quantum Agent Initialization

```typescript
import { QuantumConversationAgent } from "ceata";

const quantumAgent = new QuantumConversationAgent({
  // Quantum Planning Configuration
  quantumPlanning: {
    intentAnalysis: true,
    htnDecomposition: true,
    treeOfThoughts: true,
    selfHealing: true,
    memoryLearning: true,
  },
  
  // Universal Tool Configuration
  toolCalling: {
    vanillaMode: true,
    sequentialEnforcement: true,
    promptEnhancement: true,
    universalCompatibility: true,
  },
  
  // Performance Settings
  performance: {
    maxPlanningSteps: 5,
    intentConfidenceThreshold: 0.8,
    adaptationLimit: 3,
    learningEnabled: true,
  },
});
```

### Provider Groups for Quantum Intelligence

```typescript
// Quantum-Optimized Provider Strategy
const quantumProviders = {
  primary: [
    // FREE models with quantum enhancement
    quantumOpenRouter,
    quantumGoogle,
  ],
  
  fallback: [
    // Premium models only when needed
    fallbackOpenAI,
  ],
};

// Quantum Execution Options
const quantumOptions = {
  maxSteps: 15,                    // Allow complex reasoning
  providerStrategy: 'smart',       // Intelligent provider selection
  quantumPlanning: true,           // Enable full quantum intelligence
  
  // Self-Healing Configuration
  selfHealing: {
    enabled: true,
    maxAdaptations: 3,
    errorRecovery: true,
    providerFallback: true,
  },
  
  // Memory Management
  memory: {
    maxHistoryLength: 30,
    preserveSystemMessages: true,
    preservePlanningSteps: true,
    adaptiveMemory: true,
  },
  
  // Performance Tuning
  performance: {
    enableRacing: true,
    timeoutMs: 30000,
    retryConfig: {
      maxRetries: 2,
      baseDelayMs: 1000,
    },
  },
};
```

---

## 🔧 Universal Tool Calling Configuration

### Vanilla Tool Calling Setup

```typescript
// Universal tool calling that works with ANY model
const vanillaConfig = {
  // Prompt Engineering Configuration
  prompting: {
    sequentialRules: true,
    resultUsageEnforcement: true,
    toolCallFormatting: true,
    exampleGeneration: true,
  },
  
  // Parsing Configuration
  parsing: {
    toolCallExtraction: true,
    jsonValidation: true,
    sequentialProcessing: true,
    errorRecovery: true,
  },
  
  // Compatibility Settings
  compatibility: {
    freeModelSupport: true,
    experimentalModelSupport: true,
    premiumModelFallback: true,
    universalFormatting: true,
  },
};

// Apply to providers
const vanillaOpenRouter = createVanillaOpenRouterProvider(
  apiKey, 
  baseUrl, 
  {
    ...vanillaConfig,
    headers: {
      "HTTP-Referer": "https://example.com",
      "X-Title": "Universal Tool Agent",
    },
  }
);
```

### Free Model Optimization

```typescript
// Optimized configuration for free models
const freeModelConfig = {
  // Provider Selection
  providers: [
    {
      provider: vanillaOpenRouter,
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      priority: "primary",
      costPerToken: 0.0, // FREE
    },
    {
      provider: vanillaOpenRouter,
      model: "deepseek/deepseek-r1-0528-qwen3-8b:free", 
      priority: "primary",
      costPerToken: 0.0, // FREE
    },
    {
      provider: googleOpenAI,
      model: "models/gemini-2.0-flash-thinking-exp",
      priority: "primary", 
      costPerToken: 0.0, // FREE (experimental)
    },
  ],
  
  // Optimization Settings
  optimization: {
    preferFreeModels: true,
    raceProviders: true,
    failFast: true,
    costTracking: true,
  },
};
```

---

## 📊 Quantum Performance Configuration

### Debug and Monitoring

```typescript
import { logger } from "ceata";

// Enable quantum debug mode
logger.setLevel('debug');

// Quantum metrics configuration
const monitoringConfig = {
  metrics: {
    // Quantum Intelligence Metrics
    intentAnalysisTracking: true,
    planComplexityMeasurement: true,
    adaptationCounting: true,
    learningPatternDetection: true,
    
    // Performance Metrics
    executionTimeTracking: true,
    toolUsageAnalytics: true,
    providerPerformance: true,
    costSavingsCalculation: true,
  },
  
  reporting: {
    realTimeMetrics: true,
    detailedDebugging: true,
    quantumInsights: true,
    performanceProfiling: true,
  },
};
```

### Environment-Specific Configuration

```typescript
// Development Configuration
const developmentConfig = {
  quantum: {
    fullDebugging: true,
    experimentalFeatures: true,
    learningAcceleration: true,
  },
  providers: {
    timeoutMs: 60000,        // Longer timeouts for debugging
    enableAllModels: true,   // Test with all available models
  },
};

// Production Configuration  
const productionConfig = {
  quantum: {
    optimizedPerformance: true,
    stableFeatures: true,
    conservativeLearning: true,
  },
  providers: {
    timeoutMs: 30000,        // Standard timeouts
    reliableModelsOnly: true, // Only proven stable models
  },
  security: {
    strictValidation: true,
    sanitizedLogging: true,
    keyRotation: true,
  },
};
```

---

## 🛡️ Security and Cost Management

### API Key Management

```typescript
// Secure API key configuration
const secureConfig = {
  keys: {
    // Use environment variables only
    openai: process.env.OPENAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    google: process.env.GOOGLE_API_KEY,
    
    // Validation
    validateOnStartup: true,
    rotatePeriodically: true,
    logUsage: false, // Never log keys
  },
  
  security: {
    httpsOnly: true,
    certificateValidation: true,
    requestSigning: true,
    rateLimiting: true,
  },
};
```

### Cost Optimization

```typescript
// Cost-optimized configuration
const costConfig = {
  strategy: {
    freeFirst: true,           // Always try free models first
    paidAsLastResort: true,    // Premium models only when critical
    trackSpending: true,       // Monitor cost in real-time
    setBudgetLimits: true,     // Hard limits on spending
  },
  
  limits: {
    dailyBudget: 10.00,        // Maximum daily spend
    monthlyBudget: 200.00,     // Maximum monthly spend
    perRequestLimit: 0.50,     // Maximum per request cost
    emergencyStopThreshold: 50.00, // Emergency cutoff
  },
  
  optimization: {
    preferCheaperModels: true,
    batchRequests: true,
    cacheResponses: true,
    minimizeTokenUsage: true,
  },
};
```

---

## 🧪 Testing Configuration

### Test Environment Setup

```typescript
// Test-specific configuration
const testConfig = {
  quantum: {
    // Accelerated testing
    fastPlanning: true,
    deterministicBehavior: true,
    mockExpensiveOperations: true,
  },
  
  providers: {
    // Use free models for testing
    mockProviders: false,
    freeModelsOnly: true,
    shortTimeouts: true,
  },
  
  validation: {
    // Strict validation for tests
    validateAllResponses: true,
    enforceCorrectness: true,
    measurePerformance: true,
  },
};

// Quantum correctness test configuration
const correctnessTestConfig = {
  testCases: [
    {
      name: "Sequential Math",
      input: "Calculate area of 15×8 rectangle, then divide by 3",
      expectedOutput: "40",
      quantumFeatures: ["intent_analysis", "htn_decomposition", "sequential_execution"],
    },
    {
      name: "Parallel Operations", 
      input: "Get weather for London and New York simultaneously",
      expectedOutputs: ["London", "New York"],
      quantumFeatures: ["parallel_planning", "concurrent_execution"],
    },
    {
      name: "Conditional Logic",
      input: "If 25 > 20, multiply by 2",
      expectedOutput: "50",
      quantumFeatures: ["conditional_reasoning", "logic_evaluation"],
    },
  ],
  
  validation: {
    strictCorrectness: true,
    performanceThresholds: true,
    quantumMetricsValidation: true,
  },
};
```

---

## 🎯 Configuration Best Practices

### 1. Environment-Based Configuration
```bash
# Development
CEATA_ENV=development
QUANTUM_DEBUG_MODE=true
ENABLE_ALL_FEATURES=true

# Staging  
CEATA_ENV=staging
QUANTUM_DEBUG_MODE=false
STABLE_FEATURES_ONLY=true

# Production
CEATA_ENV=production
QUANTUM_OPTIMIZATION=true
SECURITY_HARDENING=true
```

### 2. Provider Hierarchy
```typescript
// Optimal provider configuration
const providerHierarchy = {
  tier1: [
    // FREE models - primary tier
    "mistralai/mistral-small-3.2-24b-instruct:free",
    "deepseek/deepseek-r1-0528-qwen3-8b:free",
    "models/gemini-2.0-flash-thinking-exp",
  ],
  
  tier2: [
    // LOW-COST models - secondary tier
    "gpt-4o-mini",
    "claude-3-haiku",
  ],
  
  tier3: [
    // PREMIUM models - emergency tier
    "gpt-4o",
    "claude-3-sonnet",
  ],
};
```

### 3. Feature Flags
```typescript
// Quantum feature configuration
const quantumFeatures = {
  // Core Features (Always Enabled)
  intentAnalysis: true,
  htnDecomposition: true,
  
  // Advanced Features (Configurable)
  treeOfThoughts: process.env.ENABLE_TOT === 'true',
  selfHealing: process.env.ENABLE_SELF_HEALING === 'true',
  memoryLearning: process.env.ENABLE_LEARNING === 'true',
  
  // Experimental Features (Development Only)
  quantumParallelism: process.env.CEATA_ENV === 'development',
  neuralPlanning: process.env.EXPERIMENTAL_FEATURES === 'true',
};
```

---

## 🚨 Troubleshooting

### Common Configuration Issues

#### 1. Quantum Planning Not Working
```bash
# Check quantum configuration
QUANTUM_PLANNING=true
QUANTUM_DEBUG_MODE=true

# Verify intent analysis
QUANTUM_INTENT_ANALYSIS=true
QUANTUM_HTN_DECOMPOSITION=true
```

#### 2. Free Models Not Compatible
```bash
# Enable vanilla tool calling
VANILLA_TOOL_CALLING=true
VANILLA_SEQUENTIAL_ENFORCEMENT=true

# Check provider configuration
OPENROUTER_VANILLA_PARSING=true
```

#### 3. Sequential Logic Issues
```bash
# Enhanced sequential prompting
VANILLA_PROMPT_ENHANCEMENT=true
SEQUENTIAL_RESULT_ENFORCEMENT=true

# Debug sequential execution
QUANTUM_SEQUENTIAL_DEBUG=true
```

#### 4. Performance Issues
```bash
# Optimize provider racing
ENABLE_PROVIDER_RACING=true
PROVIDER_TIMEOUT_MS=15000

# Enable quantum optimization
QUANTUM_PERFORMANCE_OPTIMIZATION=true
```

### Debug Commands

```bash
# Enable comprehensive debugging
export DEBUG=ceata:*
export QUANTUM_DEBUG_MODE=true
export PROVIDER_DEBUG=true

# Test quantum correctness
npm run test:quantum

# Validate configuration
npm run validate:config

# Benchmark performance
npm run benchmark:quantum
```

---

## 🌟 Advanced Configuration

### Custom Quantum Extensions

```typescript
// Custom quantum planner configuration
const customQuantumConfig = {
  planner: {
    // Custom intent recognition
    intentRecognition: {
      customPatterns: [
        { pattern: /calculate.*then.*divide/, strategy: 'sequential' },
        { pattern: /get.*and.*simultaneously/, strategy: 'parallel' },
        { pattern: /if.*then/, strategy: 'conditional' },
      ],
      confidenceThreshold: 0.8,
    },
    
    // Custom HTN decomposition
    htnDecomposition: {
      maxDepth: 5,
      parallelismDetection: true,
      dependencyAnalysis: true,
    },
    
    // Custom ToT reasoning
    treeOfThoughts: {
      maxPaths: 3,
      pathEvaluation: true,
      optimalPathSelection: true,
    },
  },
};
```

### Integration Configuration

```typescript
// Integration with external systems
const integrationConfig = {
  monitoring: {
    // External monitoring integration
    prometheus: process.env.PROMETHEUS_ENABLED === 'true',
    grafana: process.env.GRAFANA_ENABLED === 'true',
    datadog: process.env.DATADOG_ENABLED === 'true',
  },
  
  logging: {
    // External logging systems
    elasticsearch: process.env.ELASTICSEARCH_URL,
    cloudwatch: process.env.CLOUDWATCH_ENABLED === 'true',
    papertrail: process.env.PAPERTRAIL_ENABLED === 'true',
  },
  
  caching: {
    // External caching systems
    redis: process.env.REDIS_URL,
    memcached: process.env.MEMCACHED_URL,
  },
};
```

**With proper quantum configuration, your CEATA agents will achieve maximum intelligence, performance, and cost efficiency!** 🧠⚡💰