/**
 * Google AI Provider with OpenAI-Compatible Endpoint
 * Uses Google's OpenAI-compatible endpoint for better tool calling support
 */

import { Provider, ChatMessage, Tool, ChatResult } from "../core/Provider.js";
import { config } from "../config/index.js";
import { postJSON } from "../core/http.js";

export function createGoogleOpenAIProvider(apiKey?: string, baseUrl?: string, options?: {
  timeoutMs?: number;
}): Provider {
  const providerConfig = config.providers.google;
  const actualApiKey = apiKey || providerConfig.apiKey;
  const actualBaseUrl = baseUrl || "https://ai-api.yoda.digital/v1beta/openai";
  const actualTimeoutMs = options?.timeoutMs || providerConfig.timeoutMs;

  if (!actualApiKey) {
    throw new Error(
      "Google OpenAI provider requires a non-empty API key. Set GOOGLE_API_KEY or pass it to createGoogleOpenAIProvider().",
    );
  }

  return {
    id: "google-openai",
    supportsTools: true,
    async chat(options) {
      const { model, messages, tools, timeoutMs = actualTimeoutMs } = options;

      // Convert tools to OpenAI format
      const openaiTools = tools ? Object.values(tools).map(tool => ({
        type: "function",
        function: {
          name: tool.schema.name,
          description: tool.schema.description,
          parameters: tool.schema.parameters,
        },
      })) : undefined;

      // Handle model name - ensure proper format
      let apiModel = model.startsWith("google/") ? model.substring("google/".length) : model;
      if (!apiModel.startsWith("models/")) {
        apiModel = `models/${apiModel}`;
      }

      const requestBody: any = {
        model: apiModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
      };

      if (openaiTools && openaiTools.length > 0) {
        requestBody.tools = openaiTools;
        requestBody.tool_choice = "auto";
      }

      const response = await postJSON(
        `${actualBaseUrl}/chat/completions`,
        {
          "Authorization": `Bearer ${actualApiKey}`,
          "Content-Type": "application/json",
        },
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
        throw new Error(`Google OpenAI API error: ${code} ${message}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        if (data.error) {
          throw new Error(`Google OpenAI API Error: ${data.error.message}`);
        }
        throw new Error("Invalid response from Google OpenAI API: no choices returned");
      }

      const choice = data.choices[0];
      const message = choice.message;
      
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls,
      };

      const result: ChatResult = {
        messages: [...messages, assistantMessage],
        finishReason: message.tool_calls ? "tool_call" : 
                     choice.finish_reason === "length" ? "length" : "stop",
        usage: data.usage ? {
          prompt: data.usage.prompt_tokens || 0,
          completion: data.usage.completion_tokens || 0,
          total: data.usage.total_tokens || 0,
        } : undefined,
      };
      return result;
    },
  };
}

// Export default instance using configuration
export const googleOpenAI = createGoogleOpenAIProvider();