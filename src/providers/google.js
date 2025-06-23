import { config } from "../config/index.js";
import { postJSON } from "../core/http.js";
// Helper function to convert OpenAI-style messages to Google format
function convertMessagesToGoogleFormat(messages) {
    const contents = [];
    for (const message of messages) {
        if (message.role === "system") {
            // Google doesn't have a system role, so we'll add it as a user message with special formatting
            contents.push({
                role: "user",
                parts: [{ text: `System: ${message.content}` }],
            });
        }
        else if (message.role === "assistant") {
            if (message.tool_calls && message.tool_calls.length > 0) {
                // Handle tool calls
                contents.push({
                    role: "model",
                    parts: message.tool_calls.map(tc => {
                        try {
                            const args = typeof tc.function.arguments === 'string'
                                ? JSON.parse(tc.function.arguments)
                                : tc.function.arguments;
                            return {
                                functionCall: {
                                    name: tc.function.name,
                                    args: args,
                                },
                            };
                        }
                        catch (e) {
                            console.error("Error parsing tool call arguments:", tc.function.arguments);
                            return {
                                functionCall: {
                                    name: tc.function.name,
                                    args: {},
                                },
                            };
                        }
                    }),
                });
            }
            else if (message.content) {
                contents.push({
                    role: "model",
                    parts: [{ text: message.content }],
                });
            }
        }
        else if (message.role === "tool") {
            // Handle tool responses
            contents.push({
                role: "function",
                parts: [
                    {
                        functionResponse: {
                            name: message.name || "unknown",
                            response: {
                                result: message.content,
                            },
                        },
                    },
                ],
            });
        }
        else {
            // User message
            contents.push({
                role: "user",
                parts: [{ text: message.content || "" }],
            });
        }
    }
    return contents;
}
export function createGoogleProvider(apiKey, baseUrl, options) {
    const providerConfig = config.providers.google;
    const actualApiKey = apiKey || providerConfig.apiKey;
    const actualBaseUrl = baseUrl || providerConfig.baseUrl;
    const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;
    if (!actualApiKey) {
        throw new Error("Google provider requires a non-empty API key. Set GOOGLE_API_KEY or pass it to createGoogleProvider().");
    }
    return {
        id: "google",
        supportsTools: true,
        async chat(options) {
            const { model, messages, tools, timeoutMs = actualTimeoutMs } = options;
            const contents = convertMessagesToGoogleFormat(messages);
            const requestBody = {
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000,
                },
            };
            if (tools && Object.keys(tools).length > 0) {
                requestBody.tools = [{
                        functionDeclarations: Object.values(tools).map(tool => ({
                            name: tool.schema.name,
                            description: tool.schema.description,
                            parameters: tool.schema.parameters,
                        })),
                    }];
            }
            // Handle model name - remove "models/" prefix if present, and "google/" prefix
            let apiModel = model.startsWith("google/") ? model.substring("google/".length) : model;
            if (!apiModel.startsWith("models/")) {
                apiModel = `models/${apiModel}`;
            }
            const url = new URL(`${actualBaseUrl}/v1beta/${apiModel}:generateContent`);
            url.searchParams.append("key", actualApiKey);
            const response = await postJSON(url.toString(), {}, requestBody, timeoutMs);
            if (!response.ok) {
                const errorText = await response.text();
                let errorJson = {};
                try {
                    errorJson = JSON.parse(errorText);
                }
                catch (e) {
                    // Not a JSON error
                }
                const message = errorJson.error?.message || response.statusText;
                const code = errorJson.error?.code || response.status;
                throw new Error(`Google API error: ${code} ${message}`);
            }
            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                if (data.error) {
                    throw new Error(`Google API Error: ${data.error.message} (Code: ${data.error.code})`);
                }
                // Check for a prompt feedback block
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                    const { blockReason, safetyRatings } = data.promptFeedback;
                    const reason = `Request blocked due to ${blockReason}. Safety Ratings: ${JSON.stringify(safetyRatings)}`;
                    console.error(`❌ Google API Error: ${reason}`);
                    throw new Error(reason);
                }
                throw new Error("Invalid response from Google AI: no candidates returned");
            }
            const candidate = data.candidates[0];
            const content = candidate.content;
            if (!content || !content.parts || content.parts.length === 0) {
                throw new Error("Invalid response format from Google AI");
            }
            // Process the response
            let assistantContent = null;
            let toolCalls = undefined;
            for (const part of content.parts) {
                if (part.text) {
                    assistantContent = part.text;
                }
                else if (part.functionCall) {
                    if (!toolCalls)
                        toolCalls = [];
                    toolCalls.push({
                        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: "function",
                        function: {
                            name: part.functionCall.name,
                            arguments: JSON.stringify(part.functionCall.args || {}),
                        },
                    });
                }
            }
            const assistantMessage = {
                role: "assistant",
                content: assistantContent,
                tool_calls: toolCalls,
            };
            const result = {
                messages: [...messages, assistantMessage],
                finishReason: toolCalls ? "tool_call" :
                    candidate.finishReason === "MAX_TOKENS" ? "length" : "stop",
                usage: data.usageMetadata ? {
                    prompt: data.usageMetadata.promptTokenCount || 0,
                    completion: data.usageMetadata.candidatesTokenCount || 0,
                    total: data.usageMetadata.totalTokenCount || 0,
                } : undefined,
            };
            return result;
        },
    };
}
// Export default instance using configuration
export const google = createGoogleProvider();
