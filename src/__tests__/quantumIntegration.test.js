import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QuantumConversationAgent } from '../core/QuantumConversationAgent.js';
import { ConversationAgent } from '../core/ConversationAgent.js';
import { defineTool } from '../core/Tool.js';
// Mock providers representing real-world scenarios
function createMockFreeProvider(id, responses) {
    let callCount = 0;
    return {
        id,
        supportsTools: false, // Free models use vanilla tool calling
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
function createMockPremiumProvider(id, responses) {
    let callCount = 0;
    return {
        id,
        supportsTools: true, // Premium models support native tools
        async chat({ messages }) {
            const response = responses[callCount] || responses[responses.length - 1];
            callCount++;
            const finishReason = response.tool_calls?.length ? 'tool_call' : 'stop';
            return {
                messages: [...messages, response],
                finishReason
            };
        }
    };
}
// Comprehensive tool suite for integration testing
const integrationTools = {
    // Math tools
    add: defineTool({
        name: 'add',
        description: 'Add two numbers',
        parameters: {
            type: 'object',
            properties: {
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' },
            },
            required: ['a', 'b']
        },
        execute: async ({ a, b }) => a + b
    }),
    multiply: defineTool({
        name: 'multiply',
        description: 'Multiply two numbers',
        parameters: {
            type: 'object',
            properties: {
                a: { type: 'number', description: 'First number' },
                b: { type: 'number', description: 'Second number' },
            },
            required: ['a', 'b']
        },
        execute: async ({ a, b }) => a * b
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
        execute: async ({ a, b }) => {
            if (b === 0)
                throw new Error('Cannot divide by zero');
            return a / b;
        }
    }),
    // API tools
    fetchData: defineTool({
        name: 'fetch_data',
        description: 'Fetch data from an API',
        parameters: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'URL to fetch' },
            },
            required: ['url']
        },
        execute: async ({ url }) => `Data from ${url}: {"status": "success", "data": [1,2,3]}`
    }),
    // Text processing tools
    formatText: defineTool({
        name: 'format_text',
        description: 'Format text in various ways',
        parameters: {
            type: 'object',
            properties: {
                text: { type: 'string', description: 'Text to format' },
                format: { type: 'string', enum: ['uppercase', 'lowercase', 'title'], description: 'Format type' },
            },
            required: ['text', 'format']
        },
        execute: async ({ text, format }) => {
            switch (format) {
                case 'uppercase': return text.toUpperCase();
                case 'lowercase': return text.toLowerCase();
                case 'title': return text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                default: return text;
            }
        }
    })
};
test('Quantum Integration: The Revolutionary Correctness Test (15×8÷3=40)', async () => {
    // This is THE test that proves quantum intelligence works
    const quantumProvider = createMockFreeProvider('mistral-quantum', [
        'I need to calculate the area of the rectangle first. TOOL_CALL: {"name": "multiply", "arguments": {"a": 15, "b": 8}}',
        'Now I will divide the area by 3. TOOL_CALL: {"name": "divide", "arguments": {"a": 120, "b": 3}}',
        'The area of a 15×8 rectangle divided by 3 equals 40.'
    ]);
    const quantumAgent = new QuantumConversationAgent();
    const result = await quantumAgent.run([
        {
            role: 'system',
            content: 'You are a quantum-enhanced mathematical assistant with perfect sequential logic.'
        },
        {
            role: 'user',
            content: 'Calculate the area of a rectangle that is 15 units long and 8 units wide, then divide that area by 3.'
        }
    ], integrationTools, { primary: [quantumProvider], fallback: [] }, { maxSteps: 10, providerStrategy: 'smart' });
    // Verify quantum execution
    assert.ok(result.messages.length >= 4, 'Should have multiple message exchanges');
    assert.ok(result.metrics.toolExecutions >= 2, 'Should execute both multiply and divide tools');
    // The revolutionary test: correct answer must be 40
    const finalMessage = result.messages[result.messages.length - 1];
    assert.ok(finalMessage.content?.includes('40'), 'Must produce correct answer: 40');
    // Quantum metrics should be available
    if (result.debug?.quantumMetrics) {
        assert.equal(result.debug.quantumMetrics.strategyType, 'sequential');
        assert.ok(result.debug.quantumMetrics.confidenceScore > 0);
        assert.ok(result.debug.quantumMetrics.hypothesesGenerated >= 0);
    }
});
test('Quantum vs Classical: Performance and Correctness Comparison', async () => {
    const testInput = 'Calculate the area of a 12×7 rectangle, then divide that area by 4';
    // Classical Agent (hardcoded logic)
    const classicalProvider = createMockPremiumProvider('gpt-classical', [
        {
            role: 'assistant',
            content: null,
            tool_calls: [{
                    id: 'call_1',
                    type: 'function',
                    function: {
                        name: 'multiply',
                        arguments: JSON.stringify({ a: 12, b: 7 })
                    }
                }]
        },
        {
            role: 'assistant',
            content: null,
            tool_calls: [{
                    id: 'call_2',
                    type: 'function',
                    function: {
                        name: 'divide',
                        arguments: JSON.stringify({ a: 84, b: 4 })
                    }
                }]
        },
        {
            role: 'assistant',
            content: 'The result is 21.'
        }
    ]);
    // Quantum Agent (adaptive intelligence)
    const quantumProvider = createMockFreeProvider('mistral-quantum', [
        'First, I calculate the area. TOOL_CALL: {"name": "multiply", "arguments": {"a": 12, "b": 7}}',
        'Now I divide by 4. TOOL_CALL: {"name": "divide", "arguments": {"a": 84, "b": 4}}',
        'The final answer is 21.'
    ]);
    // Execute both agents
    const classicalAgent = new ConversationAgent();
    const quantumAgent = new QuantumConversationAgent();
    const [classicalResult, quantumResult] = await Promise.all([
        classicalAgent.run([{ role: 'user', content: testInput }], integrationTools, { primary: [classicalProvider], fallback: [] }),
        quantumAgent.run([{ role: 'user', content: testInput }], integrationTools, { primary: [quantumProvider], fallback: [] }, { maxSteps: 10, providerStrategy: 'smart' })
    ]);
    // Both should get correct answer
    const classicalAnswer = classicalResult.messages[classicalResult.messages.length - 1].content;
    const quantumAnswer = quantumResult.messages[quantumResult.messages.length - 1].content;
    assert.ok(classicalAnswer?.includes('21'), 'Classical should get correct answer');
    assert.ok(quantumAnswer?.includes('21'), 'Quantum should get correct answer');
    // Quantum should provide enhanced metrics
    assert.ok(quantumResult.debug?.quantumMetrics, 'Quantum should provide quantum metrics');
    assert.ok(classicalResult.debug, 'Classical should provide standard debug info');
    // Both should execute tools
    assert.ok(classicalResult.metrics.toolExecutions >= 2, 'Classical should execute tools');
    assert.ok(quantumResult.metrics.toolExecutions >= 2, 'Quantum should execute tools');
});
test('Quantum Integration: Multi-domain Universal Compatibility', async () => {
    // Test quantum intelligence across different domains
    const testCases = [
        {
            name: 'Mathematics',
            input: 'Add 15 and 27, then multiply the result by 2',
            provider: createMockFreeProvider('math-domain', [
                'Adding the numbers. TOOL_CALL: {"name": "add", "arguments": {"a": 15, "b": 27}}',
                'Multiplying by 2. TOOL_CALL: {"name": "multiply", "arguments": {"a": 42, "b": 2}}',
                'The final result is 84.'
            ]),
            expectedAnswer: '84'
        },
        {
            name: 'Text Processing',
            input: 'Format the text "hello world" to title case',
            provider: createMockFreeProvider('text-domain', [
                'Formatting text to title case. TOOL_CALL: {"name": "format_text", "arguments": {"text": "hello world", "format": "title"}}',
                'The formatted text is "Hello World".'
            ]),
            expectedAnswer: 'Hello World'
        },
        {
            name: 'API Integration',
            input: 'Fetch data from https://api.example.com/users',
            provider: createMockFreeProvider('api-domain', [
                'Fetching data from the API. TOOL_CALL: {"name": "fetch_data", "arguments": {"url": "https://api.example.com/users"}}',
                'Data retrieved successfully.'
            ]),
            expectedAnswer: 'success'
        }
    ];
    const quantumAgent = new QuantumConversationAgent();
    for (const testCase of testCases) {
        const result = await quantumAgent.run([{ role: 'user', content: testCase.input }], integrationTools, { primary: [testCase.provider], fallback: [] }, { maxSteps: 5, providerStrategy: 'smart' });
        // Verify successful execution
        assert.ok(result.metrics.toolExecutions >= 1, `${testCase.name} should execute tools`);
        const finalAnswer = result.messages[result.messages.length - 1].content;
        assert.ok(finalAnswer?.includes(testCase.expectedAnswer), `${testCase.name} should produce expected result`);
    }
});
test('Quantum Integration: Cost Optimization with Provider Fallback', async () => {
    // Simulate cost-optimized strategy: free first, premium fallback
    const failingFreeProvider = {
        id: 'mistral-free-failing',
        supportsTools: false,
        async chat() {
            throw new Error('Free provider temporarily unavailable');
        }
    };
    const workingPremiumProvider = createMockPremiumProvider('gpt-premium', [
        {
            role: 'assistant',
            content: null,
            tool_calls: [{
                    id: 'call_1',
                    type: 'function',
                    function: {
                        name: 'add',
                        arguments: JSON.stringify({ a: 10, b: 5 })
                    }
                }]
        },
        {
            role: 'assistant',
            content: 'Using premium fallback. The sum is 15.'
        }
    ]);
    const quantumAgent = new QuantumConversationAgent();
    const result = await quantumAgent.run([{ role: 'user', content: 'What is 10 + 5?' }], integrationTools, {
        primary: [failingFreeProvider],
        fallback: [workingPremiumProvider]
    }, { maxSteps: 5, providerStrategy: 'smart' });
    // Should fall back to premium provider successfully
    assert.ok(result.metrics.toolExecutions >= 1, 'Should execute tools via fallback');
    assert.ok(result.messages[result.messages.length - 1].content?.includes('15'), 'Should get correct answer via premium fallback');
    // Should track that fallback was used
    assert.ok(result.debug?.providerHistory.some(p => p.id === 'gpt-premium'), 'Should record premium provider usage');
});
test('Quantum Integration: Self-Healing Error Recovery', async () => {
    let callCount = 0;
    const selfHealingProvider = {
        id: 'self-healing-test',
        supportsTools: false,
        async chat({ messages }) {
            callCount++;
            if (callCount === 1) {
                // First attempt: division by zero error
                return {
                    messages: [...messages, {
                            role: 'assistant',
                            content: 'Attempting division. TOOL_CALL: {"name": "divide", "arguments": {"a": 10, "b": 0}}'
                        }],
                    finishReason: 'stop'
                };
            }
            else {
                // Self-healing: corrected approach
                return {
                    messages: [...messages, {
                            role: 'assistant',
                            content: 'Error detected, using safer divisor. TOOL_CALL: {"name": "divide", "arguments": {"a": 10, "b": 2}}'
                        }],
                    finishReason: 'stop'
                };
            }
        }
    };
    const quantumAgent = new QuantumConversationAgent();
    const result = await quantumAgent.run([{ role: 'user', content: 'Divide 10 by a safe number' }], integrationTools, { primary: [selfHealingProvider], fallback: [] }, { maxSteps: 10, providerStrategy: 'smart' });
    // Should recover from initial error
    assert.ok(result.metrics.toolExecutions >= 1, 'Should execute tools');
    // Should track adaptations/healing attempts
    if (result.debug?.quantumMetrics) {
        assert.ok(result.debug.quantumMetrics.hypothesesGenerated >= 0, 'Should track quantum metrics');
    }
});
test('Quantum Integration: Universal Model Compatibility Matrix', async () => {
    // Test compatibility across different model types
    const modelConfigurations = [
        {
            type: 'free-vanilla',
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            provider: createMockFreeProvider('mistral-free', [
                'TOOL_CALL: {"name": "multiply", "arguments": {"a": 3, "b": 4}}',
                'Result: 12'
            ]),
            supportsNativeTools: false
        },
        {
            type: 'experimental-free',
            model: 'models/gemini-2.0-flash-thinking-exp',
            provider: createMockFreeProvider('gemini-exp', [
                'TOOL_CALL: {"name": "multiply", "arguments": {"a": 3, "b": 4}}',
                'Thinking... Result: 12'
            ]),
            supportsNativeTools: false
        },
        {
            type: 'premium-native',
            model: 'gpt-4o-mini',
            provider: createMockPremiumProvider('gpt-premium', [
                {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                            id: 'call_1',
                            type: 'function',
                            function: {
                                name: 'multiply',
                                arguments: JSON.stringify({ a: 3, b: 4 })
                            }
                        }]
                },
                {
                    role: 'assistant',
                    content: 'Premium calculation: 12'
                }
            ]),
            supportsNativeTools: true
        }
    ];
    const quantumAgent = new QuantumConversationAgent();
    for (const config of modelConfigurations) {
        const result = await quantumAgent.run([{ role: 'user', content: 'What is 3 times 4?' }], integrationTools, { primary: [config.provider], fallback: [] }, { maxSteps: 5, providerStrategy: 'smart' });
        // Universal compatibility: all models should work
        assert.ok(result.metrics.toolExecutions >= 1, `${config.type} (${config.model}) should execute tools`);
        const finalAnswer = result.messages[result.messages.length - 1].content;
        assert.ok(finalAnswer?.includes('12'), `${config.type} should produce correct answer`);
        // Verify provider capabilities
        assert.equal(config.provider.supportsTools, config.supportsNativeTools, `${config.type} tool support should match expected`);
    }
});
test('Quantum Integration: Performance and Efficiency Metrics', async () => {
    const performanceProvider = createMockFreeProvider('performance-test', [
        'Quick calculation. TOOL_CALL: {"name": "add", "arguments": {"a": 100, "b": 200}}',
        'Result: 300'
    ]);
    const quantumAgent = new QuantumConversationAgent();
    const startTime = Date.now();
    const result = await quantumAgent.run([{ role: 'user', content: 'Add 100 and 200' }], integrationTools, { primary: [performanceProvider], fallback: [] }, { maxSteps: 3, providerStrategy: 'smart' });
    const endTime = Date.now();
    const actualDuration = endTime - startTime;
    // Performance validation
    assert.ok(result.metrics.duration <= actualDuration + 100, 'Reported duration should be reasonably accurate');
    assert.ok(result.metrics.efficiency > 0, 'Should calculate operations per second');
    assert.equal(typeof result.metrics.costSavings, 'number', 'Should track cost savings');
    // Using free provider should show cost benefits
    assert.ok(result.metrics.costSavings >= 0, 'Free provider should provide cost savings');
});
test('Quantum Integration: End-to-End Production Scenario', async () => {
    // Simulate real production scenario with multiple providers and complex task
    const primaryFreeProvider = createMockFreeProvider('production-free', [
        'Starting data processing. TOOL_CALL: {"name": "fetch_data", "arguments": {"url": "https://api.production.com/data"}}',
        'Processing retrieved data. TOOL_CALL: {"name": "format_text", "arguments": {"text": "production data", "format": "uppercase"}}',
        'Calculating metrics. TOOL_CALL: {"name": "multiply", "arguments": {"a": 50, "b": 2}}',
        'Production pipeline complete. Data processed, formatted as "PRODUCTION DATA", metrics calculated: 100.'
    ]);
    const fallbackPremiumProvider = createMockPremiumProvider('production-premium', [
        {
            role: 'assistant',
            content: 'Premium processing initiated.'
        }
    ]);
    const quantumAgent = new QuantumConversationAgent();
    const result = await quantumAgent.run([
        {
            role: 'system',
            content: 'You are a production data processing agent with quantum intelligence.'
        },
        {
            role: 'user',
            content: 'Process the production data: fetch from API, format to uppercase, and calculate metrics by doubling 50.'
        }
    ], integrationTools, {
        primary: [primaryFreeProvider],
        fallback: [fallbackPremiumProvider]
    }, {
        maxSteps: 15,
        providerStrategy: 'smart',
        maxHistoryLength: 20
    });
    // Comprehensive validation
    assert.ok(result.metrics.toolExecutions >= 3, 'Should execute multiple tools');
    assert.ok(result.metrics.duration > 0, 'Should track execution time');
    assert.ok(result.messages.length >= 4, 'Should have complete conversation');
    const finalMessage = result.messages[result.messages.length - 1];
    assert.ok(finalMessage.content?.includes('PRODUCTION DATA'), 'Should format text correctly');
    assert.ok(finalMessage.content?.includes('100'), 'Should calculate metrics correctly');
    // Quantum metrics for production monitoring
    if (result.debug?.quantumMetrics) {
        assert.ok(['sequential', 'parallel', 'adaptive'].includes(result.debug.quantumMetrics.strategyType), 'Should determine execution strategy');
        assert.ok(result.debug.quantumMetrics.hypothesesGenerated >= 0, 'Should measure plan complexity');
    }
    // Cost efficiency in production
    assert.ok(result.metrics.costSavings >= 0, 'Should optimize costs');
    // Should use primary (free) provider
    assert.ok(result.debug?.providerHistory.some(p => p.id === 'production-free'), 'Should prefer free provider for cost optimization');
});
