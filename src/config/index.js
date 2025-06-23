import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
/** Load environment variables from a .env file if present */
function loadEnvFile() {
    const envPath = resolve(process.cwd(), ".env");
    if (!existsSync(envPath))
        return;
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#"))
            continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1)
            continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}
loadEnvFile();
/** Validate required keys and numeric ranges */
function validateConfig() {
    const { providers, defaults } = config;
    if (providers.openai.maxTokens <= 0) {
        throw new Error('Invalid config: OPENAI_MAX_TOKENS must be > 0');
    }
    if (providers.openai.timeoutMs <= 0) {
        throw new Error('Invalid config: OPENAI_TIMEOUT_MS must be > 0');
    }
    if (providers.openrouter.maxTokens <= 0) {
        throw new Error('Invalid config: OPENROUTER_MAX_TOKENS must be > 0');
    }
    if (providers.openrouter.temperature < 0 ||
        providers.openrouter.temperature > 2) {
        throw new Error('Invalid config: OPENROUTER_TEMPERATURE must be between 0 and 2');
    }
    if (providers.openrouter.timeoutMs <= 0) {
        throw new Error('Invalid config: OPENROUTER_TIMEOUT_MS must be > 0');
    }
    if (providers.google.timeoutMs <= 0) {
        throw new Error('Invalid config: GOOGLE_TIMEOUT_MS must be > 0');
    }
    if (defaults.maxTokens <= 0) {
        throw new Error('Invalid config: DEFAULT_MAX_TOKENS must be > 0');
    }
    if (defaults.timeoutMs <= 0) {
        throw new Error('Invalid config: DEFAULT_TIMEOUT_MS must be > 0');
    }
    if (defaults.temperature < 0 || defaults.temperature > 2) {
        throw new Error('Invalid config: DEFAULT_TEMPERATURE must be between 0 and 2');
    }
}
/**
 * Get configuration value from environment or use default
 */
function getEnvVar(key, defaultValue) {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
    }
    return defaultValue;
}
function getEnvNumber(key, defaultValue) {
    if (typeof process !== 'undefined' && process.env) {
        const value = process.env[key];
        if (value) {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? defaultValue : parsed;
        }
    }
    return defaultValue;
}
function getEnvFloat(key, defaultValue) {
    if (typeof process !== 'undefined' && process.env) {
        const value = process.env[key];
        if (value) {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
        }
    }
    return defaultValue;
}
/**
 * Default configuration with environment variable support
 */
export const config = {
    providers: {
        openai: {
            apiKey: getEnvVar('OPENAI_API_KEY', ''),
            baseUrl: getEnvVar('OPENAI_BASE_URL', 'https://api.openai.com'),
            defaultModel: getEnvVar('OPENAI_DEFAULT_MODEL', 'gpt-4o-mini'),
            maxTokens: getEnvNumber('OPENAI_MAX_TOKENS', 4000),
            timeoutMs: getEnvNumber('OPENAI_TIMEOUT_MS', 30000),
        },
        openrouter: {
            apiKey: getEnvVar('OPENROUTER_API_KEY', ''),
            baseUrl: getEnvVar('OPENROUTER_BASE_URL', 'https://openrouter.ai'),
            defaultModel: getEnvVar('OPENROUTER_DEFAULT_MODEL', 'mistralai/devstral-small:free'),
            maxTokens: getEnvNumber('OPENROUTER_MAX_TOKENS', 4000),
            temperature: getEnvFloat('OPENROUTER_TEMPERATURE', 0.7),
            timeoutMs: getEnvNumber('OPENROUTER_TIMEOUT_MS', 30000),
        },
        google: {
            apiKey: getEnvVar('GOOGLE_API_KEY', ''),
            baseUrl: getEnvVar('GOOGLE_BASE_URL', 'https://generativelanguage.googleapis.com'),
            defaultModel: getEnvVar('GOOGLE_DEFAULT_MODEL', 'models/gemini-2.0-flash-thinking-exp'),
            timeoutMs: getEnvNumber('GOOGLE_TIMEOUT_MS', 30000),
        },
    },
    defaults: {
        timeoutMs: getEnvNumber('DEFAULT_TIMEOUT_MS', 30000),
        maxTokens: getEnvNumber('DEFAULT_MAX_TOKENS', 4000),
        temperature: getEnvFloat('DEFAULT_TEMPERATURE', 0.7),
    },
};
validateConfig();
/**
 * Update configuration at runtime
 */
export function updateConfig(updates) {
    if (updates.providers) {
        Object.assign(config.providers, updates.providers);
    }
    if (updates.defaults) {
        Object.assign(config.defaults, updates.defaults);
    }
}
/**
 * Get provider-specific configuration
 */
export function getProviderConfig(provider) {
    return config.providers[provider];
}
