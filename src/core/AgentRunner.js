/**
 * CEATA Unified Agent Interface
 * Single clean interface powered by pipeline architecture
 */
import { ConversationAgent } from "./ConversationAgent.js";
import { logger } from "./logger.js";
// Provider health tracking for legacy compatibility
export class ProviderCache {
    constructor() {
        this.healthMap = new Map();
    }
    markSuccess(provider) {
        // Legacy compatibility - no-op in pipeline architecture
    }
    markFailure(provider) {
        // Legacy compatibility - no-op in pipeline architecture
    }
    getPreferredProvider() {
        // Legacy compatibility - returns null
        return null;
    }
    filterHealthyProviders(providers) {
        // Legacy compatibility - returns all
        return providers;
    }
    getHealthReport() {
        return {};
    }
}
export async function runAgent(messages, tools, providers, maxStepsOrOptions = 8, timeoutMs, providerCache) {
    // Convert legacy parameters to pipeline options
    let options;
    if (typeof maxStepsOrOptions === 'number') {
        options = {
            maxSteps: maxStepsOrOptions,
            timeoutMs,
            maxHistoryLength: 50,
            preserveSystemMessages: true,
            enableRacing: true, // Enable concurrent execution by default
        };
    }
    else {
        options = {
            maxSteps: 8,
            maxHistoryLength: 50,
            preserveSystemMessages: true,
            enableRacing: true, // Enable concurrent execution by default
            ...maxStepsOrOptions,
        };
    }
    // Convert legacy ProviderConfig[] to ProviderGroup for pipeline
    let primary = providers
        .filter(pc => pc.priority === "primary")
        .map(pc => pc.p);
    let fallback = providers
        .filter(pc => pc.priority === "fallback")
        .map(pc => pc.p);
    // Create provider models mapping
    const providerModels = {};
    providers.forEach(pc => {
        providerModels[pc.p.id] = pc.model;
    });
    // If no explicit primary/fallback, use smart defaults
    if (primary.length === 0 && fallback.length === 0) {
        primary = providers
            .filter(pc => pc.p.id.includes('free') || pc.p.id === 'google')
            .map(pc => pc.p);
        fallback = providers
            .filter(pc => !pc.p.id.includes('free') && pc.p.id !== 'google')
            .map(pc => pc.p);
        // If still empty, put all in primary
        if (primary.length === 0) {
            primary = providers.map(pc => pc.p);
        }
    }
    const providerGroup = { primary, fallback };
    // Execute with pipeline architecture
    const agent = new ConversationAgent();
    const result = await agent.run(messages, tools, providerGroup, options, providerModels);
    // Log performance metrics (legacy format for compatibility)
    logger.info(`🔄 Pipeline execution: ${result.metrics.duration}ms, ${result.metrics.efficiency.toFixed(2)} ops/sec, $${result.metrics.costSavings.toFixed(4)} saved`);
    return result.messages;
}
/**
 * Legacy utility function for parsing JSON from LLM responses
 * Kept for backwards compatibility with existing tests
 */
export function tryParseJson(text) {
    try {
        // Try to parse as direct JSON first
        return JSON.parse(text);
    }
    catch {
        // Check for TOOL_CALL format first (for vanilla tool calling)
        const toolCallMatch = text.match(/TOOL_CALL:\s*\{/);
        if (toolCallMatch) {
            try {
                const startIndex = toolCallMatch.index + toolCallMatch[0].length - 1; // Include the opening brace
                let braceCount = 0;
                let jsonStr = '';
                for (let i = startIndex; i < text.length; i++) {
                    const char = text[i];
                    jsonStr += char;
                    if (char === '{') {
                        braceCount++;
                    }
                    else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            break;
                        }
                    }
                }
                return JSON.parse(jsonStr);
            }
            catch {
                return null;
            }
        }
        // Look for fenced JSON blocks
        const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            }
            catch {
                // Fall back to basic extraction
                const cleanText = jsonMatch[1].trim()
                    .replace(/^[^{[]*/, '') // Remove leading non-JSON
                    .replace(/[^}\]]*$/, ''); // Remove trailing non-JSON
                try {
                    return JSON.parse(cleanText);
                }
                catch {
                    return null;
                }
            }
        }
        // Try to extract JSON from unfenced text
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
            try {
                return JSON.parse(braceMatch[0]);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
