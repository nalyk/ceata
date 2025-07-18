/**
 * VANILLA OpenRouter Provider - Manual Tool Calling for FREE Models
 * Uses prompt engineering + text parsing instead of API tool calling
 */
import { config } from "../config/index.js";
import { postJSON } from "../core/http.js";
import { logger } from "../core/logger.js";
export function createVanillaOpenRouterProvider(apiKey, baseUrl, options) {
    const providerConfig = config.providers.openrouter;
    const actualApiKey = apiKey || providerConfig.apiKey;
    const actualBaseUrl = baseUrl || providerConfig.baseUrl;
    const actualMaxTokens = options?.maxTokens || providerConfig.maxTokens;
    const actualTemperature = options?.temperature || providerConfig.temperature;
    const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;
    const extraHeaders = options?.headers;
    if (!actualApiKey) {
        throw new Error("Vanilla OpenRouter provider requires a non-empty API key. Set OPENROUTER_API_KEY or pass it to createVanillaOpenRouterProvider().");
    }
    return {
        id: "openrouter-vanilla",
        supportsTools: true,
        async chat(chatOptions) {
            const { model, messages, tools, timeoutMs = actualTimeoutMs } = chatOptions;
            // Build system prompt with tool definitions
            const systemPrompt = buildSystemPromptWithTools(tools);
            const enhancedMessages = enhanceMessagesForManualTools(messages, systemPrompt);
            const requestBody = {
                model,
                messages: enhancedMessages,
                max_tokens: actualMaxTokens,
                temperature: actualTemperature,
            };
            const url = `${actualBaseUrl}/api/v1/chat/completions`;
            const reqHeaders = {
                Authorization: `Bearer ${actualApiKey}`,
                "Content-Type": "application/json",
                ...extraHeaders
            };
            const response = await postJSON(url, reqHeaders, requestBody, timeoutMs);
            if (!response.ok) {
                const errorText = await response.text();
                let errorJson = {};
                try {
                    errorJson = JSON.parse(errorText);
                }
                catch { }
                const message = errorJson.error?.message || response.statusText;
                const code = errorJson.error?.code || response.status;
                throw new Error(`Vanilla OpenRouter API error: ${code} ${message}`);
            }
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                if (data.error) {
                    throw new Error(`Vanilla OpenRouter API Error: ${data.error.message}`);
                }
                throw new Error("Invalid response from Vanilla OpenRouter: no choices returned");
            }
            const choice = data.choices[0];
            const content = choice.message.content || "";
            // Parse content for manual tool calls
            const { cleanedContent, toolCalls } = parseManualToolCalls(content);
            const assistantMessage = {
                role: "assistant",
                content: cleanedContent,
                tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
            };
            const result = {
                messages: [...messages, assistantMessage],
                finishReason: toolCalls.length > 0 ? "tool_call" :
                    choice.finish_reason === "length" ? "length" : "stop",
                usage: data.usage ? {
                    prompt: data.usage.prompt_tokens || 0,
                    completion: data.usage.completion_tokens || 0,
                    total: data.usage.total_tokens || 0,
                } : undefined,
            };
            return result;
        },
    };
}
/**
 * Build enhanced system prompt with tool definitions
 */
function buildSystemPromptWithTools(tools) {
    if (!tools || Object.keys(tools).length === 0) {
        return "";
    }
    const toolDescriptions = Object.values(tools).map(tool => {
        return `- ${tool.schema.name}: ${tool.schema.description}
  Parameters: ${JSON.stringify(tool.schema.parameters)}`;
    }).join('\n');
    return `You are a helpful assistant with access to tools. When you need to use a tool, output it in this EXACT format:

TOOL_CALL: {"name": "tool_name", "arguments": {"param1": "value1", "param2": "value2"}}

Available tools:
${toolDescriptions}

Rules:
1. ALWAYS use tools when calculation or data retrieval is needed
2. Output tool calls in the exact format above
3. FOR SEQUENTIAL TASKS: Make ONE tool call at a time, wait for the result, then continue
4. ALWAYS use the actual result from previous tool calls as input to subsequent tools
5. After tool calls, I will provide results and you can continue the conversation
6. Be precise with parameter values and types

IMPORTANT: For multi-step calculations, execute tools sequentially:
- Step 1: Make first tool call and wait for result
- Step 2: Use that result in the next tool call
- Never guess or use incorrect values for subsequent tool calls`;
}
/**
 * Enhance messages to include tool instructions
 */
function enhanceMessagesForManualTools(messages, systemPrompt) {
    const enhancedMessages = [];
    // Add system prompt if we have tools
    if (systemPrompt) {
        enhancedMessages.push({
            role: "system",
            content: systemPrompt
        });
    }
    // Convert messages to OpenAI format
    for (const msg of messages) {
        if (msg.role === "system" && systemPrompt) {
            // Skip original system message if we added enhanced one
            continue;
        }
        const payload = { role: msg.role };
        if (msg.content !== undefined && msg.content !== null) {
            payload.content = msg.content;
        }
        // Handle tool results - convert back to text
        if (msg.role === "tool") {
            payload.role = "user";
            payload.content = `Tool ${msg.name} result: ${msg.content}`;
        }
        enhancedMessages.push(payload);
    }
    return enhancedMessages;
}
/**
 * Parse manual tool calls from response text
 */
function parseManualToolCalls(content) {
    const toolCalls = [];
    // Enhanced pattern to capture complete JSON objects, including nested structures
    const toolCallPattern = /TOOL_CALL:\s*(\{[^}]*(?:\{[^}]*\}[^}]*)*\})/g;
    let match;
    let lastIndex = 0;
    const cleanedParts = [];
    // UNIVERSAL SEQUENTIAL FIX: Only parse the FIRST tool call to enforce sequential execution
    const toolCallMatches = content.match(/TOOL_CALL:\s*\{[^}]*\}/g);
    if (toolCallMatches) {
        // Process only the first tool call for proper sequential execution
        const match = toolCallMatches[0];
        // Log if multiple tool calls were attempted (for debugging)
        if (toolCallMatches.length > 1) {
            console.log(`[DEBUG] Sequential execution: Found ${toolCallMatches.length} tool calls, processing first one only`);
        }
        // Process only the first match
        {
            const jsonStr = match.replace(/TOOL_CALL:\s*/, '');
            // Try multiple repair strategies for incomplete JSON
            const repairStrategies = [
                jsonStr, // Original
                jsonStr + '}', // Add missing closing brace
                jsonStr.replace(/,\s*$/, '') + '}', // Remove trailing comma and close
                jsonStr.replace(/([^"}])$/, '$1"}'), // Add missing quote and brace
            ];
            for (const strategy of repairStrategies) {
                try {
                    const toolCallData = JSON.parse(strategy);
                    if (toolCallData.name && toolCallData.arguments) {
                        const toolCall = {
                            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: "function",
                            function: {
                                name: toolCallData.name,
                                arguments: JSON.stringify(toolCallData.arguments || {}),
                            },
                        };
                        toolCalls.push(toolCall);
                        logger.debug(`🔧 [Vanilla] Parsed tool call: ${toolCallData.name}`);
                        break; // Success, move to next match
                    }
                }
                catch (error) {
                    // Try next strategy
                    continue;
                }
            }
        }
    }
    // Fallback to original regex approach
    while ((match = toolCallPattern.exec(content)) !== null) {
        try {
            const toolCallData = JSON.parse(match[1]);
            // Check if we already parsed this one
            const alreadyExists = toolCalls.some(tc => tc.function.name === toolCallData.name &&
                tc.function.arguments === JSON.stringify(toolCallData.arguments));
            if (!alreadyExists) {
                const toolCall = {
                    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: "function",
                    function: {
                        name: toolCallData.name,
                        arguments: JSON.stringify(toolCallData.arguments || {}),
                    },
                };
                toolCalls.push(toolCall);
                logger.debug(`🔧 [Vanilla] Parsed tool call (regex): ${toolCallData.name}`);
            }
        }
        catch (error) {
            logger.warn(`❌ [Vanilla] Failed to parse tool call: ${match[1]}`);
        }
    }
    // Clean content by removing tool call lines
    const cleanedContent = content
        .replace(/TOOL_CALL:\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/g, '')
        .replace(/^\s*\n/gm, '') // Remove empty lines
        .trim();
    return { cleanedContent, toolCalls };
}
// Export default instance using configuration
export const vanillaOpenRouter = createVanillaOpenRouterProvider();
