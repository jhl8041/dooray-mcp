import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { DoorayClient, selectToken } from '../src/api/client.js';
import { DoorayAPIError } from '../src/utils/errors.js';

const READ = { apiToken: 'read-token' };
const READ_WRITE = { apiToken: 'read-token', writeApiToken: 'write-token' };

test('write requests use writeApiToken when it is set', () => {
  for (const method of ['post', 'PUT', 'patch', 'delete']) {
    assert.deepEqual(selectToken(method, READ_WRITE), { token: 'write-token', name: 'DOORAY_WRITE_API_TOKEN' });
  }
});

test('GET requests use apiToken even when writeApiToken is set', () => {
  assert.deepEqual(selectToken('get', READ_WRITE), { token: 'read-token', name: 'DOORAY_API_TOKEN' });
  assert.deepEqual(selectToken(undefined, READ_WRITE), { token: 'read-token', name: 'DOORAY_API_TOKEN' });
});

test('write requests use apiToken when writeApiToken is not set', () => {
  assert.deepEqual(selectToken('post', READ), { token: 'read-token', name: 'DOORAY_API_TOKEN' });
});

function clientWithAdapter(config: typeof READ | typeof READ_WRITE, status: number, sent: string[]) {
  const client = new DoorayClient(config);
  client.getRawClient().defaults.adapter = async (request: InternalAxiosRequestConfig) => {
    sent.push(`${request.method} ${request.headers.Authorization}`);
    const response = {
      data: { header: { isSuccessful: status === 200, resultCode: 0, resultMessage: 'forbidden' }, result: {} },
      status,
      statusText: '',
      headers: {},
      config: request,
    };
    if (status !== 200) throw new AxiosError('failed', 'ERR_BAD_REQUEST', request, null, response);
    return response;
  };
  return client;
}

test('client sends reads and writes with their own token', async () => {
  const sent: string[] = [];
  const client = clientWithAdapter(READ_WRITE, 200, sent);
  await client.get('/project/v1/projects/1/posts/2');
  await client.post('/project/v1/projects/1/posts', {});
  await client.put('/project/v1/projects/1/posts/2', {});
  assert.deepEqual(sent, ['get dooray-api read-token', 'post dooray-api write-token', 'put dooray-api write-token']);
});

test('failed write names the write token and is not resent with apiToken', async () => {
  const sent: string[] = [];
  const client = clientWithAdapter(READ_WRITE, 403, sent);
  await assert.rejects(client.post('/project/v1/projects/1/posts', {}), (error: DoorayAPIError) => {
    assert.equal(error.message, 'forbidden (sent with DOORAY_WRITE_API_TOKEN)');
    return true;
  });
  assert.deepEqual(sent, ['post dooray-api write-token']);
});

test('failed read keeps the Dooray message as is', async () => {
  const client = clientWithAdapter(READ_WRITE, 403, []);
  await assert.rejects(client.get('/project/v1/projects/1'), { message: 'forbidden' });
});
