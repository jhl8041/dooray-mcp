import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { toolDefinitions, tools, getToolAnnotations } from '../src/tool-registry.js';

test('tool names are unique', () => {
  const names = toolDefinitions.map(({ tool }) => tool.name);
  assert.equal(new Set(names).size, names.length);
});

test('every tool lists its own annotations', () => {
  assert.equal(tools.length, toolDefinitions.length);
  for (const tool of tools) {
    assert.deepEqual(tool.annotations, getToolAnnotations(tool.name));
  }
});

// inputSchema is hand-written next to the zod schema, so keep the two from drifting apart
for (const { tool, schema } of toolDefinitions) {
  test(`${tool.name}: inputSchema matches zod schema`, () => {
    const generated = zodToJsonSchema(schema, { $refStrategy: 'none' }) as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    const declared = tool.inputSchema as { properties?: Record<string, unknown>; required?: string[] };

    assert.deepEqual(
      Object.keys(declared.properties || {}).sort(),
      Object.keys(generated.properties || {}).sort(),
      'properties differ'
    );
    assert.deepEqual([...(declared.required || [])].sort(), [...(generated.required || [])].sort(), 'required differs');
  });
}

test('annotations follow the tool name prefix', () => {
  assert.equal(getToolAnnotations('get-task').readOnlyHint, true);
  assert.equal(getToolAnnotations('delete-attachment').destructiveHint, true);
  assert.equal(getToolAnnotations('update-task').destructiveHint, true);
  assert.equal(getToolAnnotations('create-task').destructiveHint, false);
  assert.equal(getToolAnnotations('create-task').readOnlyHint, false);
});
