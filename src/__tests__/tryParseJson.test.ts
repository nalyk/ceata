import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryParseJson } from '../core/AgentRunner.js';

test('parses fenced JSON blocks', () => {
  const text = 'Here you go: ```json\n{"name":"add","arguments":{"a":1,"b":2}}\n```';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'add', arguments: { a: 1, b: 2 } });
});

test('parses unfenced JSON blocks', () => {
  const text = 'Use the tool {"name":"add","arguments":{"a":3,"b":4}} now.';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'add', arguments: { a: 3, b: 4 } });
});

test('handles nested braces', () => {
  const text = 'Noise {"name":"add","arguments":{"a":5,"b":{"c":6}}} end';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'add', arguments: { a: 5, b: { c: 6 } } });
});

test('ignores escaped fenced blocks', () => {
  const text = 'Escaped \\```json\n{"name":"add","arguments":{"a":1}}\n```';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'add', arguments: { a: 1 } });
});

test('returns null for malformed JSON', () => {
  const text = 'bad {"name":"add","arguments": { a: } } text';
  const parsed = tryParseJson(text);
  assert.equal(parsed, null);
});
