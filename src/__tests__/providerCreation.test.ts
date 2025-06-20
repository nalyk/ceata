import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../config/index.js';

// Helper to temporarily set a property
function withTemp<T>(obj: any, key: string, value: T, fn: () => Promise<void> | void) {
  const original = obj[key];
  obj[key] = value;
  return Promise.resolve(fn()).finally(() => {
    obj[key] = original;
  });
}

// Streaming must run first to ensure fresh module imports
test('createOpenAIProvider supports streaming via streamSSE', async (t) => {
  await withTemp(config.providers.openai, 'apiKey', 'sk-test', async () => {
    const streamMock = t.mock.module('../core/Stream.js', {
      namedExports: {
        async *streamSSE() {
          yield JSON.stringify({ choices: [{ delta: { content: 'A' } }] });
          yield JSON.stringify({ choices: [{ delta: { content: 'B' } }] });
          yield JSON.stringify({ choices: [{ finish_reason: 'stop', delta: {} }] });
        },
      },
    });

    const fetchMock = t.mock.method(globalThis as any, 'fetch', async () => new Response('', { status: 200 }));
    const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
    const provider = createOpenAIProvider();
    const chunks: any[] = [];
    for await (const r of provider.chat({ model: 'gpt', messages: [{ role: 'user', content: 'hi' }], stream: true })) {
      chunks.push(r);
    }
    assert.equal(chunks.at(-1)?.messages.at(-1)?.content, 'AB');
    assert.equal(chunks.at(-1)?.finishReason, 'stop');
    streamMock.restore();
    fetchMock.mock.restore();
  });
});

// OpenAI: missing API key should throw
test('createOpenAIProvider throws without API key', async () => {
  config.providers.openai.apiKey = 'dummy';
  const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
  await withTemp(config.providers.openai, 'apiKey', '', () => {
    assert.throws(() => createOpenAIProvider(), /non-empty API key/);
  });
});

// Google: missing API key should throw
test('createGoogleProvider throws without API key', async () => {
  config.providers.google.apiKey = 'dummy';
  const { createGoogleProvider } = await import(`../providers/google.js?${Date.now()}`);
  await withTemp(config.providers.google, 'apiKey', '', () => {
    assert.throws(() => createGoogleProvider(), /non-empty API key/);
  });
});

// OpenAI: successful non-streaming chat
test('createOpenAIProvider performs chat', async (t) => {
  await withTemp(config.providers.openai, 'apiKey', 'sk-test', async () => {
    const fetchMock = t.mock.method(globalThis as any, 'fetch', async () => {
      return new Response(JSON.stringify({
        choices: [{ message: { content: 'hi there' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }), { status: 200 });
    });

    const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
    const provider = createOpenAIProvider();
    const result = await provider.chat({ model: 'gpt', messages: [{ role: 'user', content: 'hello' }] }) as any;
    assert.equal(result.messages.at(-1)?.content, 'hi there');
    assert.equal(result.finishReason, 'stop');
    fetchMock.mock.restore();
  });
});

// Google: successful chat
test('createGoogleProvider performs chat', async (t) => {
  await withTemp(config.providers.google, 'apiKey', 'g-key', async () => {
    const fetchMock = t.mock.method(globalThis as any, 'fetch', async () => {
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'response' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      }), { status: 200 });
    });

    const { createGoogleProvider } = await import(`../providers/google.js?${Date.now()}`);
    const provider = createGoogleProvider();
    const result = await provider.chat({ model: 'models/test', messages: [{ role: 'user', content: 'hi' }] }) as any;
    assert.equal(result.messages.at(-1)?.content, 'response');
    assert.equal(result.finishReason, 'stop');
    fetchMock.mock.restore();
  });
});
