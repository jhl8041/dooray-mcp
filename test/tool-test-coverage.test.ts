import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { toolDefinitions } from '../src/tool-registry.js';

/**
 * Tools that existed before the test rule (CONTRIBUTING.md "테스트 규칙").
 * Do not add to this list. New tools must come with a test that calls their handler.
 */
const LEGACY_TOOLS_WITHOUT_TESTS = new Set([
  'get-my-member-info',
  'get-project-list',
  'get-project',
  'get-task-list',
  'get-task',
  'create-task',
  'update-task',
  'create-task-comment',
  'get-task-comment-list',
  'update-task-comment',
  'get-milestone-list',
  'get-tag-list',
  'get-tag',
  'create-tag',
  'update-tag-group',
  'get-project-template-list',
  'get-project-template',
  'create-project-template',
  'update-project-template',
  'delete-project-template',
  'get-project-member-list',
  'get-project-member-group-list',
  'get-project-workflow-list',
  'upload-attachment',
  'get-attachment-list',
  'get-attachment-metadata',
  'download-attachment',
  'delete-attachment',
  'get-drive-list',
  'get-drive-file-list',
  'get-drive-file-meta',
  'create-drive-folder',
  'rename-drive-file',
  'move-drive-file',
  'copy-drive-file',
  'delete-drive-file',
  'upload-drive-file',
  'download-drive-file',
  'update-drive-file',
  'get-wiki-list',
  'get-wiki-page-list',
  'get-wiki-page',
  'create-wiki-page',
  'update-wiki-page',
  'get-wiki-page-comment-list',
  'get-wiki-page-comment',
  'create-wiki-page-comment',
  'update-wiki-page-comment',
  'delete-wiki-page-comment',
  'upload-wiki-page-file',
  'download-wiki-page-file',
  'delete-wiki-page-file',
  'upload-wiki-file',
  'download-wiki-attach-file',
]);

const testDir = __dirname;
const thisFile = path.basename(__filename);

function readTestSources(): string {
  return fs.readdirSync(testDir)
    .filter(file => file.endsWith('.test.ts') && file !== thisFile)
    .map(file => fs.readFileSync(path.join(testDir, file), 'utf8'))
    .join('\n');
}

test('every new tool has a test that uses its handler', () => {
  const sources = readTestSources();
  const missing = toolDefinitions
    .filter(({ tool }) => !LEGACY_TOOLS_WITHOUT_TESTS.has(tool.name))
    .filter(({ handler }) => !new RegExp(`\\b${handler.name}\\b`).test(sources))
    .map(({ tool, handler }) => `${tool.name} (${handler.name})`);

  assert.deepEqual(missing, [], `Add a test under test/ that calls these handlers: ${missing.join(', ')}`);
});

test('legacy list only names registered tools', () => {
  const registered = new Set(toolDefinitions.map(({ tool }) => tool.name));
  const unknown = [...LEGACY_TOOLS_WITHOUT_TESTS].filter(name => !registered.has(name));
  assert.deepEqual(unknown, [], 'Remove renamed or deleted tools from LEGACY_TOOLS_WITHOUT_TESTS');
});
