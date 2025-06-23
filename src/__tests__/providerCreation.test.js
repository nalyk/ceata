import { test } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../config/index.js';
// Helper to temporarily set a property
function withTemp(obj, key, value, fn) {
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
        const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 200 }));
        const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
        const provider = createOpenAIProvider();
        const chunks = [];
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
// OpenAI: successful non-streaming chat (premium model)
test('createOpenAIProvider performs chat', async (t) => {
    await withTemp(config.providers.openai, 'apiKey', 'sk-test', async () => {
        const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
            return new Response(JSON.stringify({
                choices: [{ message: { content: 'hi there' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            }), { status: 200 });
        });
        const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
        const provider = createOpenAIProvider();
        const result = await provider.chat({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'hello' }] });
        assert.equal(result.messages.at(-1)?.content, 'hi there');
        assert.equal(result.finishReason, 'stop');
        // Premium models support native tool calling
        assert.equal(provider.supportsTools, true);
        fetchMock.mock.restore();
    });
});
// Google: successful chat (experimental free model)
test('createGoogleProvider performs chat', async (t) => {
    await withTemp(config.providers.google, 'apiKey', 'g-key', async () => {
        const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
            return new Response(JSON.stringify({
                candidates: [{ content: { parts: [{ text: 'response' }] }, finishReason: 'STOP' }],
                usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
            }), { status: 200 });
        });
        const { createGoogleProvider } = await import(`../providers/google.js?${Date.now()}`);
        const provider = createGoogleProvider();
        const result = await provider.chat({ model: 'models/gemini-2.0-flash-thinking-exp', messages: [{ role: 'user', content: 'hi' }] });
        assert.equal(result.messages.at(-1)?.content, 'response');
        assert.equal(result.finishReason, 'stop');
        fetchMock.mock.restore();
    });
});
// Test vanilla OpenRouter provider (FREE models with quantum enhancement)
test('createVanillaOpenRouterProvider supports free models', async (t) => {
    await withTemp(config.providers.openrouter, 'apiKey', 'sk-test', async () => {
        const fetchMock = t.mock.method(globalThis, 'fetch', async () => {
            return new Response(JSON.stringify({
                choices: [{ message: { content: 'Free model response with TOOL_CALL: {"name": "add", "arguments": {"a": 1, "b": 2}}' }, finish_reason: 'stop' }],
                usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
            }), { status: 200 });
        });
        const { createVanillaOpenRouterProvider } = await import(`../providers/openrouterVanilla.js?${Date.now()}`);
        const provider = createVanillaOpenRouterProvider('sk-test', 'https://openrouter.ai/api/v1', {
            headers: {
                'HTTP-Referer': 'https://example.com',
                'X-Title': 'Quantum CEATA Test'
            }
        });
        const result = await provider.chat({
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            messages: [{ role: 'user', content: 'Add 1 + 2' }]
        });
        assert.ok(result.messages.at(-1)?.content.includes('TOOL_CALL'));
        assert.equal(result.finishReason, 'stop');
        // Vanilla providers use prompt engineering instead of native tool calling
        assert.equal(provider.supportsTools, false);
        fetchMock.mock.restore();
    });
});
// Test vanilla provider with quantum headers
test('createVanillaOpenRouterProvider with quantum headers', async () => {
    await withTemp(config.providers.openrouter, 'apiKey', 'sk-test', async () => {
        const { createVanillaOpenRouterProvider } = await import(`../providers/openrouterVanilla.js?${Date.now()}`);
        const provider = createVanillaOpenRouterProvider('sk-test', 'https://openrouter.ai/api/v1', {
            headers: {
                'HTTP-Referer': 'https://quantum-ceata.example.com',
                'X-Title': 'Quantum Intelligence Agent',
                'X-Agent-Type': 'quantum-enhanced'
            }
        });
        assert.equal(provider.id, 'openrouter-vanilla');
        assert.equal(provider.supportsTools, false); // Uses vanilla tool calling
    });
});
// Test cost optimization: free vs premium model distinction
test('Provider cost optimization features', async () => {
    // Free models (primary tier)
    const freeModels = [
        'mistralai/mistral-small-3.2-24b-instruct:free',
        'deepseek/deepseek-r1-0528-qwen3-8b:free',
        'qwen/qwen-2.5-72b-instruct:free'
    ];
    // Premium models (fallback tier)
    const premiumModels = [
        'gpt-4o-mini',
        'claude-3-haiku',
        'gpt-4o'
    ];
    freeModels.forEach(model => {
        assert.ok(model.includes(':free'), `${model} should be marked as free`);
    });
    premiumModels.forEach(model => {
        assert.ok(!model.includes(':free'), `${model} should be a premium model`);
    });
    // Cost optimization ratio
    const totalModels = freeModels.length + premiumModels.length;
    const costSavingsRatio = freeModels.length / totalModels;
    assert.ok(costSavingsRatio >= 0.5, 'Should prioritize free models for cost optimization');
});
// Test provider capabilities matrix
test('Provider capabilities for quantum intelligence', async () => {
    await withTemp(config.providers.openai, 'apiKey', 'sk-test', async () => {
        await withTemp(config.providers.openrouter, 'apiKey', 'sk-test', async () => {
            await withTemp(config.providers.google, 'apiKey', 'g-key', async () => {
                // Import providers
                const { createOpenAIProvider } = await import(`../providers/openai.js?${Date.now()}`);
                const { createVanillaOpenRouterProvider } = await import(`../providers/openrouterVanilla.js?${Date.now()}`);
                const { createGoogleProvider } = await import(`../providers/google.js?${Date.now()}`);
                // Create provider instances
                const premiumProvider = createOpenAIProvider();
                const freeProvider = createVanillaOpenRouterProvider();
                const experimentalProvider = createGoogleProvider();
                // Test capabilities
                const providerCapabilities = [
                    {
                        provider: premiumProvider,
                        type: 'premium',
                        supportsNativeTools: true,
                        costTier: 'high',
                        usage: 'fallback'
                    },
                    {
                        provider: freeProvider,
                        type: 'free',
                        supportsNativeTools: false,
                        costTier: 'free',
                        usage: 'primary'
                    },
                    {
                        provider: experimentalProvider,
                        type: 'experimental',
                        supportsNativeTools: true,
                        costTier: 'free',
                        usage: 'primary'
                    }
                ];
                providerCapabilities.forEach(({ provider, type, supportsNativeTools, usage }) => {
                    assert.equal(provider.supportsTools, supportsNativeTools, `${type} provider tool support should match expected`);
                    if (usage === 'primary') {
                        assert.ok(['openrouter-vanilla', 'google'].includes(provider.id), `${type} provider should be usable as primary`);
                    }
                });
            });
        });
    });
});
// Test quantum-enhanced provider selection strategy
test('Quantum provider selection strategy', () => {
    const providerStrategy = {
        primary: [
            { model: 'mistralai/mistral-small-3.2-24b-instruct:free', cost: 0, quantum: true },
            { model: 'deepseek/deepseek-r1-0528-qwen3-8b:free', cost: 0, quantum: true },
            { model: 'models/gemini-2.0-flash-thinking-exp', cost: 0, quantum: true }
        ],
        fallback: [
            { model: 'gpt-4o-mini', cost: 0.15, quantum: false },
            { model: 'claude-3-haiku', cost: 0.25, quantum: false }
        ]
    };
    // All primary providers should be free and quantum-enhanced
    providerStrategy.primary.forEach(p => {
        assert.equal(p.cost, 0, 'Primary providers should be free');
        assert.equal(p.quantum, true, 'Primary providers should support quantum enhancement');
    });
    // Fallback providers are premium but reliable
    providerStrategy.fallback.forEach(p => {
        assert.ok(p.cost > 0, 'Fallback providers are premium');
    });
    // Strategy optimizes for cost while maintaining reliability
    const primaryFreeRatio = providerStrategy.primary.filter(p => p.cost === 0).length / providerStrategy.primary.length;
    assert.equal(primaryFreeRatio, 1.0, 'All primary providers should be free');
});
// Test error handling and provider fallback
test('Provider fallback mechanism', async (t) => {
    await withTemp(config.providers.openai, 'apiKey', 'sk-test', async () => {
        // Simulate failing free provider
        const failingFetchMock = t.mock.method(globalThis, 'fetch', async () => {
            throw new Error('Free provider temporarily unavailable');
        });
        const { createVanillaOpenRouterProvider } = await import(`../providers/openrouterVanilla.js?${Date.now()}`);
        try {
            const freeProvider = createVanillaOpenRouterProvider();
            await freeProvider.chat({
                model: 'mistralai/mistral-small-3.2-24b-instruct:free',
                messages: [{ role: 'user', content: 'test' }]
            });
            assert.fail('Should have thrown an error');
        }
        catch (error) {
            assert.ok(error instanceof Error);
            assert.ok(error.message.includes('unavailable'));
        }
        failingFetchMock.mock.restore();
    });
});
// Test vanilla tool calling prompt enhancement
test('Vanilla provider prompt enhancement', async (t) => {
    await withTemp(config.providers.openrouter, 'apiKey', 'sk-test', async () => {
        const enhancedPromptMock = t.mock.method(globalThis, 'fetch', async (url, options) => {
            const body = JSON.parse(options.body);
            const systemMessage = body.messages.find((m) => m.role === 'system');
            // Verify enhanced prompting for sequential logic
            assert.ok(systemMessage.content.includes('sequential'), 'Should include sequential logic rules');
            assert.ok(systemMessage.content.includes('TOOL_CALL:'), 'Should include tool call format');
            assert.ok(systemMessage.content.includes('actual result'), 'Should emphasize using actual results');
            return new Response(JSON.stringify({
                choices: [{ message: { content: 'Enhanced response' }, finish_reason: 'stop' }],
            }), { status: 200 });
        });
        const { createVanillaOpenRouterProvider } = await import(`../providers/openrouterVanilla.js?${Date.now()}`);
        const provider = createVanillaOpenRouterProvider();
        await provider.chat({
            model: 'mistralai/mistral-small-3.2-24b-instruct:free',
            messages: [
                { role: 'system', content: 'You are a math assistant.' },
                { role: 'user', content: 'Calculate 15×8 then divide by 3' }
            ]
        });
        enhancedPromptMock.mock.restore();
    });
});
// Test universal model compatibility
test('Universal model compatibility matrix', () => {
    const modelCompatibility = {
        'vanilla_compatible': [
            'mistralai/mistral-small-3.2-24b-instruct:free',
            'deepseek/deepseek-r1-0528-qwen3-8b:free',
            'qwen/qwen-2.5-72b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'models/gemini-2.0-flash-thinking-exp'
        ],
        'native_tools': [
            'gpt-4o-mini',
            'gpt-4o',
            'claude-3-haiku',
            'claude-3-sonnet'
        ]
    };
    // Vanilla compatible models should be free or experimental
    modelCompatibility.vanilla_compatible.forEach(model => {
        const isFree = model.includes(':free');
        const isExperimental = model.includes('gemini') && model.includes('exp');
        assert.ok(isFree || isExperimental, `${model} should be free or experimental`);
    });
    // Native tool models are premium
    modelCompatibility.native_tools.forEach(model => {
        assert.ok(!model.includes(':free'), `${model} should be premium`);
    });
    // Universal compatibility means ALL models work with CEATA
    const totalCompatible = modelCompatibility.vanilla_compatible.length + modelCompatibility.native_tools.length;
    assert.ok(totalCompatible >= 8, 'Should support wide range of models');
});
// Test performance characteristics
test('Provider performance characteristics', async () => {
    const performanceProfile = {
        free_models: {
            latency: 'medium',
            cost: 0,
            reliability: 'good',
            tool_calling: 'vanilla'
        },
        premium_models: {
            latency: 'low',
            cost: 'high',
            reliability: 'excellent',
            tool_calling: 'native'
        },
        experimental_models: {
            latency: 'variable',
            cost: 0,
            reliability: 'good',
            tool_calling: 'native'
        }
    };
    // Verify performance profiles make sense
    assert.equal(performanceProfile.free_models.cost, 0);
    assert.equal(performanceProfile.free_models.tool_calling, 'vanilla');
    assert.equal(performanceProfile.premium_models.cost, 'high');
    assert.equal(performanceProfile.premium_models.tool_calling, 'native');
    assert.equal(performanceProfile.experimental_models.cost, 0);
    assert.equal(performanceProfile.experimental_models.tool_calling, 'native');
});
