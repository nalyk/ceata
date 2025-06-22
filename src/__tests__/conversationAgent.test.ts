import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ConversationAgent } from '../core/ConversationAgent.js';
import { runAgent } from '../core/AgentRunner.js';
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

// Mock vanilla provider (simulates free models with vanilla tool calling)
function createMockVanillaProvider(id: string, responses: string[]): Provider {
  let callCount = 0;
  return {
    id,
    supportsTools: false, // Free models don't support native tool calling
    async chat({ messages }) {
      const responseText = responses[callCount] || responses[responses.length - 1];
      callCount++;
      
      return {
        messages: [...messages, { role: 'assistant', content: responseText }],
        finishReason: 'stop'
      };
    }
  };
}

// Mock tools for testing
const mockMathTools = {
  multiply: defineTool({
    name: 'multiply',
    description: 'Multiply two numbers together',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'First number' },
        b: { type: 'number', description: 'Second number' },
      },
      required: ['a', 'b']
    },
    execute: async ({ a, b }: { a: number; b: number }) => a * b
  }),

  divide: defineTool({
    name: 'divide',
    description: 'Divide two numbers',
    parameters: {
      type: 'object',
      properties: {
        a: { type: 'number', description: 'Dividend' },
        b: { type: 'number', description: 'Divisor' },
      },
      required: ['a', 'b']
    },
    execute: async ({ a, b }: { a: number; b: number }) => {
      if (b === 0) throw new Error('Cannot divide by zero');
      return a / b;
    }
  }),

  test_tool: defineTool({
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
  })
};

test('ConversationAgent executes basic conversation', async () => {
  const provider = createMockProvider('test', [
    { role: 'assistant', content: 'Hello! How can I help you?' }
  ]);

  const providerGroup = {
    primary: [provider],
    fallback: []
  };

  const result = await runAgent(
    [{ role: 'user', content: 'Hello' }],
    {},
    [{ p: provider, model: 'test', priority: 'primary' }]
  );

  assert.equal(result.length, 2);
  assert.equal(result[0].role, 'user');
  assert.equal(result[1].role, 'assistant');
  assert.equal(result[1].content, 'Hello! How can I help you?');
});

test('ConversationAgent handles tool calls (classical)', async () => {
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

  const result = await runAgent(
    [{ role: 'user', content: 'Use the test tool' }],
    { test_tool: mockMathTools.test_tool },
    [{ p: provider, model: 'test', priority: 'primary' }]
  );

  // Should have: user message, assistant with tool call, tool result, final assistant response
  assert.equal(result.length, 4);
  assert.equal(result[1].tool_calls?.length, 1);
  assert.equal(result[2].role, 'tool');
  assert.equal(result[3].content, 'Tool executed successfully!');
});

test('ConversationAgent handles vanilla tool calling (free models)', async () => {
  // Simulate free model using vanilla tool calling
  const vanillaProvider = createMockVanillaProvider('mistral-free', [
    'I need to multiply 15 and 8. TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}',
    'Now I need to divide the result by 3. TOOL_CALL: {"name": "divide", "arguments": {"a": 120, "b": 3}}',
    'The area of a 15×8 rectangle divided by 3 is 40.'
  ]);

  const result = await runAgent(
    [{ role: 'user', content: 'Calculate the area of a 15×8 rectangle, then divide by 3' }],
    mockMathTools,
    [{ p: vanillaProvider, model: 'mistralai/mistral-small-3.2-24b-instruct:free', priority: 'primary' }]
  );

  // Should have sequential tool execution
  assert.ok(result.length >= 4); // user + multiple assistant/tool exchanges
  
  // Final response should contain the correct answer
  const finalResponse = result[result.length - 1];
  assert.ok(finalResponse.content?.includes('40'));
});

test('ConversationAgent with full metrics', async () => {
  const provider = createMockProvider('test', [
    { role: 'assistant', content: 'Response' }
  ]);

  const agent = new ConversationAgent();
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
  assert.ok(Array.isArray(result.debug.providerHistory));
});

test('ConversationAgent handles provider racing', async () => {
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

  const result = await runAgent(
    [{ role: 'user', content: 'Test racing' }],
    {},
    [
      { p: fastProvider, model: 'test', priority: 'primary' },
      { p: slowProvider, model: 'test', priority: 'primary' }
    ],
    { enableRacing: true }
  );

  // Fast provider should win
  assert.equal(result[1].content, 'Fast response');
});

test('ConversationAgent handles memory management', async () => {
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

  const result = await runAgent(
    longMessages,
    {},
    [{ p: provider, model: 'test', priority: 'primary' }],
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

test('ConversationAgent fallback to secondary providers (cost optimization)', async () => {
  const failingFreeProvider: Provider = {
    id: 'mistral-free',
    supportsTools: false,
    async chat() {
      throw new Error('Free provider failed');
    }
  };

  const workingPremiumProvider = createMockProvider('gpt-4o-mini', [
    { role: 'assistant', content: 'Premium fallback response' }
  ]);

  const result = await runAgent(
    [{ role: 'user', content: 'Test fallback' }],
    {},
    [
      { p: failingFreeProvider, model: 'mistralai/mistral-small-3.2-24b-instruct:free', priority: 'primary' },
      { p: workingPremiumProvider, model: 'gpt-4o-mini', priority: 'fallback' }
    ]
  );

  // Should fall back to premium provider
  assert.equal(result[1].content, 'Premium fallback response');
});

test('ConversationAgent free-model-first strategy', async () => {
  const freeProvider = createMockVanillaProvider('mistral-free', [
    'Free model response'
  ]);

  const premiumProvider = createMockProvider('gpt-premium', [
    { role: 'assistant', content: 'Premium model response' }
  ]);

  const result = await runAgent(
    [{ role: 'user', content: 'Simple request' }],
    {},
    [
      { p: freeProvider, model: 'mistralai/mistral-small-3.2-24b-instruct:free', priority: 'primary' },
      { p: premiumProvider, model: 'gpt-4o-mini', priority: 'fallback' }
    ]
  );

  // Should use free model first
  assert.equal(result[1].content, 'Free model response');
});

test('createAgentContext with custom options', () => {
  const ctx = createAgentContext(
    [{ role: 'user', content: 'Test' }],
    { test_tool: mockMathTools.test_tool },
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

test('ConversationAgent backwards compatibility', async () => {
  // Test that legacy provider format works
  const provider = createMockProvider('legacy', [
    { role: 'assistant', content: 'Legacy response' }
  ]);

  const result = await runAgent(
    [{ role: 'user', content: 'Test' }],
    {},
    [{ p: provider, model: 'test', priority: 'primary' }],
    { maxSteps: 3 }
  );

  assert.equal(result[1].content, 'Legacy response');
});

test('ConversationAgent sequential tool execution correctness', async () => {
  // The critical test case: sequential math operations
  const sequentialProvider = createMockVanillaProvider('sequential-test', [
    'I need to calculate the area first. TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}',
    'Now I divide the area by 3. TOOL_CALL: {"name": "divide", "arguments": {"a": 120, "b": 3}}',
    'The final answer is 40.'
  ]);

  const result = await runAgent(
    [{ role: 'user', content: 'Calculate area of 15×8 rectangle, then divide by 3' }],
    mockMathTools,
    [{ p: sequentialProvider, model: 'test-sequential', priority: 'primary' }]
  );

  // Verify correct sequential execution
  assert.ok(result.length >= 4);
  
  // Final answer should be 40 (15×8=120, 120÷3=40)
  const finalMessage = result[result.length - 1];
  assert.ok(finalMessage.content?.includes('40'));
});

test('ConversationAgent cost tracking', async () => {
  const freeProvider = createMockVanillaProvider('free', ['Free response']);
  
  const result = await runAgent(
    [{ role: 'user', content: 'Test cost tracking' }],
    {},
    [{ p: freeProvider, model: 'mistralai/mistral-small-3.2-24b-instruct:free', priority: 'primary' }]
  );

  // Using free models should show cost savings
  assert.ok(result.length >= 2);
  // Note: Full cost tracking would be implemented in actual ConversationAgent
});

test('ConversationAgent error recovery', async () => {
  let callCount = 0;
  const unreliableProvider: Provider = {
    id: 'unreliable',
    supportsTools: true,
    async chat({ messages }) {
      callCount++;
      if (callCount === 1) {
        throw new Error('First call failed');
      }
      return {
        messages: [...messages, { role: 'assistant', content: 'Recovered response' }],
        finishReason: 'stop'
      };
    }
  };

  const result = await runAgent(
    [{ role: 'user', content: 'Test error recovery' }],
    {},
    [{ p: unreliableProvider, model: 'test', priority: 'primary' }],
    { retryConfig: { maxRetries: 2, baseDelayMs: 10, maxDelayMs: 100, jitter: false } }
  );

  // Should recover and succeed on retry
  assert.equal(result[1].content, 'Recovered response');
});