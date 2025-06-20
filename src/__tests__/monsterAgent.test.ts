import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MonsterAgent, runMonsterAgent } from '../core/MonsterAgent.js';
import { createAgentContext } from '../core/AgentContext.js';
import { defineTool } from '../core/Tool.js';
import type { Provider, ChatMessage } from '../core/Provider.js';

// Mock provider for testing
function createMockProvider(id: string, responses: ChatMessage[]): Provider {
  let callCount = 0;
  return {
    id,
    supportsTools: true,
    async chat({ messages }) {
      const response = responses[callCount] || responses[responses.length - 1];
      callCount++;
      
      // Set finish reason based on response content
      const finishReason = response.tool_calls?.length ? 'tool_call' as const : 'stop' as const;
      
      return {
        messages: [...messages, response],
        finishReason
      };
    }
  };
}

// Mock tool for testing
const mockTool = defineTool({
  name: 'test_tool',
  description: 'A test tool',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    },
    required: ['input']
  },
  execute: async ({ input }: { input: string }) => `Processed: ${input}`
});

test('MonsterAgent executes basic conversation', async () => {
  const provider = createMockProvider('test', [
    { role: 'assistant', content: 'Hello! How can I help you?' }
  ]);

  const providerGroup = {
    primary: [provider],
    fallback: []
  };

  const result = await runMonsterAgent(
    [{ role: 'user', content: 'Hello' }],
    {},
    providerGroup
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].role, 'user');
  assert.equal(result[1].role, 'assistant');
  assert.equal(result[1].content, 'Hello! How can I help you?');
});

test('MonsterAgent handles tool calls', async () => {
  const provider = createMockProvider('test', [
    {
      role: 'assistant',
      content: null,
      tool_calls: [{
        id: 'call_1',
        type: 'function',
        function: {
          name: 'test_tool',
          arguments: JSON.stringify({ input: 'test data' })
        }
      }]
    },
    {
      role: 'assistant',
      content: 'Tool executed successfully!'
    }
  ]);

  const providerGroup = {
    primary: [provider],
    fallback: []
  };

  const result = await runMonsterAgent(
    [{ role: 'user', content: 'Use the test tool' }],
    { test_tool: mockTool },
    providerGroup
  );

  // Should have: user message, assistant with tool call, tool result, final assistant response
  assert.equal(result.length, 4);
  assert.equal(result[1].tool_calls?.length, 1);
  assert.equal(result[2].role, 'tool');
  assert.equal(result[3].content, 'Tool executed successfully!');
});

test('MonsterAgent with full metrics', async () => {
  const provider = createMockProvider('test', [
    { role: 'assistant', content: 'Response' }
  ]);

  const agent = new MonsterAgent();
  const result = await agent.run(
    [{ role: 'user', content: 'Test' }],
    {},
    {
      primary: [provider],
      fallback: []
    }
  );

  // Verify metrics
  assert.ok(result.metrics);
  assert.equal(typeof result.metrics.duration, 'number');
  assert.equal(typeof result.metrics.efficiency, 'number');
  assert.equal(typeof result.metrics.providerCalls, 'number');
  assert.equal(typeof result.metrics.toolExecutions, 'number');
  assert.equal(typeof result.metrics.costSavings, 'number');

  // Verify debug info
  assert.ok(result.debug);
  assert.ok(result.debug.plan);
  assert.equal(typeof result.debug.steps, 'number');
  assert.equal(typeof result.debug.reflections, 'number');
});

test('MonsterAgent handles provider racing', async () => {
  const fastProvider = createMockProvider('fast', [
    { role: 'assistant', content: 'Fast response' }
  ]);
  
  const slowProvider: Provider = {
    id: 'slow',
    supportsTools: true,
    async chat({ messages }) {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        messages: [...messages, { role: 'assistant', content: 'Slow response' }],
        finishReason: 'stop'
      };
    }
  };

  const result = await runMonsterAgent(
    [{ role: 'user', content: 'Test racing' }],
    {},
    {
      primary: [fastProvider, slowProvider],
      fallback: []
    },
    { enableRacing: true }
  );

  // Fast provider should win
  assert.equal(result[1].content, 'Fast response');
});

test('MonsterAgent handles memory management', async () => {
  const provider = createMockProvider('test', [
    { role: 'assistant', content: 'Response' }
  ]);

  // Create long conversation
  const longMessages = [
    { role: 'system' as const, content: 'System message' },
    ...Array.from({ length: 20 }, (_, i) => [
      { role: 'user' as const, content: `Message ${i}` },
      { role: 'assistant' as const, content: `Response ${i}` }
    ]).flat(),
    { role: 'user' as const, content: 'Final message' }
  ];

  const result = await runMonsterAgent(
    longMessages,
    {},
    {
      primary: [provider],
      fallback: []
    },
    {
      maxHistoryLength: 10,
      preserveSystemMessages: true
    }
  );

  // Should be pruned to 10 messages + system message preserved
  assert.ok(result.length <= 11); // 10 + final response
  
  // System message should be preserved
  const systemMessage = result.find(m => m.role === 'system');
  assert.ok(systemMessage);
  assert.equal(systemMessage.content, 'System message');
});

test('MonsterAgent fallback to secondary providers', async () => {
  const failingProvider: Provider = {
    id: 'failing',
    supportsTools: true,
    async chat() {
      throw new Error('Provider failed');
    }
  };

  const workingProvider = createMockProvider('working', [
    { role: 'assistant', content: 'Fallback response' }
  ]);

  const result = await runMonsterAgent(
    [{ role: 'user', content: 'Test fallback' }],
    {},
    {
      primary: [failingProvider],
      fallback: [workingProvider]
    }
  );

  // Should fall back to working provider
  assert.equal(result[1].content, 'Fallback response');
});

test('createAgentContext with custom options', () => {
  const ctx = createAgentContext(
    [{ role: 'user', content: 'Test' }],
    { test_tool: mockTool },
    {
      primary: [createMockProvider('test', [])],
      fallback: []
    },
    {
      maxSteps: 5,
      enableRacing: false,
      maxHistoryLength: 20
    }
  );

  assert.equal(ctx.messages.length, 1);
  assert.equal(ctx.options.maxSteps, 5);
  assert.equal(ctx.options.enableRacing, false);
  assert.equal(ctx.options.maxHistoryLength, 20);
  assert.ok(ctx.tools.test_tool);
});

test('MonsterAgent backwards compatibility', async () => {
  // Test that legacy provider format works
  const provider = createMockProvider('legacy', [
    { role: 'assistant', content: 'Legacy response' }
  ]);

  const result = await runMonsterAgent(
    [{ role: 'user', content: 'Test' }],
    {},
    [provider] as any, // Legacy format
    { maxSteps: 3 }
  );

  assert.equal(result[1].content, 'Legacy response');
});