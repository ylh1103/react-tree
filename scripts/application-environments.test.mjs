import { createSystemTestRouter } from './helpers/systemRouter.mjs';
/** 环境接口与缓存回归：排序、维度隔离、请求去重、取消和授权失败。 */
import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import { store } from '../src/store/index.ts';
import { setUserInfo } from '../src/store/slices/userSlice.ts';
import { createDemoLoginUser } from '../src/mocks/login.ts';
beforeEach(() => store.dispatch(setUserInfo(createDemoLoginUser('1'))));
import axios from 'axios';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { httpClient } from '../src/http/request.ts';
import {
  applicationEnvironmentsOptions,
  applicationEnvironmentsPageOptions,
} from '../src/queries/applicationEnvironments.ts';
import { loadApplicationEnvironments } from '../src/api/applicationEnvironments.ts';
import { createMockApplicationEnvironments } from '../src/mocks/applicationEnvironments.ts';
import { createMockApplications } from '../src/mocks/applications.ts';
import { mockConfig } from '../src/mocks/config.ts';
import { queryClient } from '../src/queries/client.ts';
import { systemApplicationListOptions } from '../src/queries/applications.ts';
import {
  applicationWorkspaceRouteId,
  preloadApplications,
} from '../src/router/workspace/application/loader.ts';

test('环境查询并发去重，重新读取时请求最新结果，按系统和应用隔离', async (t) => {
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
  assert.equal(requests.length, 2);
  await client.query(applicationEnvironmentsOptions('CAC', 'B'));
  await client.query(applicationEnvironmentsOptions('OTHER', 'A'));
  assert.deepEqual(requests, [
    { systemName: 'CAC', appName: 'A' },
    { systemName: 'CAC', appName: 'A' },
    { systemName: 'CAC', appName: 'B' },
    { systemName: 'OTHER', appName: 'A' },
  ]);
});

test('切回应用时先显示旧环境，挂载后请求最新结果', async (t) => {
  const client = new QueryClient();
  t.after(() => client.clear());
  const previous = createMockApplicationEnvironments('CAC', 'A');
  const latest = previous.map((item) => ({ ...item, configInfo: '更新后的配置' }));
  let resolveRefresh;
  const refresh = new Promise((resolve) => {
    resolveRefresh = resolve;
  });
  const options = {
    ...applicationEnvironmentsPageOptions('CAC', 'A'),
    queryFn: () => refresh,
  };
  client.setQueryData(options.queryKey, previous);
  const other = applicationEnvironmentsPageOptions('CAC', 'B');
  client.setQueryData(other.queryKey, []);
  const observer = new QueryObserver(client, other);
  t.after(observer.subscribe(() => {}));
  observer.setOptions(options);
  assert.equal(observer.getCurrentResult().data, previous);
  assert.equal(observer.getCurrentResult().isFetching, true);
  resolveRefresh(latest);
  const result = await observer.refetch({ cancelRefetch: false });
  assert.deepEqual(result.data, latest);
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

test(
  '直达应用并行预取清单和环境，页面接续结果；页内切换时环境交给页面',
  { timeout: 3000 },
  async (t) => {
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
    let releaseList;
    let reportEnvironmentRequest;
    const listGate = new Promise((resolve) => (releaseList = resolve));
    const environmentStarted = new Promise((resolve) => (reportEnvironmentRequest = resolve));
    t.after(releaseList);
    httpClient.defaults.adapter = async (config) => {
      calls.push(config.url);
      if (config.url === '/api/applications') await listGate;
      if (config.url === '/api/applications/environments') reportEnvironmentRequest();
      return original(config);
    };
    const [firstApp, secondApp] = createMockApplications(3);
    const appName = firstApp.appName;
    const router = createSystemTestRouter([
      { id: applicationWorkspaceRouteId, path: ':appName', loader: preloadApplications },
    ]);
    t.after(() => router.dispose());
    const entering = router.navigate(`/systems/CACTEST1/${appName}`);
    await environmentStarted;
    assert.equal(router.state.navigation.state, 'loading');
    releaseList();
    await entering;
    assert.equal(router.state.errors, null);
    assert.equal(calls[0], '/api/systems/page');

    const list = systemApplicationListOptions('CACTEST1');
    const environments = applicationEnvironmentsPageOptions('CACTEST1', appName);
    const listObserver = new QueryObserver(queryClient, list);
    const environmentObserver = new QueryObserver(queryClient, environments);
    t.after(listObserver.subscribe(() => {}));
    t.after(environmentObserver.subscribe(() => {}));
    assert.ok(listObserver.getCurrentResult().data);
    assert.ok(environmentObserver.getCurrentResult().data);
    assert.equal(listObserver.getCurrentResult().isFetching, false);
    assert.equal(environmentObserver.getCurrentResult().isFetching, false);
    assert.equal(calls.filter((url) => url === '/api/applications').length, 1);
    assert.equal(calls.filter((url) => url === '/api/applications/environments').length, 1);

    calls.length = 0;
    await router.navigate(`/systems/CACTEST1/${secondApp.appName}`);
    assert.ok(!calls.includes('/api/applications/environments'));
    environmentObserver.setOptions(
      applicationEnvironmentsPageOptions('CACTEST1', secondApp.appName),
    );
    await environmentObserver.refetch({ cancelRefetch: false });
    assert.equal(calls.filter((url) => url === '/api/applications/environments').length, 1);

    calls.length = 0;
    mockConfig.systemAccessError = 403;
    await router.navigate('/outside');
    await router.navigate(`/systems/CACTEST1/${appName}`);
    assert.equal(Object.values(router.state.errors)[0].status, 403);
    assert.deepEqual(calls, ['/api/systems/page']);
  },
);
