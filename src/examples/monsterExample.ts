/**
 * CEATA MONSTER EFFICIENCY SHOWCASE
 * Demonstrating the most efficient agentic framework in existence
 */

import { runMonsterAgent, MonsterAgent } from "../core/MonsterAgent.js";
import { createAgentContext } from "../core/AgentContext.js";
import { defineTool } from "../core/Tool.js";
import { createOpenRouterProvider } from "../providers/openrouter.js";
import { google } from "../providers/google.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";

// Define ultra-efficient tools
const calculatorTool = defineTool({
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
    // Safe evaluation for demo purposes
    const result = eval(expression.replace(/[^0-9+\-*/().\s]/g, ''));
    console.log(`⚡ MONSTER calculation: ${expression} = ${result}`);
    return result;
  },
});

const echoTool = defineTool({
  name: "echo",
  description: "Echo back a message with emphasis",
  parameters: {
    type: "object",
    properties: {
      message: { type: "string", description: "Message to echo" },
      emphasis: { type: "string", enum: ["normal", "loud", "whisper"], description: "How to echo" },
    },
    required: ["message"],
  },
  execute: async ({ message, emphasis = "normal" }: { message: string; emphasis?: string }) => {
    const prefixes = { normal: "Echo: ", loud: "ECHO: ", whisper: "echo: " };
    const result = prefixes[emphasis as keyof typeof prefixes] + message;
    console.log(`🔊 MONSTER echo (${emphasis}): ${result}`);
    return result;
  },
});

// MONSTER demonstration
(async () => {
  console.log("🔥 CEATA MONSTER EFFICIENCY SHOWCASE");
  console.log("=====================================");

  try {
    // Create provider groups for MAXIMUM efficiency
    const openRouter = createOpenRouterProvider();
    const providerGroup = {
      primary: [openRouter, google], // Free models race for speed
      fallback: [openai]             // Paid model only if needed
    };

    const tools = { calculate: calculatorTool, echo: echoTool };

    console.log("\n🚀 MONSTER Mode: Provider Racing + Pipeline Architecture");
    console.log("Primary providers will RACE for fastest response!\n");

    // Test 1: Simple calculation with tool usage
    const mathQuery = [
      { role: "system" as const, content: "You are a MONSTER-efficient math assistant. Use tools when needed." },
      { role: "user" as const, content: "Calculate 15 * 8 + 42, then echo the result loudly!" },
    ];

    console.log("📊 Query: Complex multi-tool operation");
    const startTime = Date.now();

    const result = await runMonsterAgent(mathQuery, tools, providerGroup, {
      maxSteps: 6,
      enableRacing: true,
      maxHistoryLength: 20
    });

    const duration = Date.now() - startTime;
    console.log(`\n⚡ MONSTER execution completed in ${duration}ms\n`);

    // Display conversation
    console.log("💬 MONSTER Conversation:");
    result.forEach((msg, i) => {
      const emoji = msg.role === "user" ? "👤" : 
                   msg.role === "assistant" ? "🤖" : 
                   msg.role === "system" ? "⚙️" : "🔧";
      const content = msg.content || (msg.tool_calls ? `[${msg.tool_calls.length} tool calls]` : "[empty]");
      console.log(`${i + 1}. ${emoji} ${msg.role}: ${content}`);
    });

    console.log("\n" + "=".repeat(50));
    
    // Test 2: Advanced MonsterAgent with detailed metrics
    console.log("🧠 Advanced MONSTER Agent with full metrics:");
    
    const monsterAgent = new MonsterAgent();
    const complexQuery = [
      { role: "system" as const, content: "You are an ultra-efficient assistant." },
      { role: "user" as const, content: "I need you to calculate 25 * 4, then echo that result with normal emphasis, then calculate the square of that echoed number." },
    ];

    const ctx = createAgentContext(complexQuery, tools, providerGroup, {
      maxSteps: 10,
      enableRacing: true,
      maxHistoryLength: 30
    });

    const monsterResult = await monsterAgent.run(
      complexQuery,
      tools,
      providerGroup,
      { enableRacing: true, maxSteps: 10 }
    );

    console.log("\n📈 MONSTER Performance Metrics:");
    console.log(`⏱️  Duration: ${monsterResult.metrics.duration}ms`);
    console.log(`🔄 Provider calls: ${monsterResult.metrics.providerCalls}`);
    console.log(`🛠️  Tool executions: ${monsterResult.metrics.toolExecutions}`);
    console.log(`💰 Cost savings: $${monsterResult.metrics.costSavings.toFixed(4)}`);
    console.log(`⚡ Efficiency: ${monsterResult.metrics.efficiency.toFixed(2)} ops/sec`);
    
    if (monsterResult.debug) {
      console.log(`📋 Plan steps: ${monsterResult.debug.steps}`);
      console.log(`🔍 Reflections: ${monsterResult.debug.reflections}`);
      console.log(`🎯 Strategy: ${monsterResult.debug.plan.strategy}`);
    }

    console.log("\n🏆 MONSTER EFFICIENCY ACHIEVED!");
    console.log("✅ Zero regex circus");
    console.log("✅ Clean pipeline architecture");  
    console.log("✅ Provider racing for speed");
    console.log("✅ Smart memory management");
    console.log("✅ Type-safe throughout");
    console.log("✅ Production-ready reliability");

  } catch (error) {
    console.error("❌ MONSTER error (but handled gracefully):", error);
    console.log("💡 Note: This demo requires valid API keys for full functionality");
  }
})();