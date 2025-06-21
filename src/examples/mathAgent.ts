import { defineTool } from "../core/Tool.js";
import { runAgent, ProviderConfig } from "../core/AgentRunner.js";
import { createOpenRouterProvider } from "../providers/openrouter.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";

// Create an OpenRouter provider with custom headers
const openRouter = createOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Ceata Math Agent",
  },
});

// Define math tools
const addTool = defineTool({
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
    const result = a + b;
    console.log(`🧮 Adding ${a} + ${b} = ${result}`);
    return result;
  },
});

const multiplyTool = defineTool({
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
    console.log(`🧮 Multiplying ${a} × ${b} = ${result}`);
    return result;
  },
});

const divideTool = defineTool({
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
    console.log(`🧮 Dividing ${a} ÷ ${b} = ${result}`);
    return result;
  },
});

// Configure providers with intelligent fallback logic
// SMART STRATEGY: Sequential free providers first (preserves quotas), then paid fallback
const providers: ProviderConfig[] = [
  // Primary providers (FREE - Optimized for universal tool calling)
  { p: googleOpenAI, model: config.providers.google.defaultModel, priority: "primary" },
  { p: openRouter, model: "qwen/qwen3-235b-a22b:free", priority: "primary" },
  { p: openRouter, model: "meta-llama/llama-3.1-nemotron-ultra-253b-v1:free", priority: "primary" },
  
  // Fallback provider (PAID - only if free options exhausted)
  { p: openai, model: config.providers.openai.defaultModel, priority: "fallback" },
];

const tools = {
  add: addTool,
  multiply: multiplyTool,
  divide: divideTool,
};

(async () => {
  console.log("🚀 Starting Math Agent Example - UNIVERSAL TOOL CALLING");
  console.log("📋 Available tools: add, multiply, divide");
  console.log("🧠 Smart Strategy: Try free providers sequentially (preserves quotas)");
  console.log("💰 Google OpenAI → Qwen3-235B → Nemotron → OpenAI (only if needed)");
  console.log("🛡️  Universal tool calling: All models support function calling");
  console.log("🔧 Enhanced multi-step task detection");
  console.log("=".repeat(50));

  try {
    const messages = [
      {
        role: "system" as const,
        content: "You are a helpful math assistant. You MUST use the available tools (add, multiply, divide) to perform ALL calculations. Never do calculations manually - always use the appropriate tool. For multi-step problems, complete each step sequentially and show your work. Explain your reasoning between steps.",
      },
      {
        role: "user" as const,
        content: "I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.",
      },
    ];

    console.log("💭 User question:", messages[1].content);
    console.log("\n🤖 Agent thinking...\n");

    const result = await runAgent(messages, tools, providers, {
      maxSteps: 10,
      providerStrategy: 'smart'
    });

    console.log("\n" + "=".repeat(50));
    console.log("📝 Final conversation:");
    result.forEach((msg, i) => {
      const emoji = msg.role === "user" ? "👤" : 
                   msg.role === "assistant" ? "🤖" : 
                   msg.role === "tool" ? "🔧" : "⚙️";
      console.log(`${emoji} ${msg.role}: ${msg.content}`);
    });

  } catch (error) {
    console.error("❌ Error running math agent:", error);
    process.exit(1);
  }
})();
