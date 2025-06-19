import { defineTool } from "../core/Tool.js";
import { runAgent, ProviderConfig } from "../core/AgentRunner.js";
import { openRouter } from "../providers/openrouter.js";
import { google } from "../providers/google.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";

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

// Configure providers with fallback logic
// Models can be overridden via environment variables or use defaults from config
const providers: ProviderConfig[] = [
  // Primary providers (free models)
  { p: openRouter, model: "mistralai/mistral-small-3.1-24b-instruct:free", priority: "primary" },
  { p: google, model: config.providers.google.defaultModel, priority: "primary" },
  
  // Fallback provider (paid model)
  { p: openai, model: config.providers.openai.defaultModel, priority: "fallback" },
];

const tools = {
  add: addTool,
  multiply: multiplyTool,
  divide: divideTool,
};

(async () => {
  console.log("🚀 Starting Math Agent Example");
  console.log("📋 Available tools: add, multiply, divide");
  console.log("🔄 Provider fallback: OpenRouter/Google → OpenAI");
  console.log("=".repeat(50));

  try {
    const messages = [
      {
        role: "system" as const,
        content: "You are a helpful math assistant. Use the available tools to solve mathematical problems step by step. Always show your work and explain your reasoning.",
      },
      {
        role: "user" as const,
        content: "I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.",
      },
    ];

    console.log("💭 User question:", messages[1].content);
    console.log("\n🤖 Agent thinking...\n");

    const result = await runAgent(messages, tools, providers, 10);

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