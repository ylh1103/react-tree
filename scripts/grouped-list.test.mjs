import {
  buildTreeIndex,
  deriveTreeView,
  moveNode,
  removeNode,
  insertNode,
  countLeafNodes,
  filterTreeByMatchingLeaves,
  moveNodeToDirectory,
  updateNodeTitle,
  deleteBranchAndPromoteChildren,
} from '../src/features/grouped-list/treeUtils.ts';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeApplications,
  mergeParameters,
  fromTreeData,
  toTreeData,
} from '../src/features/grouped-list/model.ts';
import { createListService, createHttpListApi } from '../src/features/grouped-list/service.ts';

test('目录重命名：保留层级、标识及类型数据，源树保持不变', () => {
  const nodes = [
    {
      key: 'group',
      title: '旧名称',
      desc: '分组描述',
      children: [
        { key: 'nested', title: '嵌套目录', children: [{ key: 'a', title: '应用', appType: '1' }] },
      ],
    },
  ];
  const tree = toTreeData(nodes);
  const before = structuredClone(tree);
  const renamed = updateNodeTitle(tree, 'nested', '新名称');
  assert.equal(renamed[0].children[0].title, '新名称');
  assert.equal(renamed[0].children[0].key, 'nested');
  assert.equal(renamed[0].children[0].children[0].data.appType, '1');
  assert.equal(renamed[0].desc, '分组描述');
  assert.deepEqual(tree, before);
});

test('目录删除：完整子树迁移并保存，筛选隐藏叶子和类型数据均保留', async () => {
  const nodes = [
    {
      key: 'source',
      title: '来源',
      children: [
        { key: 'a', title: '增量参数', maintType: '0' },
        {
          key: 'nested',
          title: '子组',
          children: [{ key: 'b', title: '全量参数', maintType: '1' }],
        },
      ],
    },
    { key: 'target', title: '目标', children: [{ key: 'c', title: '原有参数', maintType: '0' }] },
    { key: 'empty', title: '空组', children: [] },
  ];
  const tree = toTreeData(nodes);
  const before = structuredClone(tree);
  const next = deleteBranchAndPromoteChildren(tree, 'source', 'target');
  assert.deepEqual(
    next.map((node) => node.key),
    ['target', 'empty'],
  );
  assert.deepEqual(
    next[0].children.map((node) => node.key),
    ['c', 'a', 'nested'],
  );
  assert.equal(countLeafNodes(next), 3);
  assert.equal(next[0].children[2].children[0].data.maintType, '1');
  assert.deepEqual(tree, before);
  assert.strictEqual(deleteBranchAndPromoteChildren(tree, 'source', 'nested'), tree);
  assert.equal(deleteBranchAndPromoteChildren(tree, 'empty').length, 2);
  const atRoot = deleteBranchAndPromoteChildren(tree, 'source', null);
  assert.deepEqual(
    atRoot.map((node) => node.key),
    ['target', 'empty', 'a', 'nested'],
  );
  let saved;
  const service = createListService(
    {
      saveGroups: async (payload) => {
        saved = payload;
      },
    },
    'paramDbTypeGroupInfo',
    mergeParameters,
  );
  await service.save(fromTreeData(next));
  assert.deepEqual(JSON.parse(saved.paramDbTypeGroupInfo), fromTreeData(next));
});

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

for (const [label, merge, typeField, items] of [
  [
    '应用类型',
    mergeApplications,
    'appType',
    [
      { appName: 'a', appDesc: '业务', appType: '0' },
      { appName: 'b', appDesc: '公共', appType: '1' },
    ],
  ],
  [
    '维护方式',
    mergeParameters,
    'maintType',
    [
      { paramTypeName: 'a', paramTypeDesc: '增量', maintType: '0' },
      { paramTypeName: 'b', paramTypeDesc: '全量', maintType: '1' },
    ],
  ],
]) {
  test(`${label}：清单覆盖旧类型，嵌套和新增叶子保留类型，编辑转换无损`, () => {
    const nodes = merge(
      items,
      JSON.stringify([
        { key: 'g', title: '组', children: [{ key: 'a', title: '旧名称', [typeField]: '1' }] },
      ]),
    );
    assert.equal(nodes[0].children[0][typeField], '0');
    assert.equal(nodes[1][typeField], '1');
    const tree = toTreeData(nodes);
    assert.equal(tree[0].children[0].data[typeField], '0');
    assert.equal(tree[1].data[typeField], '1');
    assert.deepEqual(fromTreeData(tree), nodes);
    assert.deepEqual(merge(items, JSON.stringify(fromTreeData(tree))), nodes);
  });
}

for (const typeField of ['appType', 'maintType']) {
  test(`${typeField}：类型筛选与搜索取交集、保留祖先路径且不影响保存`, () => {
    const nodes = [
      {
        key: 'g',
        title: '分组',
        children: [
          { key: 'a', title: 'Alpha', desc: '匹配描述', [typeField]: '0' },
          {
            key: 'nested',
            title: '嵌套',
            children: [{ key: 'b', title: 'Beta', desc: '匹配描述', [typeField]: '1' }],
          },
        ],
      },
      { key: 'empty', title: '空组', children: [] },
      { key: 'unknown', title: '未标注' },
    ];
    const tree = toTreeData(nodes);
    const before = structuredClone(tree);
    const byType = (value) => (node) => node.data[typeField] === value;
    const text = (node) => `${node.title} ${node.data.desc ?? ''}`;
    assert.strictEqual(filterTreeByMatchingLeaves(tree, ''), tree);
    const zero = filterTreeByMatchingLeaves(tree, '', text, byType('0'));
    assert.deepEqual(
      zero.map((node) => node.key),
      ['g'],
    );
    assert.deepEqual(
      zero[0].children.map((node) => node.key),
      ['a'],
    );
    const one = filterTreeByMatchingLeaves(tree, '匹配描述', text, byType('1'));
    assert.equal(one[0].children[0].children[0].key, 'b');
    assert.deepEqual(filterTreeByMatchingLeaves(tree, 'Alpha', text, byType('1')), []);
    const editing = filterTreeByMatchingLeaves(tree, '', text, byType('0'), true);
    assert.equal(editing[1].key, 'empty');
    assert.deepEqual(tree, before);
    assert.deepEqual(fromTreeData(tree), nodes);
  });
}

test('标题计数：统计嵌套叶子、排除空分组，搜索和类型筛选更新匹配数', () => {
  const tree = toTreeData([
    {
      key: 'g',
      title: '组',
      children: [
        { key: 'a', title: 'Alpha', appType: '0' },
        { key: 'nested', title: '子组', children: [{ key: 'b', title: 'Beta', appType: '1' }] },
      ],
    },
    { key: 'c', title: 'Beta 2', appType: '1' },
    { key: 'empty', title: '空组', children: [] },
  ]);
  assert.equal(countLeafNodes([]), 0);
  assert.equal(countLeafNodes(tree), 3);
  assert.equal(countLeafNodes(filterTreeByMatchingLeaves(tree, 'Beta')), 2);
  assert.equal(
    countLeafNodes(
      filterTreeByMatchingLeaves(tree, 'Beta', undefined, (node) => node.data.appType === '0'),
    ),
    0,
  );
  assert.equal(countLeafNodes(tree), 3);
});

test('快速移动：叶子和整个分组可移动，完整树保持不可变并拒绝循环目标', async () => {
  const original = toTreeData([
    {
      key: 'source',
      title: '来源',
      children: [
        { key: 'a', title: '业务', appType: '0' },
        { key: 'nested', title: '子组', children: [{ key: 'b', title: '公共', appType: '1' }] },
      ],
    },
    { key: 'target', title: '目标', children: [] },
  ]);
  const before = structuredClone(original);
  const leafMoved = moveNodeToDirectory(original, 'a', 'target');
  assert.equal(leafMoved[1].children[0].key, 'a');
  assert.equal(leafMoved[1].children[0].data.appType, '0');
  const branchMoved = moveNodeToDirectory(original, 'nested', 'target');
  assert.equal(branchMoved[1].children[0].children[0].key, 'b');
  assert.equal(countLeafNodes(branchMoved), 2);
  assert.strictEqual(moveNodeToDirectory(original, 'source', 'nested'), original);
  assert.strictEqual(moveNodeToDirectory(original, 'source', 'source'), original);
  assert.deepEqual(original, before);
  let payload;
  const service = createListService(
    {
      saveGroups: async (value) => {
        payload = value;
      },
    },
    'appGroupInfo',
    mergeApplications,
  );
  await service.save(fromTreeData(branchMoved));
  assert.equal(JSON.parse(payload.appGroupInfo)[1].children[0].children[0].appType, '1');
});

const sharedLeaf = (key) => ({ key, title: key, type: 'leaf', data: { desc: key } });
function referenceFixture() {
  return [
    { key: 'a', title: 'A', type: 'branch', children: [sharedLeaf('one'), sharedLeaf('two')] },
    {
      key: 'b',
      title: 'B',
      type: 'branch',
      children: [
        { key: 'nested', title: 'Nested', type: 'branch', children: [sharedLeaf('three')] },
      ],
    },
    { key: 'empty', title: 'Empty', type: 'branch', children: [] },
  ];
}

test('结构共享：重命名、删除、插入及移动仅替换受影响路径', () => {
  const tree = referenceFixture();
  const before = structuredClone(tree);
  const renamed = updateNodeTitle(tree, 'nested', 'Renamed');
  assert.equal(renamed[0], tree[0]);
  assert.notEqual(renamed[1], tree[1]);
  assert.equal(renamed[1].children[0].children, tree[1].children[0].children);
  assert.equal(renamed[2], tree[2]);
  const removed = removeNode(tree, 'one');
  assert.equal(removed.removed, tree[0].children[0]);
  assert.equal(removed.tree[1], tree[1]);
  const inserted = insertNode(tree, sharedLeaf('four'), 'nested', 'inside');
  assert.equal(inserted[0], tree[0]);
  assert.equal(inserted[2], tree[2]);
  const moved = moveNode(tree, 'one', 'three', 'after');
  assert.equal(moved[1].children[0].children[1], tree[0].children[0]);
  assert.equal(moved[2], tree[2]);
  const deleted = deleteBranchAndPromoteChildren(tree, 'nested', 'a');
  assert.equal(deleted[2], tree[2]);
  assert.deepEqual(tree, before);
});

test('无效和无变化操作保留根引用；无效拖拽目标不会丢失源节点', () => {
  const tree = referenceFixture();
  assert.equal(updateNodeTitle(tree, 'a', 'A'), tree);
  assert.equal(updateNodeTitle(tree, 'missing', 'A'), tree);
  assert.equal(removeNode(tree, 'missing').tree, tree);
  assert.equal(insertNode(tree, sharedLeaf('x'), 'missing', 'before'), tree);
  assert.equal(moveNode(tree, 'one', 'missing', 'before'), tree);
  assert.equal(moveNode(tree, 'one', 'three', 'inside'), tree);
  assert.equal(moveNode(tree, 'b', 'nested', 'inside'), tree);
  assert.equal(moveNode(tree, 'one', 'two', 'before'), tree);
  assert.equal(moveNodeToDirectory(tree, 'two', 'a'), tree);
});

test('树索引覆盖父子关系、叶子数量与移动后的祖先路径', () => {
  const tree = referenceFixture();
  const index = buildTreeIndex(tree);
  assert.equal(index.nodeByKey.get('three'), tree[1].children[0].children[0]);
  assert.equal(index.leafCount, 3);
  assert.deepEqual(index.ancestors('three'), ['nested', 'b']);
  assert.deepEqual(index.ancestors('missing'), []);
  const moved = buildTreeIndex(moveNodeToDirectory(tree, 'nested', 'a'));
  assert.deepEqual(moved.ancestors('three'), ['nested', 'a']);
  assert.deepEqual(index.ancestors('three'), ['nested', 'b']);
});

test('搜索一次匹配每个叶子，同时生成计数、可见分组和命中祖先', () => {
  const tree = referenceFixture();
  let calls = 0;
  const view = deriveTreeView(
    tree,
    'THREE',
    (node) => {
      calls++;
      return node.title;
    },
    undefined,
    true,
  );
  assert.equal(calls, 3);
  assert.equal(view.leafCount, 1);
  assert.deepEqual([...view.ancestorKeys], ['nested', 'b']);
  assert.deepEqual([...view.branchKeys], ['nested', 'b']);
  assert.equal(view.filteredTree[0], tree[1]);
  assert.equal(view.filteredTree.length, 1);
  const none = deriveTreeView(tree, 'missing', undefined, undefined, true);
  assert.equal(none.leafCount, 0);
  assert.equal(none.ancestorKeys.size, 0);
  assert.deepEqual(none.filteredTree, []);
  const all = deriveTreeView(tree, '');
  assert.equal(all.filteredTree, tree);
  assert.equal(all.leafCount, 3);
  assert.equal(all.branchKeys.size, 4);
  assert.equal(all.ancestorKeys.size, 0);
});

test('编辑态搜索排除空分组及仅包含空分组的祖先，清空搜索后恢复', () => {
  const tree = referenceFixture();
  tree.push({
    key: 'empty-parent',
    title: 'THREE',
    type: 'branch',
    children: [{ key: 'nested-empty', title: 'THREE', type: 'branch', children: [] }],
  });
  for (const filter of [undefined, (node) => node.key === 'three']) {
    const editing = deriveTreeView(tree, ' THREE ', undefined, filter, true);
    const browsing = deriveTreeView(tree, ' THREE ', undefined, filter, false);
    assert.deepEqual(editing, browsing);
    assert.deepEqual([...editing.branchKeys], ['nested', 'b']);
    assert.deepEqual(editing.filteredTree, [tree[1]]);
    const noMatch = deriveTreeView(tree, 'missing', undefined, filter, true);
    assert.deepEqual(noMatch.filteredTree, []);
    assert.equal(noMatch.branchKeys.size, 0);
  }
  const cleared = deriveTreeView(tree, '   ', undefined, undefined, true);
  assert.equal(cleared.filteredTree, tree);
  assert.equal(cleared.branchKeys.has('nested-empty'), true);
  // 仅类型筛选时仍允许编辑空分组，避免改变原有分组管理行为。
  const typeOnly = deriveTreeView(tree, '', undefined, () => false, true);
  assert.equal(typeOnly.branchKeys.has('empty'), true);
  assert.equal(typeOnly.branchKeys.has('empty-parent'), true);
});

for (const typeField of ['appType', 'maintType']) {
  test(`${typeField}：分类数量覆盖嵌套叶子、忽略分组，并随搜索筛选变化`, () => {
    const leaf = (key, kind) => ({ key, title: key, type: 'leaf', data: { [typeField]: kind } });
    const tree = [
      {
        key: 'group',
        title: 'Group',
        type: 'branch',
        children: [
          leaf('match-0', '0'),
          {
            key: 'nested',
            title: 'Nested',
            type: 'branch',
            children: [leaf('match-1', '1'), leaf('other-1', '1')],
          },
          { key: 'empty', title: 'Empty', type: 'branch', children: [] },
        ],
      },
      leaf('other-0', '0'),
      leaf('unknown', undefined),
    ];
    const category = (node) => node.data[typeField] ?? 'unknown';
    const total = buildTreeIndex(tree, category);
    assert.equal(total.leafCount, 5);
    assert.deepEqual(
      total.leafCountsByCategory,
      new Map([
        ['0', 2],
        ['1', 2],
        ['unknown', 1],
      ]),
    );
    const search = deriveTreeView(tree, 'match', undefined, undefined, false, category);
    assert.equal(search.leafCount, 2);
    assert.deepEqual(
      search.leafCountsByCategory,
      new Map([
        ['0', 1],
        ['1', 1],
      ]),
    );
    const filtered = deriveTreeView(
      tree,
      'match',
      undefined,
      (node) => category(node) === '1',
      true,
      category,
    );
    assert.equal(filtered.leafCount, 1);
    assert.deepEqual(filtered.leafCountsByCategory, new Map([['1', 1]]));
    assert.equal(
      deriveTreeView(tree, 'absent', undefined, undefined, true, category).leafCountsByCategory
        .size,
      0,
    );
    assert.equal(buildTreeIndex([], category).leafCountsByCategory.size, 0);
    assert.deepEqual(
      buildTreeIndex(moveNodeToDirectory(tree, 'match-1', null), category).leafCountsByCategory,
      total.leafCountsByCategory,
    );
  });
}

// 固定视口原点的预览必须只跟随指针，不受源行重新测量影响。
test('拖拽预览：展开、双向滚动及虚拟行卸载不改变指针偏移', async () => {
  const { offsetDragPreview } = await import('../src/features/grouped-list/dragPreview.ts');
  const args = {
    activatorEvent: { clientX: 100, clientY: 200 },
    transform: { x: 30, y: 50, scaleX: 1, scaleY: 1 },
    windowRect: { width: 1200, height: 900 },
  };
  for (const top of [200, 200 + 56, 200 + 56 * 100, -400, 800, null]) {
    const result = offsetDragPreview({
      ...args,
      activeNodeRect: top === null ? null : { left: 40, top },
    });
    assert.equal(result.x, 154);
    assert.equal(result.y, 322);
  }
  const moved = offsetDragPreview({
    ...args,
    transform: { ...args.transform, x: 45, y: 30 },
    activeNodeRect: null,
  });
  assert.equal(moved.x, 169);
  assert.equal(moved.y, 302);
});

test('拖拽预览：保留视口边缘避让及顶部提示空间', async () => {
  const { offsetDragPreview } = await import('../src/features/grouped-list/dragPreview.ts');
  const args = {
    activatorEvent: { clientX: 950, clientY: 790 },
    transform: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
    windowRect: { width: 1000, height: 800 },
  };
  assert.deepEqual(offsetDragPreview(args), { x: 718, y: 760, scaleX: 1, scaleY: 1 });
  assert.equal(offsetDragPreview({ ...args, transform: { ...args.transform, y: -850 } }).y, 64);
});
