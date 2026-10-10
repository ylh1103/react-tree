import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient } from '@tanstack/react-query';
import {
  applicationListId,
  groupedListKeys,
  groupedListOptions,
  refreshGroupedList,
} from '../src/features/grouped-list/queries.ts';
import { createHttpListApi } from '../src/features/grouped-list/service.ts';
import { createServer } from 'node:http';

test('系统应用列表与旧列表的查询和写入锁完全隔离', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const cac = applicationListId('CAC');
  const other = applicationListId('其他/系统');
  try {
    await client.fetchQuery(
      groupedListOptions(cac, { load: async () => [{ key: 'a', title: 'CAC应用' }] }),
    );
    await client.fetchQuery(
      groupedListOptions(other, { load: async () => [{ key: 'a', title: '其他应用' }] }),
    );
    await client.fetchQuery(groupedListOptions('applications', { load: async () => [] }));
    assert.equal(client.getQueryData(groupedListKeys.list(cac))[0].title, 'CAC应用');
    assert.equal(client.getQueryData(groupedListKeys.list(other))[0].title, '其他应用');
    assert.notDeepEqual(groupedListKeys.write(cac), groupedListKeys.write(other));
    await refreshGroupedList(client, cac);
    assert.equal(client.getQueryState(groupedListKeys.list(cac)).isInvalidated, true);
    assert.equal(client.getQueryState(groupedListKeys.list(other)).isInvalidated, false);
    assert.equal(client.getQueryState(groupedListKeys.list('applications')).isInvalidated, false);
  } finally {
    client.clear();
  }
});

test('真实清单、分组读取和分组保存都携带系统名称', async (t) => {
  const requests = [];
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    let body = '';
    for await (const part of request) body += part;
    requests.push({ system: url.searchParams.get('systemName'), method: request.method, body });
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(url.pathname.endsWith('/groups') ? { appGroupInfo: null } : []));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const api = createHttpListApi({
    items: `${base}/applications`,
    groups: `${base}/applications/groups`,
    params: { systemName: '核心 / 100%' },
  });
  await Promise.all([api.getItems(), api.getGroups()]);
  await api.saveGroups({ appGroupInfo: '[]' });
  assert.equal(requests.length, 3);
  assert.ok(requests.every((request) => request.system === '核心 / 100%'));
  assert.deepEqual(JSON.parse(requests.find((request) => request.method === 'PUT').body), {
    appGroupInfo: '[]',
  });
});
