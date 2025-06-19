import type { ChatMessage } from "../core/Provider.js";

export function buildOpenAIMessages(messages: ChatMessage[]) {
  return messages.map(msg => {
    const payload: any = { role: msg.role };
    if (msg.content !== undefined && msg.content !== null) {
      payload.content = msg.content;
    }
    if (msg.tool_calls) {
      payload.tool_calls = msg.tool_calls;
    }
    if (msg.tool_call_id) {
      payload.tool_call_id = msg.tool_call_id;
    }
    if (msg.name) {
      payload.name = msg.name;
    }
    return payload;
  });
}
