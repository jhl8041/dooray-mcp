/**
 * Initialize the Dooray client with an adapter that records requests instead of sending them
 */

import type { InternalAxiosRequestConfig } from 'axios';
import { initializeClient } from '../../src/api/client.js';

export interface CapturedRequest {
  method: string;
  url: string;
  params?: Record<string, unknown>;
  data?: unknown;
}

type ResponseResult = unknown | ((request: CapturedRequest) => unknown);

export function createCaptureClient(responseResult: ResponseResult = null) {
  const requests: CapturedRequest[] = [];
  const client = initializeClient({ apiToken: 'test-token' });

  client.getRawClient().defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const request: CapturedRequest = {
      method: (config.method || 'get').toUpperCase(),
      url: config.url || '',
      params: config.params,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
    };
    requests.push(request);
    const result = typeof responseResult === 'function' ? responseResult(request) : responseResult;
    return {
      data: { header: { isSuccessful: true, resultCode: 0, resultMessage: '' }, result, totalCount: 0 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };

  return requests;
}
