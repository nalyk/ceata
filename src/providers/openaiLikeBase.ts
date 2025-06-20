import {
  Provider,
  ChatMessage,
  Tool,
  ChatResult,
  ToolCall,
} from "../core/Provider.js";
import { buildOpenAIMessages } from "./utils.js";
import { postJSON } from "../core/http.js";
import { streamSSE } from "../core/Stream.js";

export interface OpenAILikeOptions {
  id: string;
  apiKey: string;
  baseUrl: string;
  path: string;
  headers?: Record<string, string>;
  maxTokens: number;
  temperature?: number;
  timeoutMs: number;
  defaultStream?: boolean;
  normalizeToolArgs?: (args: string) => string | null;
  errorPrefix: string;
}

export function createOpenAILikeProvider(options: OpenAILikeOptions): Provider {
  const {
    id,
    apiKey,
    baseUrl,
    path,
    headers = {},
    maxTokens,
    temperature,
    timeoutMs,
    defaultStream = false,
    normalizeToolArgs,
    errorPrefix,
  } = options;

  return {
    id,
    supportsTools: true,
    chat(chatOptions) {
      const {
        model,
        messages,
        tools,
        stream = defaultStream,
        timeoutMs: overrideTimeout = timeoutMs,
      } = chatOptions;

      const requestBody: any = {
        model,
        messages: buildOpenAIMessages(messages),
        max_tokens: maxTokens,
        stream,
      };
      if (typeof temperature === "number") {
        requestBody.temperature = temperature;
      }
      if (tools && Object.keys(tools).length > 0) {
        requestBody.tools = Object.values(tools).map(t => ({
          type: "function",
          function: {
            name: t.schema.name,
            description: t.schema.description,
            parameters: t.schema.parameters,
          },
        }));
        requestBody.tool_choice = "auto";
      }

      const url = `${baseUrl}${path}`;
      const reqHeaders = { Authorization: `Bearer ${apiKey}`, ...headers };

      if (stream) {
        return (async function* () {
          const response = await postJSON(url, reqHeaders, requestBody, overrideTimeout);
          if (!response.ok) {
            const errorText = await response.text();
            let errorJson: any = {};
            try {
              errorJson = JSON.parse(errorText);
            } catch {}
            const message = errorJson.error?.message || response.statusText;
            const code = errorJson.error?.code || response.status;
            throw new Error(`${errorPrefix} API error: ${code} ${message}`);
          }

          const assistantMessage: ChatMessage = { role: "assistant", content: "" };
          const toolMap = new Map<string, ToolCall>();
          for await (const chunkText of streamSSE(response)) {
            const data = JSON.parse(chunkText);
            const choice = data.choices?.[0];
            if (!choice) continue;
            const delta = choice.delta || {};
            if (typeof delta.content === "string") {
              assistantMessage.content = (assistantMessage.content || "") + delta.content;
            }
            if (delta.tool_calls) {
              if (!assistantMessage.tool_calls) assistantMessage.tool_calls = [];
              for (const tc of delta.tool_calls as ToolCall[]) {
                let existing = toolMap.get(tc.id);
                if (!existing) {
                  existing = { id: tc.id, type: "function", function: { name: tc.function.name, arguments: "" } };
                  assistantMessage.tool_calls.push(existing);
                  toolMap.set(tc.id, existing);
                }
                if (tc.function?.name) existing.function.name = tc.function.name;
                if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
              }
            }

            const finish = choice.finish_reason;
            let finalMessage = { ...assistantMessage };
            if (finish && finalMessage.tool_calls) {
              finalMessage.tool_calls = finalMessage.tool_calls.map(tc => fixToolCall(tc));
            }
            const res: ChatResult = {
              messages: [...messages, finalMessage],
              finishReason: finish === "tool_calls" ? "tool_call" : finish === "length" ? "length" : "stop",
            };
            yield res;
            if (finish) return;
          }
        })();
      }

      return (async () => {
        const response = await postJSON(url, reqHeaders, requestBody, overrideTimeout);
        if (!response.ok) {
          const errorText = await response.text();
          let errorJson: any = {};
          try {
            errorJson = JSON.parse(errorText);
          } catch {}
          const message = errorJson.error?.message || response.statusText;
          const code = errorJson.error?.code || response.status;
          throw new Error(`${errorPrefix} API error: ${code} ${message}`);
        }

        const responseText = await response.text();
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`${errorPrefix} failed to return valid JSON. Response: ${responseText}`);
        }

        if (!data.choices || data.choices.length === 0) {
          if (data.error) {
            throw new Error(`${errorPrefix} API Error: ${data.error.message} (Code: ${data.error.code || "N/A"})`);
          }
          throw new Error(`Invalid response from ${errorPrefix}: no choices returned`);
        }

        const choice = data.choices[0];
        if (!choice) {
          throw new Error(`No response from ${errorPrefix}`);
        }

        let toolCalls = choice.message.tool_calls;
        if (toolCalls) {
          toolCalls = toolCalls.map((tc: any) => fixToolCall(tc));
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: choice.message.content || null,
          tool_calls: toolCalls,
        };

        const result: ChatResult = {
          messages: [...messages, assistantMessage],
          finishReason: choice.finish_reason === "tool_calls" ? "tool_call" : choice.finish_reason === "length" ? "length" : "stop",
          usage: data.usage
            ? {
                prompt: data.usage.prompt_tokens,
                completion: data.usage.completion_tokens,
                total: data.usage.total_tokens,
              }
            : undefined,
        };

        return result;
      })();

      function fixToolCall(tc: ToolCall): ToolCall {
        if (tc.function && tc.function.arguments) {
          try {
            JSON.parse(tc.function.arguments);
            return tc;
          } catch {
            if (normalizeToolArgs) {
              const fixed = normalizeToolArgs(tc.function.arguments);
              if (fixed) return { ...tc, function: { ...tc.function, arguments: fixed } };
            }
          }
        }
        return tc;
      }
    },
  };
}
