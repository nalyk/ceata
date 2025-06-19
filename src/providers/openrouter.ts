import { Provider, ChatMessage, Tool, ChatResult } from "../core/Provider.js";
import { config } from "../config/index.js";

export function createOpenRouterProvider(apiKey?: string, baseUrl?: string, options?: {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}): Provider {
  const providerConfig = config.providers.openrouter;
  const actualApiKey = apiKey || providerConfig.apiKey;
  const actualBaseUrl = baseUrl || providerConfig.baseUrl;
  const actualMaxTokens = options?.maxTokens || providerConfig.maxTokens;
  const actualTemperature = options?.temperature || providerConfig.temperature;
  const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;

  if (!actualApiKey) {
    throw new Error(
      "OpenRouter provider requires a non-empty API key. Set OPENROUTER_API_KEY or pass it to createOpenRouterProvider().",
    );
  }

  return {
    id: "openrouter",
    supportsTools: true,
    async chat(options) {
      const { model, messages, tools, timeoutMs = actualTimeoutMs } = options;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const requestBody: any = {
          model,
          messages: messages.map(msg => {
            const messagePayload: any = { role: msg.role };
            if (msg.content) {
              messagePayload.content = msg.content;
            }
            if (msg.tool_calls) {
              messagePayload.tool_calls = msg.tool_calls;
            }
            if (msg.tool_call_id) {
              messagePayload.tool_call_id = msg.tool_call_id;
            }
            if (msg.name) {
              messagePayload.name = msg.name;
            }
            return messagePayload;
          }),
          max_tokens: actualMaxTokens,
          temperature: actualTemperature,
        };

        // Add tools if supported and provided
        if (tools && Object.keys(tools).length > 0) {
          requestBody.tools = Object.values(tools).map(tool => ({
            type: "function",
            function: {
              name: tool.schema.name,
              description: tool.schema.description,
              parameters: tool.schema.parameters,
            },
          }));
          requestBody.tool_choice = "auto";
        }

        const response = await fetch(`${actualBaseUrl}/api/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${actualApiKey}`,
            "HTTP-Referer": "https://github.com/vanilla-agentic-framework",
            "X-Title": "Vanilla Agentic Framework",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error("❌ OpenRouter: Failed to parse JSON response:", responseText);
          throw new Error(`OpenRouter failed to return valid JSON. Response: ${responseText}`);
        }

        if (!data.choices || data.choices.length === 0) {
          if (data.error) {
            const errorMessage = `OpenRouter API Error: ${data.error.message} (Code: ${data.error.code || 'N/A'})`;
            console.error(`❌ ${errorMessage}`);
            throw new Error(errorMessage);
          }
          throw new Error("Invalid response from OpenRouter: no choices returned");
        }
        
        const choice = data.choices[0];
        
        if (!choice) {
          throw new Error("No response from OpenRouter");
        }

        // Handle tool calls with robust JSON parsing
        let toolCalls = choice.message.tool_calls;
        if (toolCalls) {
          toolCalls = toolCalls.map((tc: any) => {
            if (tc.function && tc.function.arguments) {
              try {
                // Try to parse the arguments as JSON
                JSON.parse(tc.function.arguments);
                return tc;
              } catch (e) {
                console.log('🔧 [OpenRouter] Attempting to fix malformed JSON arguments...');
                
                // Apply comprehensive JSON normalization strategies
                const argsString = tc.function.arguments;
                let fixedArgs = normalizeOpenRouterJSON(argsString);
                
                if (fixedArgs) {
                  console.log('✅ [OpenRouter] Successfully normalized JSON arguments');
                  return {
                    ...tc,
                    function: {
                      ...tc.function,
                      arguments: fixedArgs
                    }
                  };
                }
                
                console.error('❌ [OpenRouter] Failed to normalize JSON arguments:', argsString);
                throw new Error(`Invalid JSON in tool call arguments: ${argsString}`);
              }
            }
            return tc;
          });
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: choice.message.content || null,
          tool_calls: toolCalls,
        };

        const result: ChatResult = {
          messages: [...messages, assistantMessage],
          finishReason: choice.finish_reason === "tool_calls" ? "tool_call" :
                       choice.finish_reason === "length" ? "length" : "stop",
          usage: data.usage ? {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          } : undefined,
        };

        return result;
      } finally {
        clearTimeout(timeoutId);
      }
    },
  };
}

/**
 * Comprehensive JSON normalization for OpenRouter responses
 */
function normalizeOpenRouterJSON(argsString: string): string | null {
  try {
    // Strategy 1: Direct parsing (might work if it's actually valid)
    JSON.parse(argsString);
    return argsString;
  } catch (e) {
    console.log('🔧 [OpenRouter] Strategy 1 failed, trying normalization...');
  }

  try {
    // Strategy 2: Remove duplicate JSON objects (common OpenRouter issue)
    console.log('🔧 [OpenRouter] Attempting duplicate removal...');
    const duplicatePattern = /(\{[^}]+\})\s*\1+/g;
    let normalized = argsString.replace(duplicatePattern, '$1');
    
    // Strategy 3: Extract first valid JSON object
    const jsonMatches = normalized.match(/\{[^}]*\}/g);
    if (jsonMatches && jsonMatches.length > 0) {
      for (const match of jsonMatches) {
        try {
          JSON.parse(match);
          console.log('🔧 [OpenRouter] Found valid JSON object');
          return match;
        } catch (e) {
          continue;
        }
      }
    }

    // Strategy 4: Try more complex JSON patterns
    console.log('🔧 [OpenRouter] Attempting complex pattern matching...');
    const complexPatterns = [
      // Match complete JSON objects with nested structures
      /\{\s*"[^"]+"\s*:\s*[^,}]+(?:\s*,\s*"[^"]+"\s*:\s*[^,}]+)*\s*\}/g,
      // Even simpler key-value patterns
      /\{\s*"[^"]+"\s*:\s*(?:"[^"]*"|\d+|true|false|null)\s*\}/g
    ];

    for (const pattern of complexPatterns) {
      const matches = argsString.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            JSON.parse(match);
            console.log('🔧 [OpenRouter] Complex pattern match successful');
            return match;
          } catch (e) {
            continue;
          }
        }
      }
    }

    // Strategy 5: Manual key-value extraction as last resort
    console.log('🔧 [OpenRouter] Attempting manual key-value extraction...');
    const keyValuePattern = /"([^"]+)"\s*:\s*(?:"([^"]*)"|(\d+(?:\.\d+)?)|true|false|null)/g;
    const extracted: any = {};
    let kvMatch;

    while ((kvMatch = keyValuePattern.exec(argsString)) !== null) {
      const key = kvMatch[1];
      const stringValue = kvMatch[2];
      const numberValue = kvMatch[3];
      
      if (stringValue !== undefined) {
        extracted[key] = stringValue;
      } else if (numberValue !== undefined) {
        extracted[key] = parseFloat(numberValue);
      } else {
        // Handle boolean/null values
        const rawValue = kvMatch[0].split(':')[1].trim();
        if (rawValue === 'true') extracted[key] = true;
        else if (rawValue === 'false') extracted[key] = false;
        else if (rawValue === 'null') extracted[key] = null;
      }
    }

    if (Object.keys(extracted).length > 0) {
      const result = JSON.stringify(extracted);
      console.log('🔧 [OpenRouter] Manually extracted key-value pairs');
      return result;
    }

    console.log('❌ [OpenRouter] All normalization strategies failed');
    return null;
  } catch (e) {
    console.error('❌ [OpenRouter] Error during JSON normalization:', e);
    return null;
  }
}

// Export default instance using configuration
export const openRouter = createOpenRouterProvider();
