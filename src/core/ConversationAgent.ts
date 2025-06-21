/**
 * CEATA Pipeline Agent
 * Conversation agent with concurrent provider execution and intelligent planning
 */

import { AgentContext, createAgentContext, appendMessages, updateState, updateMetrics, AgentOptions, ProviderGroup } from "./AgentContext.js";

// Re-export for external use
export type { ProviderGroup };
import { Planner, Plan } from "./Planner.js";
import { Executor } from "./Executor.js";
import { Reflector } from "./Reflector.js";
import { ChatMessage, Provider } from "./Provider.js";
import { Tool } from "./Tool.js";
import { logger } from "./logger.js";

export interface AgentResult {
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

export class ConversationAgent {
  private readonly planner = new Planner();
  private readonly executor = new Executor();
  private readonly reflector = new Reflector();

  /**
   * Execute conversation with pipeline architecture for optimized performance
   */
  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool<any, any>>,
    providers: ProviderGroup,
    options?: Partial<AgentOptions>,
    providerModels?: Record<string, string>
  ): Promise<AgentResult> {
    const startTime = Date.now();
    let ctx = createAgentContext(messages, tools, providers, options, providerModels);
    
    // Create execution plan
    let plan = this.planner.plan(ctx);
    logger.debug(`🎯 Plan created: ${plan.steps.length} steps, strategy: ${plan.strategy}`);
    
    let reflectionCount = 0;
    let stepCount = 0;

    // Execute plan with pipeline efficiency
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