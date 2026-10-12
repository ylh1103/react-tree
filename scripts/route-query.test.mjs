import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { preloadRouteQuery, routeQueryMountOptions } from '../src/queries/routeQuery.ts';

function setup(t) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30000, gcTime: Infinity } },
  });
  t.after(() => client.clear());
  return client;
}

test('无缓存的路由预取等待数据，有缓存的过期查询立即返回并在后台刷新', async (t) => {
  const client = setup(t);
  let resolve;
  const pending = new Promise((done) => {
    resolve = done;
  });
  const options = { queryKey: ['route', 'cold'], queryFn: () => pending };
  let completed = false;
  const loading = preloadRouteQuery(client, options).then(() => {
    completed = true;
  });
  await new Promise((done) => setImmediate(done));
  assert.equal(completed, false);
  resolve(['cold-data']);
  await loading;
  assert.deepEqual(client.getQueryData(options.queryKey), ['cold-data']);

  let finishRefresh;
  const refreshing = new Promise((done) => {
    finishRefresh = done;
  });
  const cached = { queryKey: ['route', 'cached'], staleTime: 0, queryFn: () => refreshing };
  client.setQueryData(cached.queryKey, ['previous']);
  await preloadRouteQuery(client, cached);
  assert.deepEqual(client.getQueryData(cached.queryKey), ['previous']);
  assert.equal(client.getQueryState(cached.queryKey).fetchStatus, 'fetching');
  finishRefresh(['next']);
  await client.prefetchQuery(cached);
  assert.deepEqual(client.getQueryData(cached.queryKey), ['next']);
});

test('首次预取失败后挂载不重复请求，用户显式重试可恢复', async (t) => {
  const client = setup(t);
  let calls = 0;
  let fail = true;
  const options = {
    ...routeQueryMountOptions,
    queryKey: ['route', 'failure'],
    queryFn: async () => {
      calls++;
      if (fail) throw new Error('offline');
      return ['recovered'];
    },
  };
  await preloadRouteQuery(client, options);
  const observer = new QueryObserver(client, options);
  t.after(observer.subscribe(() => {}));
  await new Promise((done) => setImmediate(done));
  assert.equal(calls, 1);
  assert.equal(observer.getCurrentResult().isError, true);
  fail = false;
  await observer.refetch();
  assert.equal(calls, 2);
  assert.deepEqual(observer.getCurrentResult().data, ['recovered']);
});

test('后台刷新失败保留缓存，新页面挂载不再重试同一失败请求', async (t) => {
  const client = setup(t);
  let calls = 0;
  const options = {
    ...routeQueryMountOptions,
    queryKey: ['route', 'background'],
    staleTime: 0,
    queryFn: async () => {
      calls++;
      throw new Error('offline');
    },
  };
  client.setQueryData(options.queryKey, []);
  await preloadRouteQuery(client, options);
  await client.prefetchQuery(options);
  const observer = new QueryObserver(client, options);
  t.after(observer.subscribe(() => {}));
  await new Promise((done) => setImmediate(done));
  assert.equal(calls, 1);
  assert.deepEqual(observer.getCurrentResult().data, []);
  assert.equal(observer.getCurrentResult().isRefetchError, true);
});

test('新鲜列表缓存未包含目标时仍请求并等待确认，避免误判不存在', async (t) => {
  const client = setup(t);
  const key = ['route', 'target'];
  client.setQueryData(key, ['old']);
  let finish;
  let calls = 0;
  const options = {
    queryKey: key,
    queryFn: () => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    },
  };
  let completed = false;
  const loading = preloadRouteQuery(client, options, (items) => items.includes('new')).then(() => {
    completed = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 1);
  assert.equal(completed, false);
  assert.deepEqual(client.getQueryData(key), ['old']);
  finish(['old', 'new']);
  await loading;
  assert.deepEqual(client.getQueryData(key), ['old', 'new']);
});
