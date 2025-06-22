/**
 * QUANTUM CONVERSATION AGENT
 * Next-generation conversation agent powered by the revolutionary Quantum Planner
 * with HTN decomposition and Tree-of-Thoughts planning
 */

import { AgentContext, createAgentContext, appendMessages, updateState, updateMetrics, AgentOptions, ProviderGroup } from "./AgentContext.js";
import { QuantumPlanner, QuantumPlan } from "./QuantumPlanner.js";
import { Executor } from "./Executor.js";
import { Reflector } from "./Reflector.js";
import { ChatMessage, Provider } from "./Provider.js";
import { Tool } from "./Tool.js";
import { logger } from "./logger.js";

export interface QuantumAgentResult {
  readonly messages: ChatMessage[];
  readonly metrics: {
    readonly duration: number;
    readonly providerCalls: number;
    readonly toolExecutions: number;
    readonly costSavings: number;
    readonly efficiency: number; // ops per second
    readonly planningTime: number; // Time spent on quantum planning
    readonly adaptations: number; // Number of plan adaptations
  };
  readonly debug?: {
    readonly plan: QuantumPlan;
    readonly steps: number;
    readonly reflections: number;
    readonly adaptations: number;
    readonly alternativePaths: number;
    readonly providerHistory: { id: string; model?: string }[];
    readonly quantumMetrics: {
      readonly intentComplexity: string;
      readonly strategyType: string;
      readonly hypothesesGenerated: number;
      readonly confidenceScore: number;
    };
  };
}

export class QuantumConversationAgent {
  private readonly quantumPlanner = new QuantumPlanner();
  private readonly executor = new Executor();
  private readonly reflector = new Reflector();

  /**
   * Execute conversation with revolutionary Quantum Planning architecture
   * Features: HTN decomposition, Tree-of-Thoughts, self-healing, intent recognition
   */
  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool<any, any>>,
    providers: ProviderGroup,
    options?: Partial<AgentOptions>,
    providerModels?: Record<string, string>
  ): Promise<QuantumAgentResult> {
    const startTime = Date.now();
    let ctx = createAgentContext(messages, tools, providers, options, providerModels);
    
    // 🧠 QUANTUM PLANNING: Revolutionary intent recognition + HTN + Tree-of-Thoughts
    const planningStartTime = Date.now();
    let quantumPlan = await this.quantumPlanner.createQuantumPlan(ctx);
    const planningTime = Date.now() - planningStartTime;
    
    logger.debug(`🌟 Quantum Plan created: ${quantumPlan.steps.length} steps, strategy: ${quantumPlan.strategy.type}, confidence: ${quantumPlan.confidence}%`);
    logger.debug(`🎯 Intent: ${quantumPlan.intent.primary} (${quantumPlan.intent.complexity})`);
    logger.debug(`🌳 Alternative paths: ${quantumPlan.alternatives.length}`);

    let reflectionCount = 0;
    let stepCount = 0;
    let adaptationCount = 0;
    const providerHistory: { id: string; model?: string }[] = [];

    // Execute quantum plan with self-healing and Tree-of-Thoughts adaptation
    // QUANTUM INTELLIGENCE: Respect the planned steps, don't terminate on individual tool completion
    while (ctx.state.stepCount < ctx.options.maxSteps && quantumPlan.steps.length > 0) {
      stepCount++;
      const step = quantumPlan.steps[0];
      
      logger.debug(`⚡ Quantum Step ${stepCount}: ${step.type} - ${step.intent}`);
      
      // Execute step with quantum-enhanced context
      // UNIVERSAL FIX: For chat steps, use the original context, not step.intent
      const stepResult = await this.executor.execute({
        type: step.type,
        message: step.type === 'chat' ? undefined : { role: 'user', content: step.intent },
        expectedToolCalls: step.expectedTools,
        priority: step.priority
      }, ctx);
      
      // Debug: Log which provider was used
      if (stepResult.providerUsed) {
        logger.debug(
          `🔧 Quantum Step ${stepCount} executed by: ${stepResult.providerUsed.id}` +
            (stepResult.providerUsed.model ? ` (${stepResult.providerUsed.model})` : '')
        );
        providerHistory.push(stepResult.providerUsed);
      }
      
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

      // 🌳 TREE-OF-THOUGHTS ADAPTATION: Real-time plan revision
      if (stepResult.error || !stepResult.isComplete) {
        try {
          const adaptedPlan = await this.quantumPlanner.adaptQuantumPlan(quantumPlan, stepResult, ctx);
          
          if (adaptedPlan !== quantumPlan) {
            adaptationCount++;
            quantumPlan = adaptedPlan;
            logger.debug(`🔄 Quantum Plan adapted (${adaptationCount}): new strategy ${quantumPlan.strategy.type}`);
          }
        } catch (error) {
          logger.warn(`⚠️ Quantum adaptation failed: ${error}`);
        }
      }

      // 🔧 UNIVERSAL SEQUENTIAL TOOL EXECUTION FIX:
      // If the last message has tool calls but there are more planned steps,
      // ensure we execute tools one at a time by checking pending tool calls
      const lastMessage = ctx.messages[ctx.messages.length - 1];
      if (lastMessage?.tool_calls?.length && quantumPlan.steps.length > 0) {
        // Execute pending tool calls before continuing with next planned steps
        const toolResult = await this.executor.execute({
          type: 'tool_execution',
          priority: 'critical'
        }, ctx);
        
        if (toolResult.delta.length > 0) {
          ctx = appendMessages(ctx, toolResult.delta);
        }
        
        // Update metrics
        if (toolResult.metrics) {
          ctx = updateMetrics(ctx, toolResult.metrics);
        }
      }

      // Apply reflection if needed and enabled
      if (!stepResult.error && !stepResult.isComplete) {
        const reflection = await this.reflector.review(stepResult, ctx);
        
        if (reflection?.shouldRetry && reflection.correctedMessage) {
          reflectionCount++;
          logger.debug(`🔍 Quantum Reflection ${reflectionCount}: applying correction`);
          
          // Replace the last message with corrected version
          const messages = [...ctx.messages];
          messages[messages.length - 1] = reflection.correctedMessage;
          ctx = { ...ctx, messages };
        }
      }

      // Remove completed step
      quantumPlan = {
        ...quantumPlan,
        steps: quantumPlan.steps.slice(1)
      };

      // QUANTUM COMPLETION: Check if we should terminate based on step result
      // Only terminate if explicitly marked complete AND no more planned steps
      if (stepResult.isComplete && quantumPlan.steps.length === 0) {
        logger.debug("🎯 Quantum execution completed - all planned steps finished");
        break;
      }
      
      // Safety valve with quantum diagnostics
      if (stepResult.error && stepCount > 2) {
        logger.warn('Multiple failures detected, attempting final quantum recovery...');
        
        // Try one alternative path if available
        if (quantumPlan.alternatives.length > 0) {
          const bestAlternative = quantumPlan.alternatives.reduce((best, current) => 
            current.reliability > best.reliability ? current : best
          );
          
          logger.debug(`🌳 Switching to alternative path: ${bestAlternative.strategy.type}`);
          quantumPlan = {
            intent: quantumPlan.intent,
            strategy: bestAlternative.strategy,
            steps: bestAlternative.steps,
            alternatives: [],
            estimatedCost: bestAlternative.cost,
            confidence: quantumPlan.confidence * 0.8 // Reduce confidence after fallback
          };
          continue;
        }
        
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
        efficiency,
        planningTime,
        adaptations: adaptationCount
      },
      debug: {
        plan: quantumPlan,
        steps: stepCount,
        reflections: reflectionCount,
        adaptations: adaptationCount,
        alternativePaths: quantumPlan.alternatives.length,
        providerHistory,
        quantumMetrics: {
          intentComplexity: quantumPlan.intent.complexity,
          strategyType: quantumPlan.strategy.type,
          hypothesesGenerated: quantumPlan.alternatives.length + 1, // Primary + alternatives
          confidenceScore: quantumPlan.confidence
        }
      }
    };
  }
}