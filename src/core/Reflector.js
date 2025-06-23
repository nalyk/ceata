/**
 * CEATA Reflector
 * Quality assurance and self-correction engine
 */
import { logger } from "./logger.js";
export class Reflector {
    /**
     * Reviews execution results and suggests corrections
     */
    async review(stepResult, ctx) {
        // Skip reflection for tool executions - they're deterministic
        if (stepResult.delta.length === 0 || stepResult.error) {
            return null;
        }
        const lastMessage = stepResult.delta[stepResult.delta.length - 1];
        if (!lastMessage || lastMessage.role !== 'assistant') {
            return null;
        }
        // Fast heuristic checks for common issues
        const issues = this.detectIssues(lastMessage, ctx);
        if (issues.length === 0) {
            return {
                shouldRetry: false,
                confidence: 0.9
            };
        }
        logger.debug(`Reflection detected ${issues.length} issues:`, issues);
        // For now, use heuristic correction - could be enhanced with LLM later
        const correction = this.generateCorrection(lastMessage, issues, ctx);
        return {
            shouldRetry: correction !== null,
            correctedMessage: correction || undefined,
            feedback: issues.join('; '),
            confidence: 0.7
        };
    }
    /**
     * Fast heuristic issue detection
     */
    detectIssues(message, ctx) {
        const issues = [];
        const content = message.content || '';
        // Check for malformed JSON in tool calls
        if (message.tool_calls) {
            for (const toolCall of message.tool_calls) {
                try {
                    if (typeof toolCall.function.arguments === 'string') {
                        JSON.parse(toolCall.function.arguments);
                    }
                }
                catch {
                    issues.push(`Malformed JSON in tool call ${toolCall.function.name}`);
                }
            }
        }
        // Check for missing tool usage when expected
        if (this.shouldUseTools(content, ctx) && !message.tool_calls?.length) {
            issues.push('Should use tools but none called');
        }
        // Check for overly verbose responses
        if (content.length > 2000 && !this.isComplexQuery(ctx)) {
            issues.push('Response too verbose for simple query');
        }
        // Check for empty or very short responses
        if (content.length < 10 && !message.tool_calls?.length) {
            issues.push('Response too brief');
        }
        return issues;
    }
    /**
     * Determines if the query requires tool usage
     */
    shouldUseTools(content, ctx) {
        const lastUserMessage = this.getLastUserMessage(ctx);
        if (!lastUserMessage)
            return false;
        const userContent = lastUserMessage.content?.toLowerCase() || '';
        const toolNames = Object.keys(ctx.tools);
        // Mathematical operations
        if (/\b(calculate|compute|add|sum|multiply|divide|subtract|\d+\s*[+\-*/]\s*\d+)\b/.test(userContent)) {
            return toolNames.some(name => /^(add|subtract|multiply|divide|calculate|math)/.test(name.toLowerCase()));
        }
        // Explicit tool mentions
        return toolNames.some(name => userContent.includes(name.toLowerCase()));
    }
    /**
     * Checks if the query is complex enough to warrant verbose responses
     */
    isComplexQuery(ctx) {
        const lastUserMessage = this.getLastUserMessage(ctx);
        if (!lastUserMessage)
            return false;
        const content = lastUserMessage.content || '';
        // Multiple questions or requests
        const questionCount = (content.match(/[?!]/g) || []).length;
        if (questionCount > 1)
            return true;
        // Long user input suggests complex query
        if (content.length > 500)
            return true;
        // Code-related queries
        if (/\b(code|function|algorithm|implementation|example)\b/.test(content.toLowerCase())) {
            return true;
        }
        return false;
    }
    /**
     * Attempts to generate a corrected message
     */
    generateCorrection(message, issues, ctx) {
        // For now, just apply simple corrections
        let correctedContent = message.content || '';
        // Truncate overly verbose responses
        if (issues.some(i => i.includes('too verbose')) && correctedContent.length > 1000) {
            const sentences = correctedContent.split(/[.!?]+/);
            correctedContent = sentences.slice(0, 3).join('.') + '.';
        }
        // Add tool usage suggestion
        if (issues.some(i => i.includes('Should use tools'))) {
            const availableTools = Object.keys(ctx.tools).join(', ');
            correctedContent += `\n\nI should use available tools: ${availableTools}`;
        }
        // Only return correction if we actually changed something
        return correctedContent !== message.content
            ? { ...message, content: correctedContent }
            : null;
    }
    /**
     * Gets the last user message from context
     */
    getLastUserMessage(ctx) {
        for (let i = ctx.messages.length - 1; i >= 0; i--) {
            if (ctx.messages[i].role === 'user') {
                return ctx.messages[i];
            }
        }
        return null;
    }
}
