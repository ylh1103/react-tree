import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeApplications,
  mergeParameters,
  fromTreeData,
  toTreeData,
} from '../src/features/grouped-list/model.ts';
import { createListService, createHttpListApi } from '../src/features/grouped-list/service.ts';

for (const [label, merge, field, items] of [
  [
    '应用',
    mergeApplications,
    'appGroupInfo',
    [
      { appName: 'a', appDesc: '最新描述' },
      { appName: 'b', appDesc: '新增应用' },
    ],
  ],
  [
    '参数',
    mergeParameters,
    'paramDbTypeGroupInfo',
    [
      { paramTypeName: 'a', paramTypeDesc: '最新描述' },
      { paramTypeName: 'b', paramTypeDesc: '新增应用' },
    ],
  ],
]) {
  const groups = [
    {
      key: 'group-1',
      title: '分组',
      desc: '分组描述',
      children: [
        { key: 'a', title: '旧名称', desc: '旧描述' },
        { key: 'nested', title: '子分组', children: [{ key: 'removed', title: '已下线' }] },
      ],
    },
  ];
  const serialized = JSON.stringify(groups);
  test(`${label}：清单和分组都为空`, () => assert.deepEqual(merge([], null), []));
  test(`${label}：清单为空时递归删除叶子、保留空目录和描述`, () => {
    assert.deepEqual(merge([], serialized), [
      { ...groups[0], children: [{ key: 'nested', title: '子分组', children: [] }] },
    ]);
  });
  test(`${label}：无分组时按清单顺序展示`, () => {
    assert.deepEqual(merge(items, null), [
      { key: 'a', title: 'a', desc: '最新描述' },
      { key: 'b', title: 'b', desc: '新增应用' },
    ]);
  });
  test(`${label}：保留交集位置、更新描述、剔除下线节点、新增项追加根尾部`, () => {
    assert.deepEqual(merge(items, serialized), [
      {
        ...groups[0],
        children: [
          { key: 'a', title: 'a', desc: '最新描述' },
          { key: 'nested', title: '子分组', children: [] },
        ],
      },
      { key: 'b', title: 'b', desc: '新增应用' },
    ]);
    assert.equal(JSON.stringify(groups), serialized);
  });
  test(`${label}：重复叶子只展示一次、空目录保留、转换往返无损`, () => {
    const nodes = merge(
      items,
      JSON.stringify([
        ...groups,
        { key: 'a', title: '重复' },
        { key: 'empty', title: '空组', children: [] },
      ]),
    );
    assert.equal(nodes.length, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(fromTreeData(toTreeData(nodes)))), nodes);
  });
  test(`${label}：异常 JSON、非法节点、重复分组和业务 key 冲突明确报错`, () => {
    for (const raw of [
      '{',
      '{}',
      'null',
      '[{"key":"x","title":"x","children":null}]',
      '[{"key":"a","title":"冲突","children":[]}]',
      '[{"key":"g","title":"组","children":[]},{"key":"g","title":"组","children":[]}]',
    ]) {
      assert.throws(() => merge(items, raw));
    }
  });
  test(`${label}：每次加载同时查询两接口、保存正确字段的 JSON 字符串`, async () => {
    let releaseItems;
    let releaseGroups;
    let calls = 0;
    let payload;
    const api = {
      getItems: () => {
        calls++;
        return new Promise((resolve) => {
          releaseItems = resolve;
        });
      },
      getGroups: () => {
        calls++;
        return new Promise((resolve) => {
          releaseGroups = resolve;
        });
      },
      saveGroups: async (value) => {
        payload = value;
      },
    };
    const service = createListService(api, field, merge);
    for (let i = 0; i < 2; i++) {
      const loaded = service.load();
      assert.equal(calls, (i + 1) * 2);
      releaseItems(items);
      releaseGroups({ [field]: serialized });
      const nodes = await loaded;
      await service.save(nodes);
      assert.deepEqual(payload, { [field]: JSON.stringify(nodes) });
    }
  });
  test(`${label}：接口异常不会被当作空数据或保存成功`, async () => {
    const service = createListService(
      {
        getItems: async () => items,
        getGroups: async () => {
          throw new Error('读取失败');
        },
        saveGroups: async () => {
          throw new Error('保存失败');
        },
      },
      field,
      merge,
    );
    await assert.rejects(service.load(), /读取失败/);
    await assert.rejects(service.save([]), /保存失败/);
  });
}

test('HTTP 适配器：GET 清单和分组，PUT 正确 payload，支持 204 与 HTTP 错误', async (t) => {
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url, init });
    return init.method === 'PUT' ? new Response(null, { status: 204 }) : Response.json([]);
  });
  const api = createHttpListApi({ items: '/items', groups: '/groups' });
  await api.getItems();
  await api.getGroups();
  await api.saveGroups({ appGroupInfo: '[]' });
  assert.equal(requests[2].init.method, 'PUT');
  assert.equal(requests[2].init.body, '{"appGroupInfo":"[]"}');
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 500 }));
  await assert.rejects(api.saveGroups({ appGroupInfo: '[]' }), /500/);
});
