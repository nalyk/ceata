/**
 * CEATA MONSTER EFFICIENCY - Agent Context
 * Zero-allocation state management for high-performance agentic workflows
 */

import { ChatMessage, Provider, ToolCall } from "./Provider.js";
import { Tool } from "./Tool.js";

export interface AgentContext {
  readonly messages: ChatMessage[];
  readonly tools: Record<string, Tool<any, any>>;
  readonly providers: ProviderGroup;
  readonly options: AgentOptions;
  readonly state: ConversationState;
}

export interface ProviderGroup {
  readonly primary: Provider[];
  readonly fallback: Provider[];
}

export interface AgentOptions {
  readonly maxSteps: number;
  readonly timeoutMs: number;
  readonly maxHistoryLength: number;
  readonly preserveSystemMessages: boolean;
  readonly enableRacing: boolean;
  readonly retryConfig: RetryConfig;
}

export interface RetryConfig {
  readonly maxRetries: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter: boolean;
}

export interface ConversationState {
  stepCount: number;
  isComplete: boolean;
  lastError?: Error;
  metrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  readonly startTime: number;
  providerCalls: number;
  toolExecutions: number;
  totalTokens: number;
  costSavings: number; // Estimated based on free vs paid model usage
}

export interface StepResult {
  readonly delta: ChatMessage[];
  readonly isComplete: boolean;
  readonly metrics: Partial<PerformanceMetrics>;
  readonly error?: Error;
}

/**
 * Creates a new agent context with optimized defaults
 */
export function createAgentContext(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderGroup,
  options?: Partial<AgentOptions>
): AgentContext {
  const defaultOptions: AgentOptions = {
    maxSteps: 8,
    timeoutMs: 30000,
    maxHistoryLength: 50,
    preserveSystemMessages: true,
    enableRacing: true,
    retryConfig: {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      jitter: true,
    },
  };

  return {
    messages: [...messages],
    tools,
    providers,
    options: { ...defaultOptions, ...options },
    state: {
      stepCount: 0,
      isComplete: false,
      metrics: {
        startTime: Date.now(),
        providerCalls: 0,
        toolExecutions: 0,
        totalTokens: 0,
        costSavings: 0,
      },
    },
  };
}

/**
 * Appends delta messages to context - ZERO ALLOCATION when possible
 */
export function appendMessages(ctx: AgentContext, delta: ChatMessage[]): AgentContext {
  if (delta.length === 0) return ctx;
  
  const newMessages = [...ctx.messages, ...delta];
  
  // Apply memory management if needed
  const finalMessages = ctx.options.maxHistoryLength > 0 && newMessages.length > ctx.options.maxHistoryLength
    ? pruneMessages(newMessages, ctx.options.maxHistoryLength, ctx.options.preserveSystemMessages)
    : newMessages;

  return {
    ...ctx,
    messages: finalMessages,
  };
}

/**
 * Ultra-fast message pruning - keeps system messages + recent messages
 */
function pruneMessages(
  messages: ChatMessage[],
  maxLength: number,
  preserveSystem: boolean
): ChatMessage[] {
  if (messages.length <= maxLength) return messages;
  
  if (!preserveSystem) {
    return messages.slice(-maxLength);
  }
  
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');
  
  const availableSlots = maxLength - systemMessages.length;
  if (availableSlots <= 0) {
    return systemMessages.slice(-maxLength);
  }
  
  return [...systemMessages, ...nonSystemMessages.slice(-availableSlots)];
}

/**
 * Updates context state immutably
 */
export function updateState(ctx: AgentContext, updates: Partial<ConversationState>): AgentContext {
  return {
    ...ctx,
    state: { ...ctx.state, ...updates },
  };
}

/**
 * Updates performance metrics efficiently
 */
export function updateMetrics(ctx: AgentContext, updates: Partial<PerformanceMetrics>): AgentContext {
  return {
    ...ctx,
    state: {
      ...ctx.state,
      metrics: { ...ctx.state.metrics, ...updates },
    },
  };
}