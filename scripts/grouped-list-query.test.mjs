import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import {
  groupedListKeys,
  groupedListOptions,
  refreshGroupedList,
} from '../src/features/grouped-list/queries.ts';
import { toTreeData } from '../src/features/grouped-list/model.ts';

function setup(t) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000, gcTime: Infinity } },
  });
  t.after(() => client.clear());
  return client;
}
function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('外部刷新只重新请求指定列表，多个订阅者共用一次请求', async (t) => {
  const client = setup(t);
  let loads = 0;
  const service = { load: async () => [{ key: 'p', title: String(++loads) }] };
  const options = groupedListOptions('parameters', service);
  await client.fetchQuery(options);
  const a = new QueryObserver(client, options);
  const b = new QueryObserver(client, options);
  t.after(a.subscribe(() => {}));
  t.after(b.subscribe(() => {}));
  client.setQueryData(groupedListKeys.list('applications'), []);
  await refreshGroupedList(client, 'parameters');
  assert.equal(loads, 2);
  assert.equal(a.getCurrentResult().data[0].title, '2');
  assert.equal(b.getCurrentResult().data[0].title, '2');
  assert.equal(client.getQueryState(groupedListKeys.list('applications')).isInvalidated, false);
});

test('未挂载列表只标记过期，下次读取不误用新鲜缓存', async (t) => {
  const client = setup(t);
  let loads = 0;
  const options = groupedListOptions('parameters', {
    load: async () => [{ key: 'p', title: String(++loads) }],
  });
  await client.fetchQuery(options);
  await refreshGroupedList(client, 'parameters');
  assert.equal(loads, 1);
  assert.equal(client.getQueryState(options.queryKey).isInvalidated, true);
  await client.fetchQuery(options);
  assert.equal(loads, 2);
});

test('相同数据刷新保持树引用，不重新执行转换', async (t) => {
  const client = setup(t);
  const options = groupedListOptions('parameters', {
    load: async () => [{ key: 'p', title: '参数' }],
  });
  let conversions = 0;
  const observer = new QueryObserver(client, {
    ...options,
    select: (nodes) => {
      conversions++;
      return toTreeData(nodes);
    },
  });
  t.after(observer.subscribe(() => {}));
  await client.fetchQuery(options);
  const before = observer.getCurrentResult().data;
  await refreshGroupedList(client, 'parameters');
  assert.equal(observer.getCurrentResult().data, before);
  assert.equal(conversions, 1);
});

test('写入期间的多个外部刷新保留失效标记，重新启用时合并获取', async (t) => {
  const client = setup(t);
  let loads = 0;
  const options = groupedListOptions('parameters', {
    load: async () => [{ key: 'p', title: String(++loads) }],
  });
  await client.fetchQuery(options);
  const observer = new QueryObserver(client, { ...options, enabled: false });
  t.after(observer.subscribe(() => {}));
  const gate = deferred();
  const mutation = client.getMutationCache().build(client, {
    mutationKey: groupedListKeys.write('parameters'),
    mutationFn: () => gate.promise,
  });
  const pending = mutation.execute();
  await refreshGroupedList(client, 'parameters');
  await refreshGroupedList(client, 'parameters');
  assert.equal(loads, 1);
  assert.equal(client.getQueryState(options.queryKey).isInvalidated, true);
  gate.resolve();
  await pending;
  observer.setOptions(options);
  await client.fetchQuery(options);
  assert.equal(loads, 2);
});

test('刷新失败保留已有列表，重试可恢复', async (t) => {
  const client = setup(t);
  let fail = false;
  const options = groupedListOptions('parameters', {
    load: async () => {
      if (fail) throw new Error('offline');
      return [{ key: 'p', title: '参数' }];
    },
  });
  await client.fetchQuery(options);
  const observer = new QueryObserver(client, options);
  t.after(observer.subscribe(() => {}));
  const before = observer.getCurrentResult().data;
  fail = true;
  await refreshGroupedList(client, 'parameters');
  assert.equal(observer.getCurrentResult().data, before);
  assert.equal(observer.getCurrentResult().isError, true);
  fail = false;
  await refreshGroupedList(client, 'parameters');
  assert.equal(observer.getCurrentResult().isSuccess, true);
});

test('取消旧查询传递 AbortSignal，迟到响应不能覆盖保存结果', async (t) => {
  const client = setup(t);
  const gate = deferred();
  let signal;
  const options = groupedListOptions('parameters', {
    load: (nextSignal) => {
      signal = nextSignal;
      return gate.promise;
    },
  });
  const pending = client.fetchQuery(options).catch(() => {});
  await client.cancelQueries({ queryKey: options.queryKey });
  assert.equal(signal.aborted, true);
  client.setQueryData(options.queryKey, [{ key: 'p', title: '已保存' }]);
  gate.resolve([{ key: 'p', title: '旧响应' }]);
  await pending;
  assert.equal(client.getQueryData(options.queryKey)[0].title, '已保存');
});
