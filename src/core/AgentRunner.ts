import { ChatMessage, Tool, Provider, ChatResult } from "./Provider.js";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

export interface ProviderConfig {
  p: Provider;
  model: string;
  priority: "primary" | "fallback";
  timeoutMs?: number;
  stream?: boolean;
}

export function tryParseJson(text: string) {
  // Fenced code block, ignoring escaped blocks like \```json
  const fencedRegex = /(?<!\\)```json\s*([\s\S]*?)\s*```/i;
  const fencedMatch = text.match(fencedRegex);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // ignore and fall back to brace scanning
    }
  }

  // Scan for the first valid JSON object with balanced braces
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let j = i; j < text.length; j++) {
        const ch = text[j];
        if (escape) {
          escape = false;
          continue;
        }
        if (ch === '\\') {
          escape = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          continue;
        }
        if (!inString) {
          if (ch === '{') depth++;
          else if (ch === '}') {
            depth--;
            if (depth === 0) {
              const candidate = text.slice(i, j + 1);
              try {
                return JSON.parse(candidate.trim());
              } catch {
                break; // malformed, search from next opening brace
              }
            }
          }
        }
      }
    }
  }

  return null;
}

export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  maxSteps = 8,
  timeoutMs?: number,
): Promise<ChatMessage[]> {
  const conversationHistory = [...messages];
  let stepCount = 0;

  while (stepCount < maxSteps) {
    stepCount++;
    const result = await tryProviders(conversationHistory, tools, providers, timeoutMs);
    if (!result) {
      throw new Error("All providers failed to respond");
    }

    const assistantMessage = result.messages[result.messages.length - 1];
    if (assistantMessage) {
      conversationHistory.push(assistantMessage);
    }

    // Check for formal tool calls
    if (result.finishReason === "tool_call" && assistantMessage?.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        const { name, arguments: args } = toolCall.function;
        if (tools[name]) {
          try {
            logger.debug(`🔧 Executing tool: ${name} with args:`, args);
            const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
            const toolResult = await tools[name].execute(parsedArgs);
            logger.debug(`✅ Tool ${name} executed successfully, result:`, toolResult);

            const toolMessage: ChatMessage = {
              role: "tool",
              tool_call_id: toolCall.id,
              name: name,
              content: JSON.stringify(toolResult),
            };
            conversationHistory.push(toolMessage);
          } catch (error) {
            const errorMessage: ChatMessage = {
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            };
            conversationHistory.push(errorMessage);
          }
        } else {
          const errorMessage: ChatMessage = {
            role: "tool",
            tool_call_id: toolCall.id,
            content: `Tool ${name} not found`,
          };
          conversationHistory.push(errorMessage);
        }
      }
    } else if (assistantMessage?.content) {
      // Check for text-based tool calls
      const parsedJson = tryParseJson(assistantMessage.content);
      if (parsedJson && parsedJson.name && parsedJson.arguments) {
        const { name, arguments: args } = parsedJson;
        if (tools[name]) {
          const toolCallId = `call_${name}_${Date.now()}`;
          try {
            logger.debug(`🔧 Executing tool from text: ${name} with args:`, args);
            const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
            const toolResult = await tools[name].execute(parsedArgs);
            logger.debug(`✅ Tool ${name} executed successfully, result:`, toolResult);
            
            const toolMessage: ChatMessage = {
              role: "tool",
              tool_call_id: toolCallId,
              name: name,
              content: JSON.stringify(toolResult),
            };
            conversationHistory.push(toolMessage);
          } catch (error) {
            const errorMessage: ChatMessage = {
              role: "tool",
              tool_call_id: toolCallId,
              content: `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`,
            };
            conversationHistory.push(errorMessage);
          }
        }
      } else {
        // No tool call, conversation is complete
        break;
      }
    } else {
      // No tool call, conversation is complete
      break;
    }
  }

  return conversationHistory;
}

async function tryProviders(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  timeoutMs?: number,
): Promise<ChatResult | null> {
  const providerConfigs = providers
    .slice()
    .sort((a, b) => {
      if (a.priority === b.priority) return 0;
      return a.priority === 'primary' ? -1 : 1;
    });

  for (const providerConfig of providerConfigs) {
    try {
      const priority = providerConfig.priority === 'primary' ? 'primary' : 'fallback';
      logger.info(`🔄 Trying ${priority} provider: ${providerConfig.p.id}`);
      
      const result = await callProvider(providerConfig, messages, tools, { timeoutMs });
      
      if (result && result.messages && result.messages.length > 0) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage) {
          if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
            logger.debug(
              `🔧 Provider ${providerConfig.p.id} returned tool calls:`,
              lastMessage.tool_calls.map(tc => tc.function.name),
            );
          } else if (lastMessage.content) {
            logger.debug(`💬 Provider ${providerConfig.p.id} returned text response`);
          }
        }
        return result;
      }
    } catch (error) {
      logger.warn(`Provider ${providerConfig.p.id} failed:`, error);
    }
  }

  return null;
}

async function callProvider(
  providerConfig: ProviderConfig,
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  optionsOverride?: { timeoutMs?: number }
): Promise<ChatResult | null> {
  const { p: provider, model } = providerConfig;
  
  const timeoutMs =
    optionsOverride?.timeoutMs ?? providerConfig.timeoutMs ?? config.defaults.timeoutMs;

  const options = {
    model,
    messages,
    tools: provider.supportsTools ? tools : undefined,
    timeoutMs,
    stream: providerConfig.stream ?? true,
  };

  const response = await provider.chat(options);
  
  // Handle both streaming and non-streaming responses
  if (Symbol.asyncIterator in response) {
    // Streaming response
    let lastResult: ChatResult | null = null;
    for await (const chunk of response) {
      lastResult = chunk;
    }
    return lastResult;
  } else {
    // Non-streaming response
    return response;
  }
}
