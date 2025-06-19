import { Provider, ChatMessage, Tool, ChatResult } from "../core/Provider.js";
import { config } from "../config/index.js";
import { buildOpenAIMessages } from "./utils.js";
import { postJSON } from "../core/http.js";

export function createOpenAIProvider(apiKey?: string, baseUrl?: string, options?: {
  maxTokens?: number;
  timeoutMs?: number;
}): Provider {
  const providerConfig = config.providers.openai;
  const actualApiKey = apiKey || providerConfig.apiKey;
  const actualBaseUrl = baseUrl || providerConfig.baseUrl;
  const actualMaxTokens = options?.maxTokens || providerConfig.maxTokens;
  const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;

  if (!actualApiKey) {
    throw new Error(
      "OpenAI provider requires a non-empty API key. Set OPENAI_API_KEY or pass it to createOpenAIProvider().",
    );
  }

  return {
    id: "openai",
    supportsTools: true,
    async chat(options) {
      const { model, messages, tools, timeoutMs = actualTimeoutMs } = options;

      const requestBody: any = {
          model,
          messages: buildOpenAIMessages(messages),
          max_tokens: actualMaxTokens,
        };

        if (tools && Object.keys(tools).length > 0) {
          requestBody.tools = Object.values(tools).map(tool => ({
            type: "function",
            function: {
              name: tool.schema.name,
              description: tool.schema.description,
              parameters: tool.schema.parameters,
            },
          }));
          requestBody.tool_choice = "auto";
        }

        const response = await postJSON(
          `${actualBaseUrl}/v1/chat/completions`,
          { Authorization: `Bearer ${actualApiKey}` },
          requestBody,
          timeoutMs,
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorJson: any = {};
          try {
            errorJson = JSON.parse(errorText);
          } catch (e) {
            // Not a JSON error
          }
          const message = errorJson.error?.message || response.statusText;
          const code = errorJson.error?.code || response.status;
          throw new Error(`OpenAI API error: ${code} ${message}`);
        }

        const data = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
          if (data.error) {
            throw new Error(`OpenAI API Error: ${data.error.message} (Code: ${data.error.code})`);
          }
          throw new Error("Invalid response from OpenAI: no choices returned");
        }

        const choice = data.choices[0];
        
        if (!choice) {
          throw new Error("No response from OpenAI");
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: choice.message.content || null,
          tool_calls: choice.message.tool_calls,
        };

        const result: ChatResult = {
          messages: [...messages, assistantMessage],
          finishReason: choice.finish_reason === "tool_calls" ? "tool_call" :
                       choice.finish_reason === "length" ? "length" : "stop",
          usage: data.usage ? {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          } : undefined,
        };

        return result;
      },
    };
  }

// Export default instance using configuration
export const openai = createOpenAIProvider();
