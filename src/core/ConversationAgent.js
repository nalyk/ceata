/**
 * CEATA Pipeline Agent
 * Conversation agent with concurrent provider execution and intelligent planning
 */
import { createAgentContext, appendMessages, updateState, updateMetrics } from "./AgentContext.js";
import { Planner } from "./Planner.js";
import { Executor } from "./Executor.js";
import { Reflector } from "./Reflector.js";
import { logger } from "./logger.js";
export class ConversationAgent {
    constructor() {
        this.planner = new Planner();
        this.executor = new Executor();
        this.reflector = new Reflector();
    }
    /**
     * Execute conversation with pipeline architecture for optimized performance
     */
    async run(messages, tools, providers, options, providerModels) {
        const startTime = Date.now();
        let ctx = createAgentContext(messages, tools, providers, options, providerModels);
        // Create execution plan
        let plan = this.planner.plan(ctx);
        logger.debug(`🎯 Plan created: ${plan.steps.length} steps, strategy: ${plan.strategy}`);
        let reflectionCount = 0;
        let stepCount = 0;
        const providerHistory = [];
        // Execute plan with pipeline efficiency
        while (ctx.state.stepCount < ctx.options.maxSteps && !ctx.state.isComplete && plan.steps.length > 0) {
            stepCount++;
            const step = plan.steps[0];
            logger.debug(`⚡ Executing step ${stepCount}: ${step.type}`);
            // Execute step
            const stepResult = await this.executor.execute(step, ctx);
            // Debug: Log which provider was used
            if (stepResult.providerUsed) {
                logger.debug(`🔧 Step ${stepCount} executed by: ${stepResult.providerUsed.id}` +
                    (stepResult.providerUsed.model ? ` (${stepResult.providerUsed.model})` : ''));
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
                reflections: reflectionCount,
                providerHistory
            }
        };
    }
}
