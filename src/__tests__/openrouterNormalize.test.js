import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.OPENROUTER_API_KEY = 'dummy';
const { normalizeOpenRouterJSON } = await import('../providers/openrouter.js');
// Valid JSON should be returned as-is
test('returns JSON unchanged when valid', () => {
    const json = '{"a":1,"b":2}';
    assert.equal(normalizeOpenRouterJSON(json), json);
});
// Repeated object issue seen in OpenRouter responses
test('deduplicates repeated JSON objects', () => {
    const malformed = '{"a":1}{"a":1}';
    assert.equal(normalizeOpenRouterJSON(malformed), '{"a":1}');
});
// Extract JSON object from noisy text
test('extracts JSON from surrounding text', () => {
    const malformed = 'noise {"a":1,"b":2} trailing';
    assert.equal(normalizeOpenRouterJSON(malformed), '{"a":1,"b":2}');
});
// Manual key/value extraction when braces are missing
test('handles quoted key value pairs without braces', () => {
    const malformed = 'random "a":1 "b":2';
    assert.equal(normalizeOpenRouterJSON(malformed), '{"a":1,"b":2}');
});
// No JSON content should return null
test('returns null for unparseable input', () => {
    const malformed = 'totally invalid';
    assert.equal(normalizeOpenRouterJSON(malformed), null);
});
