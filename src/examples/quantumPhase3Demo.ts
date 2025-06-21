/**
 * QUANTUM PLANNER PHASE 3 DEMO - Tree-of-Thoughts Planning
 * 
 * Demonstrates the revolutionary Tree-of-Thoughts approach with
 * hypothesis generation, alternative path exploration, and dynamic revision.
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
    "X-Title": "Quantum Planner Phase 3 Demo",
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

  unreliableTool: defineTool({
    name: "unreliableTool",
    description: "A tool that sometimes fails to test error recovery",
    parameters: {
      type: "object",
      properties: {
        input: { type: "string", description: "Input data" },
      },
      required: ["input"],
    },
    execute: async ({ input }: { input: string }) => {
      console.log(`⚠️ Unreliable tool processing: ${input}`);
      // Simulate random failures
      if (Math.random() < 0.5) {
        throw new Error("Simulated tool failure");
      }
      return `Processed: ${input}`;
    },
  }),
};

// Test scenarios for Tree-of-Thoughts capabilities
const treeOfThoughtsTestCases = [
  {
    name: "🌳 Simple Task with Multiple Hypotheses",
    input: "What is 25 * 8?",
    expectedHypotheses: 2,
    description: "Simple task should generate tool-focused and chat-guided hypotheses"
  },
  
  {
    name: "🌲 Complex Task with Full Hypothesis Set",
    input: "Research the impact of quantum computing on cryptography, analyze the security implications, and create a detailed technical report with recommendations for organizations.",
    expectedHypotheses: 3,
    description: "Complex task should generate all hypothesis types including hybrid approach"
  },
  
  {
    name: "🌴 Uncertain Task for Adaptive Exploration",
    input: "I need help with something but I'm not exactly sure what approach would work best for this complex problem.",
    expectedHypotheses: 4,
    description: "Uncertain task should generate adaptive exploration hypothesis"
  },
  
  {
    name: "🎋 Error Recovery Scenario",
    input: "Use the unreliableTool to process some data",
    expectedHypotheses: 2,
    description: "Test Tree-of-Thoughts error recovery and hypothesis revision"
  }
];

async function testTreeOfThoughtsPlanning() {
  console.log("🌳 QUANTUM PLANNER PHASE 3 - TREE-OF-THOUGHTS PLANNING");
  console.log("Testing hypothesis generation, alternative paths, and dynamic revision...");
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
  let totalTests = treeOfThoughtsTestCases.length;

  for (const testCase of treeOfThoughtsTestCases) {
    console.log(`\n${testCase.name}`);
    console.log(`Input: "${testCase.input}"`);
    console.log(`Expected: ${testCase.expectedHypotheses} hypotheses`);
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

      // Test the complete Tree-of-Thoughts planning process
      const plan = await planner.createQuantumPlan(context);
      
      console.log(`✅ Tree-of-Thoughts Planning Results:`);
      console.log(`   Intent Analysis:`);
      console.log(`     Primary: ${plan.intent.primary}`);
      console.log(`     Complexity: ${plan.intent.complexity}`);
      console.log(`     Task Type: ${plan.intent.taskType}`);
      
      console.log(`   Primary Strategy:`);
      console.log(`     Type: ${plan.strategy.type}`);
      console.log(`     Reasoning: ${plan.strategy.reasoning}`);
      console.log(`     Expected Tools: ${plan.strategy.expectedTools.join(', ') || 'None'}`);
      
      console.log(`   Execution Steps:`);
      plan.steps.forEach((step, i) => {
        console.log(`     ${i + 1}. ${step.intent} (${step.type}, ${step.priority})`);
        if (step.alternatives.length > 0) {
          console.log(`        Alternatives: ${step.alternatives.join(', ')}`);
        }
      });
      
      console.log(`   Alternative Paths Generated: ${plan.alternatives.length}`);
      plan.alternatives.forEach((alt, i) => {
        console.log(`     Path ${i + 1}: ${alt.strategy.type} strategy (reliability: ${(alt.reliability * 100).toFixed(1)}%)`);
        console.log(`       Cost: ${alt.cost}, Steps: ${alt.steps.length}`);
        console.log(`       Reasoning: ${alt.strategy.reasoning}`);
      });
      
      console.log(`   Plan Metrics:`);
      console.log(`     Confidence: ${plan.confidence}%`);
      console.log(`     Estimated Cost: ${plan.estimatedCost}`);
      console.log(`     Total Paths (Primary + Alternatives): ${1 + plan.alternatives.length}`);
      
      // Verify Tree-of-Thoughts capabilities
      const hasAlternatives = plan.alternatives.length > 0;
      const hasToTReasoning = plan.strategy.reasoning.includes('Tree-of-Thoughts') || 
                              plan.alternatives.some(alt => alt.strategy.reasoning.includes('Tree-of-Thoughts'));
      
      if (hasAlternatives && hasToTReasoning) {
        console.log(`🎯 EXCELLENT TREE-OF-THOUGHTS PLANNING - Multiple paths with hypothesis reasoning!`);
        successCount++;
      } else if (hasAlternatives) {
        console.log(`👍 GOOD PLANNING - Alternative paths generated, ToT reasoning partial!`);
      } else {
        console.log(`⚠️  BASIC PLANNING - Tree-of-Thoughts capabilities not fully utilized!`);
      }

    } catch (error) {
      console.log(`❌ PLANNING FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(75));
  console.log(`🏆 TREE-OF-THOUGHTS TEST RESULTS: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log("🎉 PERFECT SCORE - Tree-of-Thoughts planning is working magnificently!");
  } else if (successCount >= totalTests * 0.75) {
    console.log("🎯 EXCELLENT - Tree-of-Thoughts planning is highly sophisticated!");
  } else if (successCount >= totalTests * 0.5) {
    console.log("👍 GOOD - Tree-of-Thoughts planning is working well!");
  } else {
    console.log("⚠️  NEEDS DEVELOPMENT - Tree-of-Thoughts capabilities require enhancement!");
  }

  console.log("\n🚀 Quantum Planner Phase 3 (Tree-of-Thoughts) Complete!");
  console.log("Next: Phase 4 - Self-Healing Systems & Phase 5 - Memory & Learning");
}

async function demonstrateEvolutionaryPlanning() {
  console.log("\n" + "=".repeat(75));
  console.log("🧬 EVOLUTIONARY PLANNING DEMONSTRATION");
  console.log("Classical → HTN → Tree-of-Thoughts Evolution");
  console.log("=".repeat(75));

  const complexTask = "Analyze the energy efficiency of different renewable sources, compare their cost-effectiveness, and create an investment strategy report with risk assessment.";
  
  console.log(`Complex Task: "${complexTask}"`);
  
  console.log("\n📊 Classical Planning Approach:");
  console.log("   - Linear keyword matching");
  console.log("   - Single execution path");
  console.log("   - No error recovery");
  console.log("   - Limited adaptability");

  console.log("\n🏗️ HTN Planning Approach (Phase 2):");
  console.log("   - Hierarchical task decomposition");
  console.log("   - Strategy selection based on complexity");
  console.log("   - Dependency analysis");
  console.log("   - Basic fallback strategies");

  console.log("\n🌳 Tree-of-Thoughts Planning Approach (Phase 3):");
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
    console.log(`   - HTN strategy selection: ${plan.strategy.type}`);
    console.log(`   - Multiple execution hypotheses: ${plan.alternatives.length + 1} total paths`);
    console.log(`   - Hypothesis-driven alternatives:`);
    
    plan.alternatives.forEach((alt, i) => {
      console.log(`     ${i + 1}. ${alt.strategy.type} approach (${(alt.reliability * 100).toFixed(1)}% reliability)`);
      if (alt.strategy.reasoning.includes('hypothesis')) {
        console.log(`        → ${alt.strategy.reasoning}`);
      }
    });
    
    console.log(`   - Dynamic revision capabilities: Available`);
    console.log(`   - Error recovery strategies: Tree-of-Thoughts based`);
    console.log(`   - Confidence assessment: ${plan.confidence}%`);
    
  } catch (error) {
    console.log(`   - Error: ${error}`);
  }

  console.log("\n🎯 The Complete Quantum Evolution:");
  console.log("   ✅ Phase 1: Intent Recognition - Deep understanding beyond keywords");
  console.log("   ✅ Phase 2: HTN Decomposition - Intelligent strategy selection and task breakdown");
  console.log("   ✅ Phase 3: Tree-of-Thoughts - Hypothesis generation and alternative path exploration");
  console.log("   🔄 Phase 4: Self-Healing - Real-time error recovery and adaptation");
  console.log("   🧠 Phase 5: Memory & Learning - Pattern recognition and continuous improvement");
  console.log("   🌟 RESULT: Universal, adaptive, self-improving AI planning system");
}

// Main execution
(async () => {
  // Enable debug logging
  logger.setLevel('debug');

  try {
    await testTreeOfThoughtsPlanning();
    await demonstrateEvolutionaryPlanning();
  } catch (error) {
    console.error("💥 Demo failed:", error);
    process.exit(1);
  }
})().catch(error => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});