import { ChatMessage, Tool, Provider, ChatResult } from "./Provider.js";
import { config } from "../config/index.js";
import { logger } from "./logger.js";

// Provider health tracking for cost optimization
interface ProviderHealth {
  id: string;
  lastSuccess: number;
  lastFailure: number;
  consecutiveFailures: number;
  isHealthy: boolean;
}

// Session-scoped provider cache to reduce API waste
class ProviderCache {
  private healthMap = new Map<string, ProviderHealth>();
  private preferredProvider: ProviderConfig | null = null;
  private readonly maxConsecutiveFailures = 3;
  private readonly cooldownMs = 60000; // 1 minute cooldown for failed providers

  markSuccess(provider: ProviderConfig): void {
    const health = this.getOrCreateHealth(provider.p.id);
    health.lastSuccess = Date.now();
    health.consecutiveFailures = 0;
    health.isHealthy = true;
    this.preferredProvider = provider;
  }

  markFailure(provider: ProviderConfig): void {
    const health = this.getOrCreateHealth(provider.p.id);
    health.lastFailure = Date.now();
    health.consecutiveFailures++;
    health.isHealthy = health.consecutiveFailures < this.maxConsecutiveFailures;
    
    // Clear preferred provider if it's the one that failed
    if (this.preferredProvider?.p.id === provider.p.id) {
      this.preferredProvider = null;
    }
  }

  getPreferredProvider(): ProviderConfig | null {
    if (!this.preferredProvider) return null;
    
    const health = this.healthMap.get(this.preferredProvider.p.id);
    if (!health?.isHealthy) return null;
    
    return this.preferredProvider;
  }

  filterHealthyProviders(providers: ProviderConfig[]): ProviderConfig[] {
    const now = Date.now();
    return providers.filter(provider => {
      const health = this.healthMap.get(provider.p.id);
      if (!health) return true; // Unknown providers are considered healthy
      
      // Allow retry after cooldown period
      if (!health.isHealthy && (now - health.lastFailure) > this.cooldownMs) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
      }
      
      return health.isHealthy;
    });
  }

  private getOrCreateHealth(providerId: string): ProviderHealth {
    if (!this.healthMap.has(providerId)) {
      this.healthMap.set(providerId, {
        id: providerId,
        lastSuccess: 0,
        lastFailure: 0,
        consecutiveFailures: 0,
        isHealthy: true,
      });
    }
    return this.healthMap.get(providerId)!;
  }

  getHealthReport(): Record<string, ProviderHealth> {
    const report: Record<string, ProviderHealth> = {};
    for (const [id, health] of this.healthMap) {
      report[id] = { ...health };
    }
    return report;
  }
}

export interface ProviderConfig {
  p: Provider;
  model: string;
  priority: "primary" | "fallback";
  timeoutMs?: number;
  stream?: boolean;
}

// Enhanced JSON parsing with security improvements for free model compatibility
export function tryParseJson(text: string): any {
  // Input validation - prevent excessive processing
  if (!text || typeof text !== 'string') return null;
  if (text.length > 50000) { // Reasonable limit for tool calls
    logger.warn('JSON parsing skipped: input too large');
    return null;
  }

  // First try: Fenced code blocks (most reliable format)
  const fencedResult = tryParseFencedJson(text);
  if (fencedResult) return fencedResult;

  // Second try: Embedded JSON objects (for free models with inconsistent formatting)
  const embeddedResult = tryParseEmbeddedJson(text);
  if (embeddedResult) return embeddedResult;

  return null;
}

function tryParseFencedJson(text: string): any {
  // More precise regex that avoids catastrophic backtracking
  const fencedRegex = /```json\s*\n?([\s\S]*?)\n?\s*```/i;
  const match = text.match(fencedRegex);
  
  if (!match?.[1]) return null;
  
  try {
    const parsed = JSON.parse(match[1].trim());
    return validateToolCallStructure(parsed);
  } catch (error) {
    logger.debug('Failed to parse fenced JSON:', error);
    return null;
  }
}

function tryParseEmbeddedJson(text: string): any {
  // Safer approach: look for JSON-like patterns with size limits
  const maxJsonSize = 5000; // Reasonable limit for tool arguments
  
  for (let i = 0; i < text.length - 1; i++) {
    if (text[i] === '{') {
      const result = extractJsonObject(text, i, maxJsonSize);
      if (result) {
        const validated = validateToolCallStructure(result);
        if (validated) return validated;
      }
    }
  }
  
  return null;
}

function extractJsonObject(text: string, startIndex: number, maxSize: number): any {
  let depth = 0;
  let inString = false;
  let escaped = false;
  
  for (let i = startIndex; i < text.length && (i - startIndex) < maxSize; i++) {
    const char = text[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      continue;
    }
    
    if (char === '"' && !escaped) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        const jsonCandidate = text.slice(startIndex, i + 1);
        try {
          return JSON.parse(jsonCandidate);
        } catch {
          return null; // Invalid JSON structure
        }
      }
    }
  }
  
  return null; // No complete JSON object found
}

// Validate that parsed JSON has the expected tool call structure
function validateToolCallStructure(parsed: any): any {
  if (!parsed || typeof parsed !== 'object') return null;
  
  // Basic tool call structure validation
  if (typeof parsed.name === 'string' && parsed.name.length > 0 && parsed.name.length < 100) {
    // Ensure arguments is present and reasonable
    if (parsed.arguments !== undefined) {
      // Prevent deeply nested objects that could cause issues
      if (getObjectDepth(parsed.arguments) > 10) {
        logger.warn('Tool call arguments too deeply nested, rejecting');
        return null;
      }
      return parsed;
    }
  }
  
  return null;
}

function getObjectDepth(obj: any, currentDepth = 0): number {
  if (currentDepth > 10) return currentDepth; // Prevent excessive recursion
  if (!obj || typeof obj !== 'object') return currentDepth;
  
  let maxDepth = currentDepth;
  for (const value of Object.values(obj)) {
    if (typeof value === 'object' && value !== null) {
      maxDepth = Math.max(maxDepth, getObjectDepth(value, currentDepth + 1));
    }
  }
  return maxDepth;
}

// Enhanced argument processing with type safety for free model compatibility
function processToolArguments(args: any, toolName: string): any {
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return validateAndSanitizeArgs(parsed, toolName);
    } catch (error) {
      logger.warn(`Failed to parse tool arguments for ${toolName}:`, error);
      throw new Error(`Invalid JSON in tool arguments for ${toolName}`);
    }
  }
  
  return validateAndSanitizeArgs(args, toolName);
}

function validateAndSanitizeArgs(args: any, toolName: string): any {
  if (!args || typeof args !== 'object') {
    return args;
  }
  
  // Prevent excessively large argument objects
  const argString = JSON.stringify(args);
  if (argString.length > 10000) {
    logger.warn(`Tool arguments too large for ${toolName}: ${argString.length} chars`);
    throw new Error(`Tool arguments too large for ${toolName}`);
  }
  
  // Prevent deeply nested objects
  const depth = getObjectDepth(args);
  if (depth > 5) {
    logger.warn(`Tool arguments too deeply nested for ${toolName}: depth ${depth}`);
    throw new Error(`Tool arguments too deeply nested for ${toolName}`);
  }
  
  logger.debug(`Validated tool arguments for ${toolName}:`, args);
  return args;
}

export interface AgentOptions {
  maxSteps?: number;
  timeoutMs?: number;
  providerCache?: ProviderCache;
  maxHistoryLength?: number; // Conversation pruning - keep last N messages
  preserveSystemMessages?: boolean; // Keep system messages during pruning
}

export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  maxSteps?: number,
  timeoutMs?: number,
  providerCache?: ProviderCache,
): Promise<ChatMessage[]>;
export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  options?: AgentOptions,
): Promise<ChatMessage[]>;
export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  maxStepsOrOptions: number | AgentOptions = 8,
  timeoutMs?: number,
  providerCache?: ProviderCache,
): Promise<ChatMessage[]> {
  // Handle both old and new function signatures for backward compatibility
  let options: AgentOptions;
  if (typeof maxStepsOrOptions === 'number') {
    options = {
      maxSteps: maxStepsOrOptions,
      timeoutMs,
      providerCache,
      maxHistoryLength: 50, // Default: keep last 50 messages
      preserveSystemMessages: true,
    };
  } else {
    options = {
      maxSteps: 8,
      maxHistoryLength: 50,
      preserveSystemMessages: true,
      ...maxStepsOrOptions,
    };
  }

  const conversationHistory = [...messages];
  let stepCount = 0;
  const cache = options.providerCache || new ProviderCache();
  let selectedProvider: ProviderConfig | null = cache.getPreferredProvider();

  while (stepCount < (options.maxSteps || 8)) {
    stepCount++;
    
    // Prune conversation history if it's getting too long (memory management)
    if (options.maxHistoryLength && conversationHistory.length > options.maxHistoryLength) {
      const prunedHistory = pruneConversationHistory(
        conversationHistory,
        options.maxHistoryLength,
        options.preserveSystemMessages,
      );
      conversationHistory.splice(0, conversationHistory.length, ...prunedHistory);
    }
    
    // Find a working provider only if we don't have one
    if (!selectedProvider) {
      selectedProvider = await findWorkingProvider(conversationHistory, tools, providers, options.timeoutMs, cache);
      if (!selectedProvider) {
        throw new Error("All providers failed to respond. Health report: " + JSON.stringify(cache.getHealthReport()));
      }
    }

    // Use the selected provider for this conversation turn
    let result: ChatResult | null = null;
    try {
      result = await callProvider(selectedProvider, conversationHistory, tools, { timeoutMs: options.timeoutMs });
      // Mark success to optimize future calls
      cache.markSuccess(selectedProvider);
    } catch (error) {
      logger.warn(`Provider ${selectedProvider.p.id} failed mid-conversation:`, error);
      cache.markFailure(selectedProvider);
      selectedProvider = null; // Reset to try other providers
      continue;
    }
    
    if (!result) {
      selectedProvider = null; // Reset to try other providers
      continue;
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
            const processedArgs = processToolArguments(args, name);
            const toolResult = await tools[name].execute(processedArgs);
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
      // Check for text-based tool calls (important for free models with inconsistent formatting)
      const parsedJson = tryParseJson(assistantMessage.content);
      if (parsedJson && parsedJson.name && parsedJson.arguments) {
        const { name, arguments: args } = parsedJson;
        if (tools[name]) {
          const toolCallId = `call_${name}_${Date.now()}`;
          try {
            logger.debug(`🔧 Executing tool from text: ${name} with args:`, args);
            // Enhanced argument processing with validation
            const processedArgs = processToolArguments(args, name);
            const toolResult = await tools[name].execute(processedArgs);
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

// Smart conversation pruning to manage memory while preserving context
function pruneConversationHistory(
  history: ChatMessage[],
  maxLength: number,
  preserveSystemMessages = true,
): ChatMessage[] {
  if (history.length <= maxLength) {
    return history;
  }

  logger.debug(`Pruning conversation history from ${history.length} to ${maxLength} messages`);
  
  const systemMessages = preserveSystemMessages ? history.filter(msg => msg.role === 'system') : [];
  const nonSystemMessages = history.filter(msg => msg.role !== 'system');
  
  // Calculate how many non-system messages we can keep
  const availableSlots = maxLength - systemMessages.length;
  
  if (availableSlots <= 0) {
    logger.warn('Too many system messages for maxHistoryLength, keeping only system messages');
    return systemMessages.slice(-maxLength);
  }
  
  // Keep the most recent non-system messages
  const recentMessages = nonSystemMessages.slice(-availableSlots);
  
  // Combine system messages (at the beginning) with recent messages
  const prunedHistory = [...systemMessages, ...recentMessages];
  
  logger.debug(`Pruned history: ${systemMessages.length} system + ${recentMessages.length} recent = ${prunedHistory.length} total`);
  return prunedHistory;
}

// Export ProviderCache for advanced users who want to manage caching across multiple conversations
export { ProviderCache };

async function findWorkingProvider(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  timeoutMs?: number,
  cache?: ProviderCache,
): Promise<ProviderConfig | null> {
  // Filter to only healthy providers to avoid wasting API calls on known failures
  const healthyProviders = cache ? cache.filterHealthyProviders(providers) : providers;
  
  if (healthyProviders.length === 0) {
    logger.warn('No healthy providers available, trying all providers as fallback');
  }
  
  const providerConfigs = (healthyProviders.length > 0 ? healthyProviders : providers)
    .slice()
    .sort((a, b) => {
      if (a.priority === b.priority) return 0;
      return a.priority === 'primary' ? -1 : 1;
    });

  for (const providerConfig of providerConfigs) {
    try {
      const priority = providerConfig.priority === 'primary' ? 'primary' : 'fallback';
      const costInfo = priority === 'primary' ? '(free)' : '(paid)';
      logger.info(`🔄 Trying ${priority} provider: ${providerConfig.p.id} ${costInfo}`);
      
      const result = await callProvider(providerConfig, messages, tools, { timeoutMs });
      
      if (result && result.messages && result.messages.length > 0) {
        logger.info(`✅ Selected provider: ${providerConfig.p.id} ${costInfo}`);
        if (cache) {
          cache.markSuccess(providerConfig);
        }
        return providerConfig;
      }
    } catch (error) {
      logger.warn(`Provider ${providerConfig.p.id} failed:`, error);
      if (cache) {
        cache.markFailure(providerConfig);
      }
    }
  }

  return null;
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
