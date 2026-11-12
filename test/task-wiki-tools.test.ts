import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaptureClient } from './helpers/capture-client.js';
import { replaceText } from '../src/utils/text-replace.js';
import { mergeMembers, toRequestMembers } from '../src/utils/member-transform.js';
import { updateTaskHandler } from '../src/tools/projects/update-task.js';
import { updateTaskBodyHandler } from '../src/tools/projects/update-task-body.js';
import { getTaskHandler } from '../src/tools/projects/get-task.js';
import { getTaskListHandler } from '../src/tools/projects/get-task-list.js';
import { getTaskCommentListHandler } from '../src/tools/projects/get-task-comment-list.js';
import { updateTaskCommentHandler } from '../src/tools/projects/update-task-comment.js';
import { getClient } from '../src/api/client.js';
import { getWikiPageTreeHandler } from '../src/tools/wiki/get-wiki-page-tree.js';
import * as wikiApi from '../src/api/wiki.js';

const currentTask = {
  id: '42',
  body: { mimeType: 'text/x-markdown', content: '1. 빌드\n2. 배포\n3. 확인' },
  users: {
    to: [{ type: 'member', member: { organizationMemberId: 'm1', name: 'A' } }],
    cc: [
      { type: 'member', member: { organizationMemberId: 'm2', name: 'B' } },
      { type: 'emailUser', emailUser: { emailAddress: 'x@example.com', name: 'X' } },
    ],
  },
  tags: [{ id: 't1' }, { id: 't2' }],
};

// Dooray answers an unknown task with isSuccessful false
function createFailingClient() {
  createCaptureClient();
  getClient().getRawClient().defaults.adapter = async config => ({
    data: { header: { isSuccessful: false, resultCode: -100404, resultMessage: 'SERVICE_RESOURCE_POST_NOT_FOUND' }, result: null },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

test('replaceText replaces a unique match and rejects missing or ambiguous ones', () => {
  assert.deepEqual(replaceText('a b c', 'b', 'B'), { content: 'a B c', count: 1 });
  assert.throws(() => replaceText('a b c', 'z', 'Z'), /not found/);
  assert.throws(() => replaceText('b b', 'b', 'B'), /appears 2 times/);
  assert.deepEqual(replaceText('b b', 'b', 'B', true), { content: 'B B', count: 2 });
  assert.throws(() => replaceText('abc', '', 'x'), /must not be empty/);
});

test('mergeMembers adds, removes and drops duplicates', () => {
  const current = toRequestMembers(currentTask.users.cc);
  assert.deepEqual(
    mergeMembers(
      current,
      [{ type: 'member', member: { organizationMemberId: 'm2' } }, { type: 'member', member: { organizationMemberId: 'm3' } }],
      [{ type: 'emailUser', emailUser: { emailAddress: 'x@example.com' } }]
    ),
    [
      { type: 'member', member: { organizationMemberId: 'm2' } },
      { type: 'member', member: { organizationMemberId: 'm3' } },
    ]
  );
});

test('update-task addCc keeps current assignees and CC', async () => {
  const requests = createCaptureClient(request => (request.method === 'GET' ? currentTask : { id: '42' }));
  const result = await updateTaskHandler({
    projectId: 'p1',
    taskId: '42',
    addCc: [{ id: 'm3', type: 'member' }],
    addTagIds: ['t3'],
    removeTagIds: ['t1'],
  });

  assert.equal(result.isError, undefined);
  const put = requests.find(request => request.method === 'PUT');
  assert.equal(put?.url, '/project/v1/projects/p1/posts/42');
  assert.deepEqual(put?.data, {
    users: {
      to: [{ type: 'member', member: { organizationMemberId: 'm1' } }],
      cc: [
        { type: 'member', member: { organizationMemberId: 'm2' } },
        { type: 'emailUser', emailUser: { emailAddress: 'x@example.com', name: 'X' } },
        { type: 'member', member: { organizationMemberId: 'm3' } },
      ],
    },
    tagIds: ['t2', 't3'],
  });
});

test('update-task with assignees only keeps current CC and returns the body as its length', async () => {
  const requests = createCaptureClient(request => (request.method === 'GET' ? currentTask : null));
  const result = await updateTaskHandler({ projectId: 'p1', taskId: '42', assignees: [{ id: 'm3', type: 'member' }] });

  assert.equal(result.isError, undefined);
  const put = requests.find(request => request.method === 'PUT');
  assert.deepEqual(put?.data, {
    users: {
      to: [{ type: 'member', member: { organizationMemberId: 'm3' } }],
      cc: [
        { type: 'member', member: { organizationMemberId: 'm2' } },
        { type: 'emailUser', emailUser: { emailAddress: 'x@example.com', name: 'X' } },
      ],
    },
  });
  const text = (result.content[0] as { text: string }).text;
  assert.deepEqual(JSON.parse(text).body, { mimeType: 'text/x-markdown', contentLength: currentTask.body.content.length });
  assert.equal(text.includes('\n'), false);
});

test('update-task with cc only keeps current assignees, an empty list clears cc', async () => {
  const requests = createCaptureClient(request => (request.method === 'GET' ? currentTask : null));
  await updateTaskHandler({ projectId: 'p1', taskId: '42', cc: [] });

  const put = requests.find(request => request.method === 'PUT');
  assert.deepEqual(put?.data, {
    users: { to: [{ type: 'member', member: { organizationMemberId: 'm1' } }], cc: [] },
  });
});

test('update-task with assignees and cc replaces both without reading the task first', async () => {
  const requests = createCaptureClient(request => (request.method === 'GET' ? currentTask : null));
  await updateTaskHandler({
    projectId: 'p1',
    taskId: '42',
    assignees: [{ id: 'm3', type: 'member' }],
    cc: [{ id: 'm4', type: 'member' }],
  });

  assert.deepEqual(requests.map(request => request.method), ['PUT', 'GET']);
  assert.deepEqual(requests[0].data, {
    users: {
      to: [{ type: 'member', member: { organizationMemberId: 'm3' } }],
      cc: [{ type: 'member', member: { organizationMemberId: 'm4' } }],
    },
  });
});

test('get-task returns the body length instead of the content when includeBody is false', async () => {
  createCaptureClient(currentTask);
  const full = await getTaskHandler({ taskId: '42' });
  const short = await getTaskHandler({ taskId: '42', includeBody: false });

  assert.equal(JSON.parse((full.content[0] as { text: string }).text).body.content, currentTask.body.content);
  assert.deepEqual(JSON.parse((short.content[0] as { text: string }).text).body, {
    mimeType: 'text/x-markdown',
    contentLength: currentTask.body.content.length,
  });
});

test('get-task-list returns compact JSON without indentation', async () => {
  const requests = createCaptureClient([{ id: '42', number: 7, subject: '배포', tags: [{ id: 't1' }], users: currentTask.users }]);
  const result = await getTaskListHandler({ projectId: 'p1', subjects: '배포' });

  const text = (result.content[0] as { text: string }).text;
  assert.equal(text.includes('\n'), false);
  assert.deepEqual(JSON.parse(text).data[0], { id: '42', number: 7, subject: '배포', tags: [{ id: 't1' }] });
  assert.equal(requests[0].params?.subjects, '배포');
});

test('comment tools return an error result instead of a bare string when the API fails', async () => {
  createFailingClient();
  const list = await getTaskCommentListHandler({ projectId: 'p1', taskId: '42' });
  const update = await updateTaskCommentHandler({
    projectId: 'p1',
    taskId: '42',
    commentId: 'c1',
    body: { mimeType: 'text/x-markdown', content: '수정' },
  });

  for (const result of [list, update]) {
    assert.equal(typeof result, 'object');
    assert.equal(result.isError, true);
    assert.match((result.content[0] as { text: string }).text, /^Error: Dooray API Error: SERVICE_RESOURCE_POST_NOT_FOUND/);
  }
});

test('update-task rejects mixing replace and add options for the same field', async () => {
  createCaptureClient(currentTask);
  const result = await updateTaskHandler({
    projectId: 'p1',
    taskId: '42',
    cc: [{ id: 'm3', type: 'member' }],
    addCc: [{ id: 'm4', type: 'member' }],
  });
  assert.equal(result.isError, true);
});

test('update-task-body keeps mimeType and sends only the replaced body', async () => {
  const requests = createCaptureClient(request => (request.method === 'GET' ? currentTask : { id: '42' }));
  const result = await updateTaskBodyHandler({ projectId: 'p1', taskId: '42', oldText: '2. 배포', newText: '2. 카나리 배포' });

  assert.equal(result.isError, undefined);
  const put = requests.find(request => request.method === 'PUT');
  assert.deepEqual(put?.data, { body: { mimeType: 'text/x-markdown', content: '1. 빌드\n2. 카나리 배포\n3. 확인' } });
});

test('update-task-body does not write when oldText is missing', async () => {
  const requests = createCaptureClient(currentTask);
  const result = await updateTaskBodyHandler({ projectId: 'p1', taskId: '42', oldText: '4. 회고', newText: '' });

  assert.equal(result.isError, true);
  assert.equal(requests.filter(request => request.method === 'PUT').length, 0);
});

test('wiki page tree walks levels up to depth', async () => {
  const children: Record<string, Array<{ id: string; subject: string }>> = {
    root: [{ id: '1', subject: 'A' }, { id: '2', subject: 'B' }],
    '1': [{ id: '3', subject: 'A-1' }],
    '3': [{ id: '4', subject: 'A-1-1' }],
  };
  createCaptureClient(request => children[String(request.params?.parentPageId ?? 'root')] || []);

  const result = await getWikiPageTreeHandler({ wikiId: 'w1', depth: 2 });
  const parsed = JSON.parse((result.content[0] as { text: string }).text);
  assert.deepEqual(parsed.tree, [
    { id: '1', subject: 'A', children: [{ id: '3', subject: 'A-1' }] },
    { id: '2', subject: 'B' },
  ]);
  assert.equal(parsed.pageCount, 3);
});

test('wiki page move sends withChildren true by default', async () => {
  const requests = createCaptureClient();
  await wikiApi.moveWikiPage({ wikiId: 'w1', pageId: 'p1', targetParentPageId: 'p0' });

  assert.deepEqual(requests, [{
    method: 'POST',
    url: '/wiki/v1/wikis/w1/pages/p1/move',
    params: undefined,
    data: { targetParentPageId: 'p0', withChildren: true },
  }]);
});
