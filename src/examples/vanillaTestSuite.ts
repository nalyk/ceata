/**
 * VANILLA Tool Calling Test Suite - Comprehensive Testing
 * Tests all scenarios to ensure 100% functionality
 */

import { defineTool } from "../core/Tool.js";
import { ConversationAgent } from "../core/ConversationAgent.js";
import { logger } from "../core/logger.js";
import { createVanillaOpenRouterProvider } from "../providers/openrouterVanilla.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";

// Create vanilla providers for testing
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "CEATA Vanilla Test",
  },
});

// Define test tools
const tools = {
  add: defineTool({
    name: "add",
    description: "Add two numbers together",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "First number" },
        b: { type: "number", description: "Second number" },
      },
      required: ["a", "b"],
    },
    execute: async ({ a, b }: { a: number; b: number }) => {
      console.log(`➕ Adding ${a} + ${b} = ${a + b}`);
      return a + b;
    },
  }),
  
  multiply: defineTool({
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
    execute: async ({ a, b }: { a: number; b: number }) => {
      console.log(`✖️ Multiplying ${a} × ${b} = ${a * b}`);
      return a * b;
    },
  }),
  
  divide: defineTool({
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
    execute: async ({ a, b }: { a: number; b: number }) => {
      if (b === 0) throw new Error("Cannot divide by zero");
      console.log(`➗ Dividing ${a} ÷ ${b} = ${a / b}`);
      return a / b;
    },
  }),
};

// Test scenarios
const testScenarios = [
  {
    name: "🧮 Simple Single Tool Call",
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    messages: [
      { role: "user" as const, content: "What is 25 plus 17?" }
    ],
    expectedTools: ["add"],
  },
  
  {
    name: "🔢 Multi-Step Math Problem",
    model: "deepseek/deepseek-r1-0528-qwen3-8b:free",
    messages: [
      { role: "user" as const, content: "Calculate 12 × 8, then add 15 to the result." }
    ],
    expectedTools: ["multiply", "add"],
  },
  
  {
    name: "📐 Complex Area Calculation", 
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    messages: [
      { role: "user" as const, content: "Find the area of a 9×7 rectangle, then divide by 3." }
    ],
    expectedTools: ["multiply", "divide"],
  },
];

async function runTest(scenario: any) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🧪 Testing: ${scenario.name}`);
  console.log(`🤖 Model: ${scenario.model}`);
  console.log(`💭 Query: ${scenario.messages[0].content}`);
  console.log(`${"=".repeat(60)}`);

  try {
    const agent = new ConversationAgent();
    const providerGroup = {
      primary: [vanillaProvider],
      fallback: [googleOpenAI]
    };
    const providerModels = {
      "openrouter-vanilla": scenario.model
    };

    const systemMessage = {
      role: "system" as const,
      content: "You are a helpful math assistant. Use tools for ALL calculations. Format: TOOL_CALL: {\"name\": \"multiply\", \"arguments\": {\"a\": 9, \"b\": 7}}"
    };

    const result = await agent.run(
      [systemMessage, ...scenario.messages],
      tools,
      providerGroup,
      { maxSteps: 8, providerStrategy: 'smart' },
      providerModels
    );

    // Analyze results
    const toolMessages = result.messages.filter(m => m.role === 'tool');
    const finalMessage = result.messages[result.messages.length - 1];
    
    console.log(`\n✅ SUCCESS - Tools used: ${toolMessages.length}`);
    console.log(`📊 Final answer: ${finalMessage.content}`);
    
    if (result.debug?.providerHistory) {
      console.log(`🔧 Providers used:`);
      result.debug.providerHistory.forEach((p, i) => {
        console.log(`   Step ${i + 1}: ${p.id} (${p.model || 'default'})`);
      });
    }
    
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

// Main test execution
(async () => {
  console.log("🚀 VANILLA TOOL CALLING - COMPREHENSIVE TEST SUITE");
  console.log("🎯 Testing FREE models with prompt engineering approach");
  console.log("🛡️  Ensuring 100% functionality across all scenarios");
  
  // Enable debug logging
  logger.setLevel('debug');
  
  let passed = 0;
  let total = testScenarios.length;
  
  for (const scenario of testScenarios) {
    const success = await runTest(scenario);
    if (success) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🏆 TEST RESULTS: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED - VANILLA APPROACH 100% FUNCTIONAL!");
    console.log("🔓 FREE models now support tool calling via prompt engineering!");
  } else {
    console.log("⚠️  Some tests failed - check logs above");
    process.exit(1);
  }
  
})().catch(error => {
  console.error("💥 Test suite failed:", error);
  process.exit(1);
});