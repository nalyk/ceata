import { Provider } from "../core/Provider.js";
import { config } from "../config/index.js";
import { createOpenAILikeProvider } from "./openaiLikeBase.js";

export function createOpenAIProvider(
  apiKey?: string,
  baseUrl?: string,
  options?: {
    maxTokens?: number;
    timeoutMs?: number;
    stream?: boolean;
  },
): Provider {
  const providerConfig = config.providers.openai;
  const actualApiKey = apiKey || providerConfig.apiKey;
  const actualBaseUrl = baseUrl || providerConfig.baseUrl;
  const actualMaxTokens = options?.maxTokens || providerConfig.maxTokens;
  const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;
  const defaultStream = options?.stream ?? false;

  if (!actualApiKey) {
    throw new Error(
      "OpenAI provider requires a non-empty API key. Set OPENAI_API_KEY or pass it to createOpenAIProvider().",
    );
  }

  return createOpenAILikeProvider({
    id: "openai",
    apiKey: actualApiKey,
    baseUrl: actualBaseUrl,
    path: "/v1/chat/completions",
    maxTokens: actualMaxTokens,
    timeoutMs: actualTimeoutMs,
    defaultStream,
    errorPrefix: "OpenAI",
  });
}

// Export default instance using configuration
export const openai = createOpenAIProvider();
