/**
 * CEATA MONSTER EFFICIENCY - MonsterAgent
 * The most efficient agentic framework in existence
 */

import { AgentContext, createAgentContext, appendMessages, updateState, updateMetrics, AgentOptions, ProviderGroup } from "./AgentContext.js";
import { Planner, Plan } from "./Planner.js";
import { Executor } from "./Executor.js";
import { Reflector } from "./Reflector.js";
import { ChatMessage, Provider } from "./Provider.js";
import { Tool } from "./Tool.js";
import { logger } from "./logger.js";

export interface MonsterResult {
  readonly messages: ChatMessage[];
  readonly metrics: {
    readonly duration: number;
    readonly providerCalls: number;
    readonly toolExecutions: number;
    readonly costSavings: number;
    readonly efficiency: number; // ops per second
  };
  readonly debug?: {
    readonly plan: Plan;
    readonly steps: number;
    readonly reflections: number;
  };
}

export class MonsterAgent {
  private readonly planner = new Planner();
  private readonly executor = new Executor();
  private readonly reflector = new Reflector();

  /**
   * MONSTER EFFICIENCY - Run agent with MAXIMUM performance
   */
  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool<any, any>>,
    providers: ProviderGroup,
    options?: Partial<AgentOptions>
  ): Promise<MonsterResult> {
    const startTime = Date.now();
    let ctx = createAgentContext(messages, tools, providers, options);
    
    // Create execution plan
    let plan = this.planner.plan(ctx);
    logger.debug(`🎯 Plan created: ${plan.steps.length} steps, strategy: ${plan.strategy}`);
    
    let reflectionCount = 0;
    let stepCount = 0;

    // Execute plan with MONSTER efficiency
    while (ctx.state.stepCount < ctx.options.maxSteps && !ctx.state.isComplete && plan.steps.length > 0) {
      stepCount++;
      const step = plan.steps[0];
      
      logger.debug(`⚡ Executing step ${stepCount}: ${step.type}`);
      
      // Execute step
      const stepResult = await this.executor.execute(step, ctx);
      
      // Update context with results
      if (stepResult.delta.length > 0) {
        ctx = appendMessages(ctx, stepResult.delta);
      }
      
      // Update metrics
      if (stepResult.metrics) {
        ctx = updateMetrics(ctx, stepResult.metrics);
      }
      
      // Update state
      ctx = updateState(ctx, {
        stepCount: ctx.state.stepCount + 1,
        isComplete: stepResult.isComplete,
        lastError: stepResult.error
      });

      // Apply reflection if needed and enabled
      if (!stepResult.error && !stepResult.isComplete) {
        const reflection = await this.reflector.review(stepResult, ctx);
        
        if (reflection?.shouldRetry && reflection.correctedMessage) {
          reflectionCount++;
          logger.debug(`🔍 Reflection ${reflectionCount}: applying correction`);
          
          // Replace the last message with corrected version
          const messages = [...ctx.messages];
          messages[messages.length - 1] = reflection.correctedMessage;
          ctx = { ...ctx, messages };
        }
      }

      // Adapt plan based on results
      plan = this.planner.adaptPlan(plan, stepResult, ctx);
      
      // Safety valve
      if (stepResult.error && stepCount > 2) {
        logger.warn('Multiple failures detected, stopping execution');
        break;
      }
    }

    const duration = Date.now() - startTime;
    const efficiency = stepCount / (duration / 1000); // steps per second

    return {
      messages: ctx.messages,
      metrics: {
        duration,
        providerCalls: ctx.state.metrics.providerCalls,
        toolExecutions: ctx.state.metrics.toolExecutions,
        costSavings: ctx.state.metrics.costSavings,
        efficiency
      },
      debug: {
        plan,
        steps: stepCount,
        reflections: reflectionCount
      }
    };
  }
}

/**
 * CLEAN API - Backwards compatible interface
 */
export async function runMonsterAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: Provider[] | ProviderGroup,
  options?: Partial<AgentOptions>
): Promise<ChatMessage[]> {
  // Convert legacy provider array to ProviderGroup
  const providerGroup: ProviderGroup = Array.isArray(providers)
    ? {
        primary: providers.filter(p => p.id.includes('free') || p.id === 'google'),
        fallback: providers.filter(p => !p.id.includes('free') && p.id !== 'google')
      }
    : providers;

  const agent = new MonsterAgent();
  const result = await agent.run(messages, tools, providerGroup, options);
  
  // Log performance metrics
  logger.info(`🚀 MONSTER execution: ${result.metrics.duration}ms, ${result.metrics.efficiency.toFixed(2)} ops/sec, $${result.metrics.costSavings.toFixed(4)} saved`);
  
  return result.messages;
}

/**
 * BACKWARDS COMPATIBILITY - Legacy runAgent interface
 */
export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: any[],
  maxStepsOrOptions?: number | Partial<AgentOptions>,
  timeoutMs?: number,
  providerCache?: any
): Promise<ChatMessage[]> {
  logger.warn('🦕 Using legacy runAgent - consider upgrading to runMonsterAgent for MAXIMUM performance');
  
  let options: Partial<AgentOptions>;
  
  if (typeof maxStepsOrOptions === 'number') {
    options = {
      maxSteps: maxStepsOrOptions,
      timeoutMs: timeoutMs || 30000
    };
  } else {
    options = maxStepsOrOptions || {};
  }

  // Convert legacy provider format
  const providerGroup: ProviderGroup = {
    primary: providers.filter((p: any) => p.priority === 'primary').map((p: any) => p.p),
    fallback: providers.filter((p: any) => p.priority === 'fallback').map((p: any) => p.p)
  };

  return await runMonsterAgent(messages, tools, providerGroup, options);
}