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
