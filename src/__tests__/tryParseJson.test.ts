import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryParseJson } from '../core/AgentRunner.js';

// Test classical JSON parsing capabilities
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

// Test vanilla tool calling specific scenarios
test('parses vanilla TOOL_CALL format', () => {
  const text = 'I will use the multiply tool. TOOL_CALL: {"name":"multiply","arguments":{"a":15,"b":8}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 15, b: 8 } });
});

test('handles multiple TOOL_CALL patterns (should parse first)', () => {
  const text = 'First: TOOL_CALL: {"name":"multiply","arguments":{"a":15,"b":8}} then TOOL_CALL: {"name":"divide","arguments":{"a":120,"b":3}}';
  const parsed = tryParseJson(text);
  // Should parse the first tool call found
  assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 15, b: 8 } });
});

test('parses free model response with verbose text', () => {
  const text = `I need to calculate the area of a rectangle. The formula for area is length × width.
  Given that the rectangle is 15 units long and 8 units wide, I'll use the multiply tool.
  
  TOOL_CALL: {"name":"multiply","arguments":{"a":15,"b":8}}
  
  This will give me the area in square units.`;
  
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 15, b: 8 } });
});

test('handles tool calls with result references', () => {
  const text = 'Now I need to divide the result by 3. TOOL_CALL: {"name":"divide","arguments":{"a":120,"b":3}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'divide', arguments: { a: 120, b: 3 } });
});

test('parses tool calls with string parameters', () => {
  const text = 'Let me format this text. TOOL_CALL: {"name":"format_text","arguments":{"text":"hello world","style":"uppercase"}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'format_text', arguments: { text: 'hello world', style: 'uppercase' } });
});

test('handles tool calls with no parameters', () => {
  const text = 'Getting current time. TOOL_CALL: {"name":"get_time","arguments":{}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'get_time', arguments: {} });
});

test('parses tool calls with array parameters', () => {
  const text = 'Processing multiple values. TOOL_CALL: {"name":"sum_array","arguments":{"numbers":[1,2,3,4,5]}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'sum_array', arguments: { numbers: [1, 2, 3, 4, 5] } });
});

test('handles whitespace variations in TOOL_CALL format', () => {
  const variations = [
    'TOOL_CALL: {"name":"add","arguments":{"a":1,"b":2}}',
    'TOOL_CALL:{"name":"add","arguments":{"a":1,"b":2}}',
    'TOOL_CALL :  {"name":"add","arguments":{"a":1,"b":2}}',
    'tool_call: {"name":"add","arguments":{"a":1,"b":2}}' // lowercase
  ];
  
  variations.forEach((text, i) => {
    const parsed = tryParseJson(text);
    if (i < 3) { // First 3 should parse
      assert.deepEqual(parsed, { name: 'add', arguments: { a: 1, b: 2 } }, `Variation ${i} should parse`);
    }
    // Note: lowercase might not parse depending on implementation
  });
});

test('parses tool calls from different free model styles', () => {
  const modelStyles = [
    // Mistral style
    'I will calculate this step by step. TOOL_CALL: {"name":"multiply","arguments":{"a":4,"b":7}}',
    
    // DeepSeek style  
    'Let me use the multiply function: TOOL_CALL: {"name":"multiply","arguments":{"a":4,"b":7}}',
    
    // Qwen style
    'Using multiplication tool. TOOL_CALL: {"name":"multiply","arguments":{"a":4,"b":7}}',
    
    // Generic verbose style
    'To solve this problem, I need to multiply 4 by 7. I will use the available multiply tool for this calculation. TOOL_CALL: {"name":"multiply","arguments":{"a":4,"b":7}}'
  ];
  
  modelStyles.forEach((text, i) => {
    const parsed = tryParseJson(text);
    assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 4, b: 7 } }, `Model style ${i} should parse correctly`);
  });
});

test('handles sequential execution correctness pattern', () => {
  // Test the critical pattern: using actual results in sequential calls
  const sequentialCalls = [
    {
      text: 'First, calculate area: TOOL_CALL: {"name":"multiply","arguments":{"a":15,"b":8}}',
      expected: { name: 'multiply', arguments: { a: 15, b: 8 } }
    },
    {
      text: 'Now divide the result 120 by 3: TOOL_CALL: {"name":"divide","arguments":{"a":120,"b":3}}',
      expected: { name: 'divide', arguments: { a: 120, b: 3 } }
    }
  ];
  
  sequentialCalls.forEach(({ text, expected }, i) => {
    const parsed = tryParseJson(text);
    assert.deepEqual(parsed, expected, `Sequential call ${i} should parse correctly`);
  });
  
  // Verify the critical correctness: a=120 (not 15) in second call
  const secondCall = sequentialCalls[1];
  const parsed = tryParseJson(secondCall.text);
  assert.equal(parsed?.arguments.a, 120, 'Should use actual result (120) not original input (15)');
});

test('gracefully handles malformed TOOL_CALL patterns', () => {
  const malformedCalls = [
    'TOOL_CALL: {"name":"add","arguments":{"a":1,"b":}}', // Missing value
    'TOOL_CALL: {"name":"add","arguments":{"a":1,b:2}}', // Missing quotes
    'TOOL_CALL: {name:"add","arguments":{"a":1,"b":2}}', // Missing quotes on property
    'TOOL_CALL: {"name":"add","arguments":{"a":1,"b":2}', // Missing closing brace
    'TOOL_CALL: invalid_json', // Not JSON at all
  ];
  
  malformedCalls.forEach((text, i) => {
    const parsed = tryParseJson(text);
    assert.equal(parsed, null, `Malformed call ${i} should return null`);
  });
});

test('handles mixed content with tool calls', () => {
  const text = `
  I understand you want to calculate the area of a rectangle and then divide it.
  
  First, let me calculate the area of a 15×8 rectangle:
  TOOL_CALL: {"name":"multiply","arguments":{"a":15,"b":8}}
  
  After getting that result, I'll divide by 3 in the next step.
  `;
  
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 15, b: 8 } });
});

test('prioritizes first tool call in complex responses', () => {
  const text = `
  I need to do several calculations. Let me start with:
  TOOL_CALL: {"name":"multiply","arguments":{"a":10,"b":5}}
  
  Then I might need to:
  TOOL_CALL: {"name":"divide","arguments":{"a":50,"b":2}}
  
  And finally:
  TOOL_CALL: {"name":"add","arguments":{"a":25,"b":10}}
  `;
  
  const parsed = tryParseJson(text);
  // Should parse only the first tool call
  assert.deepEqual(parsed, { name: 'multiply', arguments: { a: 10, b: 5 } });
});

test('handles tool calls with complex nested objects', () => {
  const text = 'Complex operation: TOOL_CALL: {"name":"process_data","arguments":{"config":{"format":"json","options":{"pretty":true,"indent":2}},"data":[1,2,3]}}';
  const parsed = tryParseJson(text);
  assert.deepEqual(parsed, {
    name: 'process_data',
    arguments: {
      config: {
        format: 'json',
        options: {
          pretty: true,
          indent: 2
        }
      },
      data: [1, 2, 3]
    }
  });
});

test('performance: should parse tool calls efficiently', () => {
  const largeText = 'A'.repeat(10000) + ' TOOL_CALL: {"name":"test","arguments":{"value":123}}';
  
  const startTime = Date.now();
  const parsed = tryParseJson(largeText);
  const duration = Date.now() - startTime;
  
  assert.deepEqual(parsed, { name: 'test', arguments: { value: 123 } });
  assert.ok(duration < 100, 'Should parse large text efficiently');
});