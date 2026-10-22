import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRetryDelay } from '../src/api/client.js';

test('429 is retried for every method', () => {
  assert.equal(getRetryDelay({ config: { method: 'post' }, response: { status: 429 } }), 500);
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 429 } }), 500);
});

test('5xx gateway errors are retried for GET only', () => {
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 503 } }), 500);
  assert.equal(getRetryDelay({ config: { method: 'post' }, response: { status: 503 } }), null);
  assert.equal(getRetryDelay({ config: { method: 'put' }, response: { status: 502 } }), null);
});

test('other errors are not retried', () => {
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 500 } }), null);
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 404 } }), null);
  assert.equal(getRetryDelay({ config: { method: 'get' } }), null);
});

test('backoff doubles and stops after max retries', () => {
  const error = (retryCount: number) => ({ config: { method: 'get', __retryCount: retryCount }, response: { status: 429 } });
  assert.equal(getRetryDelay(error(1)), 1000);
  assert.equal(getRetryDelay(error(2)), 2000);
  assert.equal(getRetryDelay(error(3)), null);
});

test('Retry-After header is honored and capped', () => {
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 429, headers: { 'retry-after': '2' } } }), 2000);
  assert.equal(getRetryDelay({ config: { method: 'get' }, response: { status: 429, headers: { 'retry-after': '60' } } }), 10000);
});
