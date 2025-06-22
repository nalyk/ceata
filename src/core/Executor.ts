/**
 * CEATA Executor
 * Execution engine with provider racing and streaming
 */

import { AgentContext, StepResult, updateMetrics } from "./AgentContext.js";
import { PlanStep } from "./Planner.js";
import { ChatMessage, ChatResult, Provider } from "./Provider.js";
import { logger } from "./logger.js";

export class Executor {
  /**
   * Executes a plan step efficiently
   */
  async execute(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    const startTime = Date.now();
    
    try {
      switch (step.type) {
        case 'chat':
          return await this.executeChat(step, ctx);
        case 'tool_execution':
          return await this.executeToolCalls(ctx);
        case 'completion':
          return this.executeCompletion();
        case 'planning':
          // Planning step - treat as a chat step with planning context
          return await this.executePlanning(step, ctx);
        case 'reflection':
          // Reflection step - treat as a chat step with reflection context
          return await this.executeReflection(step, ctx);
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error) {
      logger.error(`Execution failed for step ${step.type}:`, error);
      return {
        delta: [],
        isComplete: false,
        metrics: { providerCalls: 1 },
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Executes chat with intelligent provider selection
   */
  private async executeChat(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    const messages = ctx.messages;
    
    // Smart strategy: Sequential for free APIs to preserve quotas, racing for paid APIs for speed
    if (ctx.options.providerStrategy === 'smart') {
      return await this.smartProviderExecution(messages, ctx);
    } else if (ctx.options.providerStrategy === 'racing' && ctx.options.enableRacing && ctx.providers.primary.length > 1) {
      return await this.raceProviders(ctx.providers.primary, messages, ctx);
    } else {
      // Sequential execution
      return await this.tryProvidersSequential([...ctx.providers.primary, ...ctx.providers.fallback], messages, ctx);
    }
  }

  /**
   * Smart provider execution: Sequential for free APIs, racing for paid when appropriate
   */
  private async smartProviderExecution(messages: ChatMessage[], ctx: AgentContext): Promise<StepResult> {
    // Primary providers: Try sequentially to preserve free quotas
    if (ctx.providers.primary.length > 0) {
      logger.info(`🧠 Smart strategy: Trying ${ctx.providers.primary.length} primary providers sequentially`);
      
      for (const provider of ctx.providers.primary) {
        try {
          logger.info(`⚡ Trying primary provider: ${provider.id}`);
          const result = await this.callProvider(provider, messages, ctx);
          logger.info(`✅ Primary provider ${provider.id} succeeded`);
          return this.processProviderResult(result, ctx, provider.id);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.warn(`❌ Primary provider ${provider.id} failed: ${errorMsg}`);
          // Continue to next primary provider
        }
      }
      
      logger.warn('All primary providers failed, trying fallback providers');
    }
    
    // Fallback providers: Try sequentially as well
    return await this.tryProvidersSequential(ctx.providers.fallback, messages, ctx);
  }

  /**
   * Provider racing - Promise.any() for performance
   */
  private async raceProviders(providers: Provider[], messages: ChatMessage[], ctx: AgentContext): Promise<StepResult> {
    const startTime = Date.now();
    
    try {
      // Create racing promises
      const racePromises = providers.map(async provider => {
        const result = await this.callProvider(provider, messages, ctx);
        return { provider, result };
      });

      // Race the primary providers
      const winner = await Promise.any(racePromises);
      
      const latency = Date.now() - startTime;
      logger.info(`🏁 Provider race won by ${winner.provider.id} in ${latency}ms`);
      
      return this.processProviderResult(winner.result, ctx, winner.provider.id);
      
    } catch (error) {
      logger.warn('All primary providers failed in race, falling back to sequential');
      return await this.tryProvidersSequential(ctx.providers.fallback, messages, ctx);
    }
  }

  /**
   * Sequential provider fallback with circuit breaker
   */
  private async tryProvidersSequential(providers: Provider[], messages: ChatMessage[], ctx: AgentContext): Promise<StepResult> {
    let lastError: Error | undefined;
    
    for (const provider of providers) {
      try {
        const result = await this.callProvider(provider, messages, ctx);
        return this.processProviderResult(result, ctx, provider.id);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Provider ${provider.id} failed:`, lastError.message);
        
        // Add retry delay with jitter if configured
        if (ctx.options.retryConfig.jitter) {
          const delay = ctx.options.retryConfig.baseDelayMs + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError || new Error('All providers failed');
  }

  /**
   * Calls a single provider with timeout and error handling
   */
  private async callProvider(provider: Provider, messages: ChatMessage[], ctx: AgentContext): Promise<ChatResult> {
    const tools = provider.supportsTools ? ctx.tools : undefined;
    const model = ctx.providerModels?.[provider.id] || 'auto'; // Use configured model or fallback
    
    const chatPromise = provider.chat({
      model,
      messages,
      tools,
      timeoutMs: ctx.options.timeoutMs
    });

    // Handle both streaming and non-streaming responses efficiently
    if (Symbol.asyncIterator in chatPromise) {
      // Streaming response - get the last result
      let lastResult: ChatResult | null = null;
      for await (const chunk of chatPromise) {
        lastResult = chunk;
      }
      if (!lastResult) {
        throw new Error(`No result from streaming provider ${provider.id}`);
      }
      return lastResult;
    } else {
      return await chatPromise;
    }
  }

  /**
   * Processes provider result into standardized format
   */
  private processProviderResult(
    result: ChatResult,
    ctx: AgentContext,
    providerId: string
  ): StepResult {
    const assistantMessage = result.messages[result.messages.length - 1];
    
    if (!assistantMessage) {
      throw new Error('No assistant message in provider result');
    }

    // Check if we have tool calls to execute
    const hasPendingToolCalls = result.finishReason === 'tool_call' && assistantMessage.tool_calls?.length;
    
    const metrics = {
      providerCalls: 1,
      totalTokens: result.usage?.total || 0,
      costSavings: this.calculateCostSavings(providerId, result.usage?.total || 0)
    };

    return {
      delta: [assistantMessage],
      isComplete: !hasPendingToolCalls && result.finishReason === 'stop',
      metrics,
      providerUsed: {
        id: providerId,
        model: ctx.providerModels?.[providerId]
      }
    };
  }

  /**
   * Executes pending tool calls with parallel processing when possible
   */
  private async executeToolCalls(ctx: AgentContext): Promise<StepResult> {
    const lastMessage = ctx.messages[ctx.messages.length - 1];
    
    if (!lastMessage?.tool_calls?.length) {
      return { delta: [], isComplete: true, metrics: {} };
    }

    const toolResults: ChatMessage[] = [];
    let totalExecutions = 0;

    // Execute tool calls - can be parallelized for independent tools
    const toolPromises = lastMessage.tool_calls.map(async (toolCall) => {
      const { name, arguments: args } = toolCall.function;
      const tool = ctx.tools[name];
      
      if (!tool) {
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          name,
          content: `Error: Tool '${name}' not found`
        };
      }

      try {
        const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
        const result = await tool.execute(parsedArgs);
        totalExecutions++;
        
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          name,
          content: JSON.stringify(result)
        };
      } catch (error) {
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          name,
          content: `Error: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    });

    const results = await Promise.all(toolPromises);
    toolResults.push(...results);

    return {
      delta: toolResults,
      isComplete: false, // Need another chat turn to process tool results
      metrics: {
        toolExecutions: totalExecutions
      },
      providerUsed: {
        id: 'tool-executor',
        model: 'local'
      }
    };
  }

  /**
   * Handles completion step
   */
  private executeCompletion(): StepResult {
    return {
      delta: [],
      isComplete: true,
      metrics: {}
    };
  }

  /**
   * Handles planning step - quantum planner execution
   */
  private async executePlanning(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    logger.debug('🔧 Executing planning step');
    
    // For planning steps, we create a planning-focused message
    const planningMessage: ChatMessage = {
      role: 'user',
      content: step.message?.content || 'Create an execution plan for the given task.'
    };
    
    const messages = [...ctx.messages, planningMessage];
    
    try {
      return await this.smartProviderExecution(messages, ctx);
    } catch (error) {
      logger.warn(`Planning step failed: ${error}`);
      return {
        delta: [],
        isComplete: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {}
      };
    }
  }

  /**
   * Handles reflection step - quantum reflection and verification
   */
  private async executeReflection(step: PlanStep, ctx: AgentContext): Promise<StepResult> {
    logger.debug('🔧 Executing reflection step');
    
    // For reflection steps, we create a reflection-focused message
    const reflectionMessage: ChatMessage = {
      role: 'user',
      content: step.message?.content || 'Reflect on the previous results and verify correctness.'
    };
    
    const messages = [...ctx.messages, reflectionMessage];
    
    try {
      return await this.smartProviderExecution(messages, ctx);
    } catch (error) {
      logger.warn(`Reflection step failed: ${error}`);
      return {
        delta: [],
        isComplete: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: {}
      };
    }
  }

  /**
   * Calculates cost savings based on provider type
   */
  private calculateCostSavings(providerId: string, tokens: number): number {
    // Rough cost calculation - free providers save ~$0.01 per 1K tokens
    const isFreeTier = providerId.includes('free') || providerId === 'google';
    return isFreeTier ? (tokens / 1000) * 0.01 : 0;
  }
}