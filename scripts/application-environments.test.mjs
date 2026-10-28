/** 环境接口与缓存回归：排序、维度隔离、请求去重、取消和授权失败。 */
import assert from 'node:assert/strict';
import test from 'node:test';
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { httpClient } from '../src/http/request.ts';
import { applicationEnvironmentsOptions } from '../src/queries/applicationEnvironments.ts';
import { loadApplicationEnvironments } from '../src/api/applicationEnvironments.ts';
import { createMockApplicationEnvironments } from '../src/mocks/applicationEnvironments.ts';
import { createMockApplications } from '../src/mocks/applications.ts';
import { mockConfig } from '../src/mocks/config.ts';
import { queryClient } from '../src/queries/client.ts';
import { preloadApplications } from '../src/router/loaders.ts';

test('环境查询不改写原列表，按顺序排序；同一应用去重，不同系统和应用隔离', async (t) => {
  const original = httpClient.defaults.adapter;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  t.after(() => {
    httpClient.defaults.adapter = original;
    client.clear();
  });
  const requests = [];
  const raw = createMockApplicationEnvironments('CAC', 'A');
  const originalOrder = raw.map((env) => env.envTag);
  httpClient.defaults.adapter = async (config) => {
    requests.push(config.params);
    assert.equal(config.url, '/api/applications/environments');
    assert.ok(config.signal);
    return { data: raw, status: 200, statusText: 'OK', headers: {}, config };
  };
  const options = applicationEnvironmentsOptions('CAC', 'A');
  const [first, second] = await Promise.all([client.query(options), client.query(options)]);
  assert.equal(first, second);
  assert.deepEqual(
    first.map((env) => env.envTag),
    ['dev', 'st', 'uat', 'stp', 'prd'],
  );
  assert.deepEqual(
    raw.map((env) => env.envTag),
    originalOrder,
  );
  await client.query(options);
  assert.equal(requests.length, 1);
  await client.query(applicationEnvironmentsOptions('CAC', 'B'));
  await client.query(applicationEnvironmentsOptions('OTHER', 'A'));
  assert.deepEqual(requests, [
    { systemName: 'CAC', appName: 'A' },
    { systemName: 'CAC', appName: 'B' },
    { systemName: 'OTHER', appName: 'A' },
  ]);
});

test('环境 Mock 保留请求维度、空白配置及负数状态，取消和 404/403 原样传播', async (t) => {
  const delay = mockConfig.delayMs;
  t.after(() => {
    mockConfig.delayMs = delay;
    mockConfig.systemAccessError = null;
  });
  mockConfig.delayMs = 0;
  const appName = createMockApplications(3)[0].appName;
  const items = await loadApplicationEnvironments('CACTEST1', appName);
  assert.ok(items.every((env) => env.systemName === 'CACTEST1' && env.appName === appName));
  assert.equal(items.find((env) => env.envTag === 'st').configInfo, ' ');
  assert.equal(items.find((env) => env.envTag === 'st').runtimeDifferNum, -2);
  await assert.rejects(
    loadApplicationEnvironments('CACTEST1', 'missing'),
    (error) => error.status === 404,
  );
  const controller = new AbortController();
  mockConfig.delayMs = 100;
  const pending = loadApplicationEnvironments('CACTEST1', appName, controller.signal);
  controller.abort();
  await assert.rejects(pending, axios.isCancel);
  mockConfig.delayMs = 0;
  mockConfig.systemAccessError = 403;
  await assert.rejects(
    loadApplicationEnvironments('CACTEST1', appName),
    (error) => error.status === 403,
  );
});

test('loader 校验访问后预取环境，拒绝访问时不产生环境请求', async (t) => {
  const original = httpClient.defaults.adapter;
  const delay = mockConfig.delayMs;
  t.after(() => {
    httpClient.defaults.adapter = original;
    mockConfig.delayMs = delay;
    mockConfig.systemAccessError = null;
    queryClient.clear();
  });
  mockConfig.delayMs = 0;
  queryClient.clear();
  const calls = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config.url);
    return original(config);
  };
  const appName = createMockApplications(3)[0].appName;
  await preloadApplications({ params: { systemName: 'CACTEST1', appName } });
  assert.ok(queryClient.getQueryData(applicationEnvironmentsOptions('CACTEST1', appName).queryKey));
  assert.equal(calls[0], '/api/systems/CACTEST1/access');
  assert.equal(calls.filter((url) => url === '/api/applications/environments').length, 1);
  calls.length = 0;
  mockConfig.systemAccessError = 403;
  await assert.rejects(
    preloadApplications({ params: { systemName: 'CACTEST1', appName } }),
    (error) => error.status === 403,
  );
  assert.deepEqual(calls, ['/api/systems/CACTEST1/access']);
});
