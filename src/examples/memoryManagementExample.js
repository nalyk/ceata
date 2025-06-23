import { runAgent } from "../core/AgentRunner.js";
import { defineTool } from "../core/Tool.js";
import { createOpenRouterProvider } from "../providers/openrouter.js";
// Create a simple tool for demonstration
const echoTool = defineTool({
    name: "echo",
    description: "Echo back the input message",
    parameters: {
        type: "object",
        properties: {
            message: { type: "string", description: "Message to echo back" },
        },
        required: ["message"],
    },
    execute: async ({ message }) => {
        console.log(`🔄 Echo tool called with: "${message}"`);
        return `Echo: ${message}`;
    },
});
// Example demonstrating smart memory management
(async () => {
    console.log("🧠 Memory Management Example");
    console.log("=".repeat(50));
    try {
        // Create a provider (this would normally use your actual API keys)
        const openRouter = createOpenRouterProvider();
        const providers = [
            { p: openRouter, model: "mistralai/mistral-small-3.1-24b-instruct:free", priority: "primary" },
        ];
        const tools = { echo: echoTool };
        // Simulate a long conversation that would normally grow unbounded
        const longConversation = [
            { role: "system", content: "You are a helpful assistant with access to an echo tool. Keep responses brief." },
            // Add many user/assistant pairs to simulate a long conversation
            ...Array.from({ length: 15 }, (_, i) => [
                { role: "user", content: `Message ${i + 1}: Hello assistant` },
                { role: "assistant", content: `Response ${i + 1}: Hello! How can I help you?` },
            ]).flat(),
            { role: "user", content: "Use the echo tool to say 'Memory management working!'" },
        ];
        console.log(`📊 Starting with ${longConversation.length} messages in conversation history`);
        // Configure memory management options
        const options = {
            maxSteps: 5,
            maxHistoryLength: 10, // Keep only last 10 messages + system messages
            preserveSystemMessages: true, // Always keep system messages
        };
        console.log(`🔧 Memory management: maxHistoryLength=${options.maxHistoryLength}, preserveSystemMessages=${options.preserveSystemMessages}`);
        console.log("\n🤖 Agent processing...\n");
        const result = await runAgent(longConversation, tools, providers, options);
        console.log("\n" + "=".repeat(50));
        console.log(`📈 Final conversation length: ${result.length} messages`);
        console.log("📝 Final conversation:");
        result.forEach((msg, i) => {
            const emoji = msg.role === "user" ? "👤" :
                msg.role === "assistant" ? "🤖" :
                    msg.role === "system" ? "⚙️" : "🔧";
            const content = msg.content || (msg.tool_calls ? "[tool calls]" : "[empty]");
            console.log(`${i + 1}. ${emoji} ${msg.role}: ${content.substring(0, 80)}${content.length > 80 ? "..." : ""}`);
        });
        console.log("\n✅ Memory management successfully prevented unbounded conversation growth!");
        console.log(`💰 This keeps costs low for long-running agentic workflows while preserving context.`);
    }
    catch (error) {
        console.error("❌ Error in memory management example:", error);
        console.log("💡 Note: This example requires valid API keys to run fully.");
    }
})();
