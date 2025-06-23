import { config } from "../config/index.js";
import { createOpenAILikeProvider } from "./openaiLikeBase.js";
import { logger } from "../core/logger.js";
export function createOpenRouterProvider(apiKey, baseUrl, options) {
    const providerConfig = config.providers.openrouter;
    const actualApiKey = apiKey || providerConfig.apiKey;
    const actualBaseUrl = baseUrl || providerConfig.baseUrl;
    const actualMaxTokens = options?.maxTokens || providerConfig.maxTokens;
    const actualTemperature = options?.temperature || providerConfig.temperature;
    const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;
    const defaultStream = options?.stream ?? false;
    const extraHeaders = options?.headers;
    if (!actualApiKey) {
        throw new Error("OpenRouter provider requires a non-empty API key. Set OPENROUTER_API_KEY or pass it to createOpenRouterProvider().");
    }
    return createOpenAILikeProvider({
        id: "openrouter",
        apiKey: actualApiKey,
        baseUrl: actualBaseUrl,
        path: "/api/v1/chat/completions",
        headers: extraHeaders,
        maxTokens: actualMaxTokens,
        temperature: actualTemperature,
        timeoutMs: actualTimeoutMs,
        defaultStream,
        normalizeToolArgs: normalizeOpenRouterJSON,
        errorPrefix: "OpenRouter",
    });
}
/**
 * Comprehensive JSON normalization for OpenRouter responses
 */
export function normalizeOpenRouterJSON(argsString) {
    try {
        JSON.parse(argsString);
        return argsString;
    }
    catch { }
    try {
        const duplicatePattern = /(\{[^}]+\})\s*\1+/g;
        let normalized = argsString.replace(duplicatePattern, "$1");
        const jsonMatches = normalized.match(/\{[^}]*\}/g);
        if (jsonMatches && jsonMatches.length > 0) {
            for (const match of jsonMatches) {
                try {
                    JSON.parse(match);
                    return match;
                }
                catch {
                    continue;
                }
            }
        }
        const complexPatterns = [
            /\{\s*"[^"]+"\s*:\s*[^,}]+(?:\s*,\s*"[^"]+"\s*:\s*[^,}]+)*\s*\}/g,
            /\{\s*"[^"]+"\s*:\s*(?:"[^"]*"|\d+|true|false|null)\s*\}/g,
        ];
        for (const pattern of complexPatterns) {
            const matches = argsString.match(pattern);
            if (matches) {
                for (const match of matches) {
                    try {
                        JSON.parse(match);
                        return match;
                    }
                    catch {
                        continue;
                    }
                }
            }
        }
        const keyValuePattern = /"([^"]+)"\s*:\s*(?:"([^"]*)"|(\d+(?:\.\d+)?)|true|false|null)/g;
        const extracted = {};
        let kvMatch;
        while ((kvMatch = keyValuePattern.exec(argsString)) !== null) {
            const key = kvMatch[1];
            const stringValue = kvMatch[2];
            const numberValue = kvMatch[3];
            if (stringValue !== undefined) {
                extracted[key] = stringValue;
            }
            else if (numberValue !== undefined) {
                extracted[key] = parseFloat(numberValue);
            }
            else {
                // Handle boolean/null values
                const rawValue = kvMatch[0].split(':')[1].trim();
                if (rawValue === 'true')
                    extracted[key] = true;
                else if (rawValue === 'false')
                    extracted[key] = false;
                else if (rawValue === 'null')
                    extracted[key] = null;
            }
        }
        if (Object.keys(extracted).length > 0) {
            const result = JSON.stringify(extracted);
            logger.debug('🔧 [OpenRouter] Manually extracted key-value pairs');
            return result;
        }
        logger.debug('❌ [OpenRouter] All normalization strategies failed');
        return null;
    }
    catch (e) {
        console.error("❌ [OpenRouter] Error during JSON normalization:", e);
        return null;
    }
    return null;
}
// Export default instance using configuration
export const openRouter = createOpenRouterProvider();
