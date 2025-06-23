import { defineTool } from "../core/Tool.js";
import { ConversationAgent } from "../core/ConversationAgent.js";
import { logger } from "../core/logger.js";
import { createVanillaOpenRouterProvider } from "../providers/openrouterVanilla.js";
import { googleOpenAI } from "../providers/googleOpenAI.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";
// Create VANILLA OpenRouter providers with custom headers for FREE models
const vanillaOpenRouter1 = createVanillaOpenRouterProvider(undefined, undefined, {
    headers: {
        "HTTP-Referer": "https://example.com",
        "X-Title": "Ceata Math Agent",
    },
});
const vanillaOpenRouter2 = createVanillaOpenRouterProvider(undefined, undefined, {
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
    execute: async ({ a, b }) => {
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
    execute: async ({ a, b }) => {
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
    execute: async ({ a, b }) => {
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
const providers = [
    // Primary providers (FREE - VANILLA tool calling via prompt engineering)
    { p: vanillaOpenRouter1, model: "mistralai/mistral-small-3.2-24b-instruct:free", priority: "primary" },
    { p: vanillaOpenRouter2, model: "deepseek/deepseek-r1-0528-qwen3-8b:free", priority: "primary" },
    { p: googleOpenAI, model: config.providers.google.defaultModel, priority: "primary" },
    // Fallback provider (PAID - only if free options exhausted)
    { p: openai, model: config.providers.openai.defaultModel, priority: "fallback" },
];
const tools = {
    add: addTool,
    multiply: multiplyTool,
    divide: divideTool,
};
// Enable debug output
logger.setLevel('debug');
(async () => {
    console.log("🚀 Starting Math Agent Example - VANILLA TOOL CALLING");
    console.log("📋 Available tools: add, multiply, divide");
    console.log("🧠 VANILLA Strategy: Prompt engineering + text parsing for FREE models");
    console.log("💰 Mistral-Small-3.2:free → DeepSeek-R1:free → Google OpenAI → OpenAI (only if needed)");
    console.log("🛡️  VANILLA tool calling: Works with ANY model, even free ones!");
    console.log("🔧 Enhanced multi-step task detection + Manual tool parsing");
    console.log("=".repeat(50));
    try {
        const messages = [
            {
                role: "system",
                content: "You are a helpful math assistant. You MUST use the available tools to perform ALL calculations. Never calculate manually. Use this format: TOOL_CALL: {\"name\": \"multiply\", \"arguments\": {\"a\": 15, \"b\": 8}}. For multi-step problems, make one tool call at a time, wait for results, then continue.",
            },
            {
                role: "user",
                content: "I need to calculate the area of a rectangle that is 15 units long and 8 units wide. Then, I want to know what happens if I divide that area by 3.",
            },
        ];
        console.log("💭 User question:", messages[1].content);
        console.log("\n🤖 Agent thinking...\n");
        // Map legacy ProviderConfig[] to ConversationAgent inputs
        const providerGroup = {
            primary: providers.filter(p => p.priority === 'primary').map(p => p.p),
            fallback: providers.filter(p => p.priority === 'fallback').map(p => p.p)
        };
        const providerModels = {};
        providers.forEach(pc => {
            providerModels[pc.p.id] = pc.model;
        });
        const agent = new ConversationAgent();
        const result = await agent.run(messages, tools, providerGroup, { maxSteps: 10, providerStrategy: 'smart' }, providerModels);
        console.log("\n" + "=".repeat(50));
        console.log("📝 Final conversation:");
        result.messages.forEach((msg, i) => {
            const emoji = msg.role === "user" ? "👤" :
                msg.role === "assistant" ? "🤖" :
                    msg.role === "tool" ? "🔧" : "⚙️";
            console.log(`${emoji} ${msg.role}: ${msg.content}`);
        });
        // Show which providers were used
        if (result.debug) {
            console.log("\n🔧 Provider history:");
            result.debug.providerHistory.forEach((p, i) => {
                console.log(`Step ${i + 1}: ${p.id}${p.model ? ` (${p.model})` : ''}`);
            });
        }
    }
    catch (error) {
        console.error("❌ Error running math agent:", error);
        process.exit(1);
    }
})();
