import { defineTool } from "../core/Tool.js";
import { createOpenRouterProvider } from "../providers/openrouter.js";
import { openai } from "../providers/openai.js";
import { config } from "../config/index.js";
// Streaming-enabled OpenRouter provider
const openRouter = createOpenRouterProvider(undefined, undefined, {
    headers: {
        "HTTP-Referer": "https://example.com",
        "X-Title": "Ceata Streaming Example",
    },
    stream: true,
});
// Basic math tools
const add = defineTool({
    name: "add",
    description: "Add two numbers",
    parameters: {
        type: "object",
        properties: {
            a: { type: "number" },
            b: { type: "number" },
        },
        required: ["a", "b"],
    },
    execute: async ({ a, b }) => a + b,
});
const multiply = defineTool({
    name: "multiply",
    description: "Multiply two numbers",
    parameters: {
        type: "object",
        properties: {
            a: { type: "number" },
            b: { type: "number" },
        },
        required: ["a", "b"],
    },
    execute: async ({ a, b }) => a * b,
});
const tools = { add, multiply };
const providers = [
    { p: openRouter, model: "mistralai/mistral-small-3.1-24b-instruct:free" },
    { p: openai, model: config.providers.openai.defaultModel },
];
async function streamOnce(messages) {
    for (const { p, model } of providers) {
        try {
            const stream = p.chat({ model, messages, tools, stream: true });
            let last = null;
            let prev = "";
            for await (const chunk of stream) {
                const msg = chunk.messages[chunk.messages.length - 1];
                const content = msg.content || "";
                process.stdout.write(content.slice(prev.length));
                prev = content;
                last = chunk;
            }
            process.stdout.write("\n");
            if (last) {
                return {
                    result: last.messages[last.messages.length - 1],
                    finish: last.finishReason,
                };
            }
        }
        catch (err) {
            console.warn(`Provider ${p.id} failed:`, err);
        }
    }
    throw new Error("All providers failed");
}
(async () => {
    const history = [
        {
            role: "system",
            content: "You are a helpful math assistant. Always use the available tools to calculate.",
        },
        {
            role: "user",
            content: "What is 12 multiplied by 8, then add 10?",
        },
    ];
    console.log("🚀 Streaming conversation:\n");
    for (let i = 0; i < 4; i++) {
        const { result, finish } = await streamOnce(history);
        history.push(result);
        if (finish === "tool_call" && result.tool_calls) {
            for (const call of result.tool_calls) {
                const fn = tools[call.function.name];
                if (!fn)
                    continue;
                const args = JSON.parse(call.function.arguments);
                const output = await fn.execute(args);
                history.push({
                    role: "tool",
                    tool_call_id: call.id,
                    name: call.function.name,
                    content: JSON.stringify(output),
                });
            }
        }
        else {
            break;
        }
    }
    console.log("\n📝 Final conversation:");
    for (const m of history) {
        const tag = m.role === "user" ? "👤" : m.role === "assistant" ? "🤖" : "🔧";
        console.log(`${tag} ${m.role}: ${m.content}`);
    }
})();
