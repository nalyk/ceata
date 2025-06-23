/**
 * CEATA Agent Context
 * State management for high-performance agentic workflows
 */
/**
 * Creates a new agent context with optimized defaults
 */
export function createAgentContext(messages, tools, providers, options, providerModels) {
    const defaultOptions = {
        maxSteps: 8,
        timeoutMs: 30000,
        maxHistoryLength: 50,
        preserveSystemMessages: true,
        enableRacing: true,
        providerStrategy: 'smart',
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
        providerModels,
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
export function appendMessages(ctx, delta) {
    if (delta.length === 0)
        return ctx;
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
function pruneMessages(messages, maxLength, preserveSystem) {
    if (messages.length <= maxLength)
        return messages;
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
export function updateState(ctx, updates) {
    return {
        ...ctx,
        state: { ...ctx.state, ...updates },
    };
}
/**
 * Updates performance metrics efficiently
 */
export function updateMetrics(ctx, updates) {
    return {
        ...ctx,
        state: {
            ...ctx.state,
            metrics: { ...ctx.state.metrics, ...updates },
        },
    };
}
