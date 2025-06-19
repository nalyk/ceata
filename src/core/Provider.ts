export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolSchema {
  name: string;
  description: string;
  parameters: unknown;
}

export interface Tool<TInput = unknown, TOutput = unknown> {
  schema: ToolSchema;
  execute: (args: TInput) => Promise<TOutput>;
}

export interface ChatResult {
  messages: ChatMessage[];
  finishReason: "stop" | "tool_call" | "length" | "error";
  toolCall?: { name: string; args: unknown };
  usage?: { prompt: number; completion: number; total: number };
}

export interface Provider {
  id: string;
  supportsTools: boolean;

  chat(options: {
    model: string;
    messages: ChatMessage[];
    tools?: Record<string, Tool<any, any>>;
    stream?: boolean;
    timeoutMs?: number;
  }): AsyncIterable<ChatResult> | Promise<ChatResult>;
}
