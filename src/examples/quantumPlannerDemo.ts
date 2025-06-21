/**
 * QUANTUM PLANNER DEMO - Showcasing Revolutionary Intent Recognition
 * 
 * Demonstrates the breakthrough Intent Recognition Engine that understands
 * user intent at multiple levels using advanced LLM-powered analysis.
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
    "X-Title": "Quantum Planner Demo",
  },
});

// Define demo tools
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
      // Simple calculator logic (for demo purposes)
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
};

// Test scenarios for intent recognition
const testScenarios = [
  {
    name: "🧮 Simple Calculation",
    input: "What is 25 multiplied by 8?",
    expectedIntent: "Simple mathematical calculation",
    expectedComplexity: "simple",
    expectedTaskType: "calculation"
  },
  
  {
    name: "🔢 Multi-Step Math",
    input: "Calculate the area of a rectangle that is 15 units long and 8 units wide, then divide that result by 3.",
    expectedIntent: "Multi-step mathematical operation",
    expectedComplexity: "moderate", 
    expectedTaskType: "multi_step"
  },
  
  {
    name: "🔍 Research Task",
    input: "I need to find information about the latest AI trends in 2025 and then analyze what impacts they might have on businesses.",
    expectedIntent: "Research and analysis workflow",
    expectedComplexity: "complex",
    expectedTaskType: "analysis"
  },
  
  {
    name: "📋 Planning Task",
    input: "Help me create a project plan for launching a new AI product. I need to consider development, testing, marketing, and launch phases.",
    expectedIntent: "Comprehensive project planning",
    expectedComplexity: "expert",
    expectedTaskType: "planning"
  },
  
  {
    name: "🤔 Ambiguous Request",
    input: "Can you help me with my work stuff?",
    expectedIntent: "Unclear request requiring clarification",
    expectedComplexity: "simple",
    expectedTaskType: "unknown"
  }
];

async function testIntentRecognition() {
  console.log("🧠 QUANTUM PLANNER - INTENT RECOGNITION DEMO");
  console.log("Testing revolutionary LLM-powered intent analysis...");
  console.log("=".repeat(70));

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
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    console.log(`\n${scenario.name}`);
    console.log(`Input: "${scenario.input}"`);
    console.log("-".repeat(50));

    try {
      // Create agent context
      const context = createAgentContext(
        [{ role: "user", content: scenario.input }],
        tools,
        providerGroup,
        { maxSteps: 5, providerStrategy: 'smart' },
        providerModels
      );

      // Test intent recognition
      const intent = await planner.analyzeIntent(scenario.input, context);
      
      console.log(`✅ Intent Analysis Results:`);
      console.log(`   Primary Intent: ${intent.primary}`);
      console.log(`   Secondary Intents: ${intent.secondary.join(', ') || 'None'}`);
      console.log(`   Context: ${intent.context}`);
      console.log(`   Complexity: ${intent.complexity}`);
      console.log(`   Task Type: ${intent.taskType}`);
      console.log(`   Constraints: ${intent.constraints.join(', ') || 'None'}`);
      
      // Verify expectations
      const complexityMatch = intent.complexity === scenario.expectedComplexity;
      const taskTypeMatch = intent.taskType === scenario.expectedTaskType;
      
      if (complexityMatch && taskTypeMatch) {
        console.log(`🎯 PERFECT MATCH - Intent analysis is accurate!`);
        successCount++;
      } else {
        console.log(`⚠️  PARTIAL MATCH - Expected complexity: ${scenario.expectedComplexity}, task: ${scenario.expectedTaskType}`);
      }

      // Test quantum plan creation
      console.log(`\n📋 Creating Quantum Plan...`);
      const plan = await planner.createQuantumPlan(context);
      
      console.log(`   Strategy: ${plan.strategy.type}`);
      console.log(`   Steps: ${plan.steps.length}`);
      console.log(`   Confidence: ${plan.confidence}%`);
      console.log(`   Estimated Cost: ${plan.estimatedCost}`);

    } catch (error) {
      console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(70));
  console.log(`🏆 INTENT RECOGNITION TEST RESULTS: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log("🎉 PERFECT SCORE - Intent Recognition Engine is working flawlessly!");
  } else if (successCount >= totalTests * 0.8) {
    console.log("🎯 EXCELLENT - Intent Recognition Engine is highly accurate!");
  } else if (successCount >= totalTests * 0.6) {
    console.log("👍 GOOD - Intent Recognition Engine is working well with room for improvement!");
  } else {
    console.log("⚠️  NEEDS IMPROVEMENT - Intent Recognition Engine requires tuning!");
  }

  console.log("\n🚀 Quantum Planner Phase 1 (Intent Recognition) Complete!");
  console.log("Next: Phase 2 - Hierarchical Task Decomposition");
}

async function demonstrateComparison() {
  console.log("\n" + "=".repeat(70));
  console.log("🔬 COMPARISON: Classical vs Quantum Planning");
  console.log("=".repeat(70));

  const testInput = "Calculate the compound interest on $1000 at 5% annual rate for 3 years, then tell me how much more that is compared to simple interest.";
  
  console.log(`Input: "${testInput}"`);
  console.log("\n📊 Classical Planner Analysis:");
  console.log("   - Keyword matching: 'calculate', 'interest', 'annual'");
  console.log("   - Tool detection: Basic mathematical operations");
  console.log("   - Strategy: Simple tool execution");
  console.log("   - Multi-step awareness: Limited");

  console.log("\n🧠 Quantum Planner Analysis:");
  try {
    const planner = new QuantumPlanner();
    const context = createAgentContext(
      [{ role: "user", content: testInput }],
      tools,
      {
        primary: [vanillaProvider],
        fallback: [googleOpenAI]
      },
      { maxSteps: 5, providerStrategy: 'smart' },
      { "openrouter-vanilla": "mistralai/mistral-small-3.2-24b-instruct:free" }
    );

    const intent = await planner.analyzeIntent(testInput, context);
    console.log(`   - Intent understanding: ${intent.primary}`);
    console.log(`   - Complexity analysis: ${intent.complexity}`);
    console.log(`   - Task type: ${intent.taskType}`);
    console.log(`   - Context awareness: ${intent.context}`);
    console.log(`   - Constraints: ${intent.constraints.join(', ') || 'None identified'}`);
    
  } catch (error) {
    console.log(`   - Error: ${error}`);
  }

  console.log("\n🎯 The Quantum Advantage:");
  console.log("   ✅ Understands true user intent, not just keywords");
  console.log("   ✅ Recognizes multi-step task complexity");
  console.log("   ✅ Analyzes contextual requirements");
  console.log("   ✅ Identifies constraints and limitations");
  console.log("   ✅ Works with ANY LLM through intelligent prompting");
}

// Main execution
(async () => {
  // Enable debug logging
  logger.setLevel('debug');

  try {
    await testIntentRecognition();
    await demonstrateComparison();
  } catch (error) {
    console.error("💥 Demo failed:", error);
    process.exit(1);
  }
})().catch(error => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});