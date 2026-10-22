import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createCaptureClient } from './helpers/capture-client.js';
import { getClient } from '../src/api/client.js';
import { getTaskCommentHandler } from '../src/tools/projects/get-task-comment.js';
import { deleteTaskCommentHandler } from '../src/tools/projects/delete-task-comment.js';
import { downloadAllAttachmentsHandler } from '../src/tools/projects/download-all-attachments.js';
import { updateWikiPageBodyHandler } from '../src/tools/wiki/update-wiki-page-body.js';
import { moveWikiPageHandler } from '../src/tools/wiki/move-wiki-page.js';
import { deleteWikiPageHandler } from '../src/tools/wiki/delete-wiki-page.js';

function parseText(result: { content: Array<{ type: string; text?: string }> }) {
  return JSON.parse(result.content[0].text || '');
}

test('get-task-comment reads one comment', async () => {
  const requests = createCaptureClient({ id: 'c1', body: { mimeType: 'text/x-markdown', content: '확인' } });
  const result = await getTaskCommentHandler({ projectId: 'p1', taskId: 't1', commentId: 'c1' });

  assert.equal(parseText(result).id, 'c1');
  assert.deepEqual(requests.map(r => `${r.method} ${r.url}`), ['GET /project/v1/projects/p1/posts/t1/logs/c1']);
});

test('delete-task-comment deletes one comment', async () => {
  const requests = createCaptureClient();
  const result = await deleteTaskCommentHandler({ projectId: 'p1', taskId: 't1', commentId: 'c1' });

  assert.equal(result.isError, undefined);
  assert.deepEqual(requests.map(r => `${r.method} ${r.url}`), ['DELETE /project/v1/projects/p1/posts/t1/logs/c1']);
});

test('update-wiki-page-body replaces text through the content endpoint', async () => {
  const requests = createCaptureClient(request =>
    request.method === 'GET' ? { id: 'pg1', subject: '배포', body: { mimeType: 'text/x-markdown', content: 'v1.2 배포' } } : null
  );
  const result = await updateWikiPageBodyHandler({ wikiId: 'w1', pageId: 'pg1', oldText: 'v1.2', newText: 'v1.3' });

  assert.equal(parseText(result).replacedCount, 1);
  const put = requests.find(r => r.method === 'PUT');
  assert.equal(put?.url, '/wiki/v1/wikis/w1/pages/pg1/content');
  assert.deepEqual(put?.data, { body: { mimeType: 'text/x-markdown', content: 'v1.3 배포' } });
});

test('update-wiki-page-body does not write when oldText is ambiguous', async () => {
  const requests = createCaptureClient({ id: 'pg1', body: { mimeType: 'text/x-markdown', content: 'TODO TODO' } });
  const result = await updateWikiPageBodyHandler({ wikiId: 'w1', pageId: 'pg1', oldText: 'TODO', newText: '완료' });

  assert.equal(result.isError, true);
  assert.equal(requests.filter(r => r.method === 'PUT').length, 0);
});

test('move-wiki-page passes target wiki and order options', async () => {
  const requests = createCaptureClient();
  await moveWikiPageHandler({
    wikiId: 'w1',
    pageId: 'pg1',
    targetParentPageId: 'pg0',
    targetWikiId: 'w2',
    withChildren: false,
    beforePageId: '0',
  });

  assert.deepEqual(requests[0].data, { targetParentPageId: 'pg0', withChildren: false, targetWikiId: 'w2', beforePageId: '0' });
});

test('delete-wiki-page deletes one page', async () => {
  const requests = createCaptureClient();
  await deleteWikiPageHandler({ wikiId: 'w1', pageId: 'pg1' });

  assert.deepEqual(requests.map(r => `${r.method} ${r.url}`), ['DELETE /wiki/v1/wikis/w1/pages/pg1']);
});

test('download-all-attachments saves files inside saveDir and reports existing ones as failed', async () => {
  const requests = createCaptureClient([
    { id: 'f1', name: 'report.pdf' },
    { id: 'f2', name: '../escape.txt' },
    { id: 'f3', name: 'exists.txt' },
  ]);
  const downloaded: string[] = [];
  getClient().downloadFile = async (url: string) => {
    downloaded.push(url);
    return { data: new TextEncoder().encode('data').buffer, contentType: 'application/octet-stream' };
  };

  const saveDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dooray-mcp-test-'));
  fs.writeFileSync(path.join(saveDir, 'exists.txt'), 'keep');
  try {
    const result = await downloadAllAttachmentsHandler({ projectId: 'p1', taskId: 't1', saveDir });
    const parsed = parseText(result);

    assert.equal(requests[0].url, '/project/v1/projects/p1/posts/t1/files');
    assert.deepEqual(parsed.succeeded.map((s: { savedTo: string }) => path.basename(s.savedTo)), ['report.pdf', 'escape.txt']);
    assert.deepEqual(parsed.failed.map((f: { fileId: string }) => f.fileId), ['f3']);
    assert.equal(result.isError, true);
    assert.equal(fs.readFileSync(path.join(saveDir, 'exists.txt'), 'utf8'), 'keep');
    assert.equal(fs.existsSync(path.join(saveDir, 'escape.txt')), true);
    assert.equal(downloaded.length, 2);
  } finally {
    fs.rmSync(saveDir, { recursive: true, force: true });
  }
});
