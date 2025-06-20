import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAgent, ProviderConfig } from '../core/AgentRunner.js';
import { defineTool } from '../core/Tool.js';
import type { Provider, ChatMessage } from '../core/Provider.js';

// Utility to create a provider that either succeeds or fails
function createProvider(id: string, options: {
  fail?: boolean;
  reply?: (messages: ChatMessage[], call: number) => ChatMessage;
}): Provider {
  let callCount = 0;
  return {
    id,
    supportsTools: true,
    async chat({ messages }) {
      callCount++;
      if (options.fail) {
        throw new Error('failure');
      }
      const assistant = options.reply?.(messages, callCount) ?? { role: 'assistant', content: 'ok' };
      return { messages: [...messages, assistant], finishReason: 'stop' };
    },
  };
}

// Provider fallback logic
test('uses fallback provider when primary fails', async () => {
  const calls: string[] = [];
  const failing = createProvider('primary', { fail: true });
  const success = createProvider('fallback', {
    reply: () => ({ role: 'assistant', content: 'from fallback' }),
  });
  // Wrap chat methods to record call order
  const wrap = (p: Provider) => ({
    ...p,
    chat(opts: any) {
      calls.push(p.id);
      return p.chat(opts);
    },
  });

  const providers: ProviderConfig[] = [
    { p: wrap(failing), model: 'm1', priority: 'primary' },
    { p: wrap(success), model: 'm2', priority: 'fallback' },
  ];

  const history = await runAgent(
    [{ role: 'user', content: 'hi' }],
    {},
    providers,
  );

  assert.deepEqual(calls, ['primary', 'fallback']);
  assert.equal(history[history.length - 1].content, 'from fallback');
});

// Tool execution
test('executes tools returned by the provider', async () => {
  let executed: any = null;
  const add = defineTool<{ a: number; b: number }, number>({
    name: 'add',
    description: 'add numbers',
    parameters: {
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'number' } },
      required: ['a', 'b'],
    },
    execute: async ({ a, b }) => {
      executed = { a, b };
      return a + b;
    },
  });

  let callCount = 0;
  const provider: Provider = {
    id: 'tooler',
    supportsTools: true,
    async chat({ messages }) {
      callCount++;
      if (callCount === 1) {
        return {
          messages: [
            ...messages,
            {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: '1',
                  type: 'function',
                  function: { name: 'add', arguments: JSON.stringify({ a: 1, b: 2 }) },
                },
              ],
            },
          ],
          finishReason: 'tool_call',
        };
      }
      const last = messages[messages.length - 1];
      return {
        messages: [...messages, { role: 'assistant', content: `Result is ${last.content}` }],
        finishReason: 'stop',
      };
    },
  };

  const providers: ProviderConfig[] = [
    { p: provider, model: 'm', priority: 'primary' },
  ];

  const history = await runAgent(
    [{ role: 'user', content: 'calc 1+2' }],
    { add },
    providers,
  );

  assert.equal(callCount, 2);
  assert.deepEqual(executed, { a: 1, b: 2 });
  assert.deepEqual(history.map(m => m.role), ['user', 'assistant', 'tool', 'assistant']);
  assert.equal(history[history.length - 1].content, 'Result is 3');
});

// Timeout forwarding
test('forwards timeoutMs to provider', async () => {
  let received: number | undefined;
  const p: Provider = {
    id: 't',
    supportsTools: true,
    async chat(opts) {
      received = (opts as any).timeoutMs;
      return { messages: [...opts.messages, { role: 'assistant', content: 'ok' }], finishReason: 'stop' };
    },
  };

  const providers: ProviderConfig[] = [
    { p, model: 'm', priority: 'primary' },
  ];

  await runAgent(
    [{ role: 'user', content: 'hi' }],
    {},
    providers,
    8,
    999,
  );

  assert.equal(received, 999);
});
