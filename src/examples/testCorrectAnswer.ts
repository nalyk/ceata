/**
 * QUANTUM PLANNER CORRECTNESS TEST
 * 
 * Testing the fundamental fix: Does the enhanced planning system
 * correctly solve "Calculate area of 15x8 rectangle, then divide by 3"
 * Expected: 15 × 8 = 120, then 120 ÷ 3 = 40
 */

import { defineTool } from "../core/Tool.js";
import { QuantumConversationAgent } from "../core/QuantumConversationAgent.js";
import { logger } from "../core/logger.js";
import { createVanillaOpenRouterProvider } from "../providers/openrouterVanilla.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";
import { config } from "../config/index.js";

// Create provider
const vanillaProvider = createVanillaOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Quantum Correctness Test",
  },
});

// Define math tools
const tools = {
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
      const result = a * b;
      console.log(`🧮 STEP 1: ${a} × ${b} = ${result}`);
      return result;
    },
  }),

  divide: defineTool({
    name: "divide",
    description: "Divide two numbers",
    parameters: {
      type: "object",
      properties: {
        a: { type: "number", description: "Dividend (number to be divided)" },
        b: { type: "number", description: "Divisor (number to divide by)" },
      },
      required: ["a", "b"],
    },
    execute: async ({ a, b }: { a: number; b: number }) => {
      if (b === 0) {
        throw new Error("Cannot divide by zero");
      }
      const result = a / b;
      console.log(`🧮 STEP 2: ${a} ÷ ${b} = ${result}`);
      return result;
    },
  }),
};

async function testCorrectAnswer() {
  console.log("🎯 QUANTUM PLANNER CORRECTNESS TEST");
  console.log("Testing: 'Calculate area of 15x8 rectangle, then divide by 3'");
  console.log("Expected: 15 × 8 = 120, then 120 ÷ 3 = 40");
  console.log("=" .repeat(60));

  // Enable debug logging
  logger.setLevel('debug');

  const quantumAgent = new QuantumConversationAgent();
  
  const providerGroup = {
    primary: [vanillaProvider, googleOpenAI],
    fallback: []
  };
  
  const providerModels = {
    "openrouter-vanilla": "mistralai/mistral-small-3.2-24b-instruct:free",
    "google-openai": config.providers.google.defaultModel
  };

  const testInput = "Calculate the area of a rectangle that is 15 units long and 8 units wide, then divide that area by 3.";

  try {
    console.log(`\n🧠 Quantum Planning Analysis:`);
    console.log(`Input: "${testInput}"`);
    console.log(`\n🔧 Executing with enhanced sequential logic...`);

    const messages = [
      {
        role: "system" as const,
        content: "You are a quantum-enhanced math assistant. Use the available tools for ALL calculations. For multi-step problems, complete ALL steps in sequence."
      },
      {
        role: "user" as const,
        content: testInput
      }
    ];

    const result = await quantumAgent.run(
      messages, 
      tools, 
      providerGroup, 
      { maxSteps: 10, providerStrategy: 'smart' }, 
      providerModels
    );

    console.log(`\n📊 QUANTUM EXECUTION RESULTS:`);
    if (result.debug) {
      console.log(`   Strategy: ${result.debug.quantumMetrics.strategyType}`);
      console.log(`   Steps Planned: ${result.debug.plan.steps.length}`);
      console.log(`   Steps Executed: ${result.debug.steps}`);
      console.log(`   Tool Executions: ${result.metrics.toolExecutions}`);
      console.log(`   Adaptations: ${result.debug.adaptations}`);
    }

    console.log(`\n📝 Complete Conversation:`);
    result.messages.forEach((msg, i) => {
      const emoji = msg.role === "user" ? "👤" : 
                   msg.role === "assistant" ? "🤖" : 
                   msg.role === "tool" ? "🔧" : "⚙️";
      console.log(`${emoji} ${msg.role}: ${msg.content || '(tool call result)'}`);
    });

    // Extract the final numerical answer
    const finalMessage = result.messages[result.messages.length - 1];
    const finalAnswer = finalMessage?.content;
    
    console.log(`\n🎯 CORRECTNESS ANALYSIS:`);
    console.log(`   Expected Answer: 40`);
    console.log(`   Final Response: "${finalAnswer}"`);
    
    // Check if the answer contains "40"
    const containsCorrectAnswer = finalAnswer?.includes('40') || false;
    const hasMultipleSteps = result.metrics.toolExecutions >= 2;
    
    if (containsCorrectAnswer && hasMultipleSteps) {
      console.log(`   ✅ SUCCESS: Correct answer found with proper multi-step execution!`);
      console.log(`   🎉 QUANTUM PLANNING VICTORY - Universal multi-step logic works!`);
    } else if (containsCorrectAnswer) {
      console.log(`   ⚠️  PARTIAL: Correct answer but may not have used proper multi-step logic`);
    } else {
      console.log(`   ❌ FAILURE: Incorrect answer or incomplete execution`);
      console.log(`   🔧 Multi-step logic needs further enhancement`);
    }

  } catch (error) {
    console.log(`❌ TEST FAILED: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("🚀 Test complete - Universal planning system verification done!");
}

// Execute the correctness test
(async () => {
  try {
    await testCorrectAnswer();
  } catch (error) {
    console.error("💥 Test execution failed:", error);
    process.exit(1);
  }
})().catch(error => {
  console.error("💥 Unexpected test error:", error);
  process.exit(1);
});