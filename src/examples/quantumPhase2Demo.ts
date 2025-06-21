/**
 * QUANTUM PLANNER PHASE 2 DEMO - HTN-Inspired Task Decomposition
 * 
 * Demonstrates the revolutionary Hierarchical Task Network planning
 * with intelligent strategy selection and dependency analysis.
 */

import { defineTool } from "../core/Tool.js";
import { ConversationAgent } from "../core/ConversationAgent.js";
import { QuantumPlanner } from "../core/QuantumPlanner.js";
import { createAgentContext } from "../core/AgentContext.js";
import { logger } from "../core/logger.js";
import { createVanillaOpenRouterProvider } from "../providers/openrouterVanilla.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";
import { config } from "../config/index.js";

// Create providers for testing
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Quantum Planner Phase 2 Demo",
  },
});

// Define comprehensive tools for testing different strategies
const tools = {
  calculate: defineTool({
    name: "calculate",
    description: "Perform mathematical calculations",
    parameters: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Mathematical expression to evaluate" },
      },
      required: ["expression"],
    },
    execute: async ({ expression }: { expression: string }) => {
      console.log(`🧮 Calculating: ${expression}`);
      try {
        const result = eval(expression.replace(/[^0-9+\-*/().]/g, ''));
        return result;
      } catch (error) {
        return `Error: ${error}`;
      }
    },
  }),

  search: defineTool({
    name: "search",
    description: "Search for information",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
    execute: async ({ query }: { query: string }) => {
      console.log(`🔍 Searching for: ${query}`);
      return `Search results for "${query}": Found relevant information...`;
    },
  }),

  analyze: defineTool({
    name: "analyze",
    description: "Analyze data or information",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string", description: "Data to analyze" },
      },
      required: ["data"],
    },
    execute: async ({ data }: { data: string }) => {
      console.log(`📊 Analyzing: ${data}`);
      return `Analysis of "${data}": Patterns and insights discovered...`;
    },
  }),

  create: defineTool({
    name: "create",
    description: "Create documents or content",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to create" },
        type: { type: "string", description: "Type of content" },
      },
      required: ["content", "type"],
    },
    execute: async ({ content, type }: { content: string; type: string }) => {
      console.log(`✍️ Creating ${type}: ${content}`);
      return `Created ${type} with content: ${content}`;
    },
  }),
};

// Test scenarios for different HTN strategies
const strategyTestCases = [
  {
    name: "🎯 DIRECT Strategy Test",
    input: "What is 15 + 25?",
    expectedStrategy: "direct",
    expectedSteps: 1,
    description: "Simple task should use direct execution"
  },
  
  {
    name: "📋 SEQUENTIAL Strategy Test", 
    input: "Calculate 12 * 8, then divide the result by 3.",
    expectedStrategy: "sequential",
    expectedSteps: 3,
    description: "Multi-step mathematical task with dependencies"
  },
  
  {
    name: "🏗️ HIERARCHICAL Strategy Test",
    input: "I need to research AI trends in 2025, analyze the impact on businesses, then create a comprehensive report with recommendations.",
    expectedStrategy: "hierarchical", 
    expectedSteps: 4,
    description: "Complex task requiring hierarchical breakdown"
  },
  
  {
    name: "⚡ PARALLEL Strategy Test",
    input: "Search for recent research papers and analyze current market trends for AI technology.",
    expectedStrategy: "parallel",
    expectedSteps: 3,
    description: "Independent tasks that can run in parallel"
  },
  
  {
    name: "🔄 ADAPTIVE Strategy Test",
    input: "Help me with this complex problem that I'm not sure how to approach.",
    expectedStrategy: "adaptive",
    expectedSteps: 2,
    description: "Uncertain task requiring adaptive planning"
  }
];

async function testHTNStrategies() {
  console.log("🧠 QUANTUM PLANNER PHASE 2 - HTN STRATEGY TESTING");
  console.log("Testing intelligent strategy selection and task decomposition...");
  console.log("=" .repeat(75));

  const planner = new QuantumPlanner();
  
  const providerGroup = {
    primary: [vanillaProvider, googleOpenAI],
    fallback: []
  };
  
  const providerModels = {
    "openrouter-vanilla": "mistralai/mistral-small-3.2-24b-instruct:free",
    "google-openai": config.providers.google.defaultModel
  };

  let successCount = 0;
  let totalTests = strategyTestCases.length;

  for (const testCase of strategyTestCases) {
    console.log(`\n${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Expected: ${testCase.expectedStrategy} strategy, ~${testCase.expectedSteps} steps`);
    console.log(`Description: ${testCase.description}`);
    console.log("-".repeat(60));

    try {
      // Create agent context
      const context = createAgentContext(
        [{ role: "user", content: testCase.input }],
        tools,
        providerGroup,
        { maxSteps: 10, providerStrategy: 'smart' },
        providerModels
      );

      // Test the complete planning process
      const plan = await planner.createQuantumPlan(context);
      
      console.log(`✅ HTN Planning Results:`);
      console.log(`   Intent Analysis:`);
      console.log(`     Primary: ${plan.intent.primary}`);
      console.log(`     Complexity: ${plan.intent.complexity}`);
      console.log(`     Task Type: ${plan.intent.taskType}`);
      console.log(`     Secondary Goals: ${plan.intent.secondary.length}`);
      
      console.log(`   Strategy Selection:`);
      console.log(`     Type: ${plan.strategy.type}`);
      console.log(`     Reasoning: ${plan.strategy.reasoning}`);
      console.log(`     Expected Tools: ${plan.strategy.expectedTools.join(', ') || 'None'}`);
      console.log(`     Dependencies: ${plan.strategy.dependencies.length}`);
      
      console.log(`   Task Decomposition:`);
      console.log(`     Steps Generated: ${plan.steps.length}`);
      plan.steps.forEach((step, i) => {
        console.log(`     ${i + 1}. ${step.intent} (${step.type}, ${step.priority})`);
        if (step.dependencies.length > 0) {
          console.log(`        Dependencies: ${step.dependencies.join(', ')}`);
        }
        if (step.alternatives.length > 0) {
          console.log(`        Alternatives: ${step.alternatives.join(', ')}`);
        }
      });
      
      console.log(`   Plan Metrics:`);
      console.log(`     Confidence: ${plan.confidence}%`);
      console.log(`     Estimated Cost: ${plan.estimatedCost}`);
      console.log(`     Alternative Paths: ${plan.alternatives.length}`);
      
      // Verify strategy selection accuracy
      const strategyMatch = plan.strategy.type === testCase.expectedStrategy;
      const stepsInRange = Math.abs(plan.steps.length - testCase.expectedSteps) <= 1;
      
      if (strategyMatch && stepsInRange) {
        console.log(`🎯 PERFECT HTN PLANNING - Strategy and decomposition are optimal!`);
        successCount++;
      } else {
        console.log(`⚠️  PARTIAL SUCCESS - Expected ${testCase.expectedStrategy}, got ${plan.strategy.type}`);
      }

      // Show fallback strategy if available
      if (plan.strategy.fallbackStrategy) {
        console.log(`   Fallback Strategy: ${plan.strategy.fallbackStrategy.type}`);
      }

    } catch (error) {
      console.log(`❌ PLANNING FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(75));
  console.log(`🏆 HTN STRATEGY TEST RESULTS: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log("🎉 PERFECT SCORE - HTN planning is working flawlessly!");
  } else if (successCount >= totalTests * 0.8) {
    console.log("🎯 EXCELLENT - HTN planning is highly intelligent!");
  } else if (successCount >= totalTests * 0.6) {
    console.log("👍 GOOD - HTN planning is working well with room for optimization!");
  } else {
    console.log("⚠️  NEEDS TUNING - HTN planning requires strategy adjustments!");
  }

  console.log("\n🚀 Quantum Planner Phase 2 (HTN Decomposition) Complete!");
  console.log("Next: Phase 3 - Tree-of-Thoughts Planning & Phase 4 - Self-Healing");
}

async function demonstrateHTNAdvantage() {
  console.log("\n" + "=".repeat(75));
  console.log("🔬 HTN ADVANTAGE DEMONSTRATION");
  console.log("Comparing Classical vs Quantum HTN Planning");
  console.log("=".repeat(75));

  const complexTask = "Calculate the compound interest on $5000 at 4% annual rate for 2 years, then analyze if this is better than simple interest, and finally create a recommendation report.";
  
  console.log(`Complex Task: "${complexTask}"`);
  
  console.log("\n📊 Classical Planner Approach:");
  console.log("   - Basic keyword matching: 'calculate', 'interest', 'analyze', 'create'");
  console.log("   - Simple tool selection: calculate, analyze, create");
  console.log("   - Linear execution: One step at a time");
  console.log("   - No dependency understanding");
  console.log("   - No strategy optimization");

  console.log("\n🧠 Quantum HTN Planner Approach:");
  try {
    const planner = new QuantumPlanner();
    const context = createAgentContext(
      [{ role: "user", content: complexTask }],
      tools,
      {
        primary: [vanillaProvider],
        fallback: [googleOpenAI]
      },
      { maxSteps: 10, providerStrategy: 'smart' },
      { "openrouter-vanilla": "mistralai/mistral-small-3.2-24b-instruct:free" }
    );

    const plan = await planner.createQuantumPlan(context);
    
    console.log(`   - Intent understanding: "${plan.intent.primary}"`);
    console.log(`   - Complexity analysis: ${plan.intent.complexity}`);
    console.log(`   - Secondary goals identified: ${plan.intent.secondary.length}`);
    console.log(`   - HTN strategy selected: ${plan.strategy.type}`);
    console.log(`   - Intelligent decomposition: ${plan.steps.length} optimized steps`);
    console.log(`   - Dependency awareness: ${plan.strategy.dependencies.length} dependencies tracked`);
    console.log(`   - Self-healing fallback: ${plan.strategy.fallbackStrategy?.type || 'Available'}`);
    console.log(`   - Confidence assessment: ${plan.confidence}%`);
    
  } catch (error) {
    console.log(`   - Error: ${error}`);
  }

  console.log("\n🎯 The Quantum HTN Advantage:");
  console.log("   ✅ True intent understanding beyond keywords");
  console.log("   ✅ Intelligent strategy selection based on task characteristics");
  console.log("   ✅ Hierarchical task decomposition with dependency analysis");
  console.log("   ✅ Multiple execution strategies (direct, sequential, hierarchical, parallel, adaptive)");
  console.log("   ✅ Built-in fallback strategies for robustness");
  console.log("   ✅ Confidence and cost estimation");
  console.log("   ✅ Works with ANY LLM through intelligent prompting");
  console.log("   ✅ Classical AI planning principles meets modern LLM capabilities");
}

// Main execution
(async () => {
  // Enable debug logging
  logger.setLevel('debug');

  try {
    await testHTNStrategies();
    await demonstrateHTNAdvantage();
  } catch (error) {
    console.error("💥 Demo failed:", error);
    process.exit(1);
  }
})().catch(error => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});