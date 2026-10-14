import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFlatIndex,
  flattenTree,
  createSearchMatcher,
  deriveTreeView,
} from '../src/components/GroupedList/model/treeUtils.ts';
import { toTreeData } from '../src/components/GroupedList/model/model.ts';

test('可见行索引：嵌套、折叠、空分组和根节点均有正确子树边界', () => {
  const tree = toTreeData([
    {
      key: 'g',
      title: 'g',
      children: [
        { key: 'a', title: 'a' },
        { key: 'h', title: 'h', children: [{ key: 'b', title: 'b' }] },
      ],
    },
    { key: 'empty', title: 'empty', children: [] },
    { key: 'c', title: 'c' },
  ]);
  for (const expanded of [new Set(), new Set(['g']), new Set(['g', 'h'])]) {
    const flat = flattenTree(tree, expanded);
    const index = buildFlatIndex(flat);
    flat.forEach((row, i) => {
      assert.equal(index.rowByKey.get(row.node.key), i);
      let expected = i;
      while (expected + 1 < flat.length && flat[expected + 1].depth > row.depth) expected++;
      assert.equal(index.subtreeEnd[i], expected);
    });
  }
  assert.deepEqual(buildFlatIndex([]).subtreeEnd, []);
});

test('搜索缓存：复用文本且数据替换后更新，筛选/计数/祖先与原算法一致', () => {
  let reads = 0;
  const getText = (node) => `${node.title} ${node.data.desc ?? ''}`;
  const matcher = createSearchMatcher((node) => {
    reads++;
    return getText(node);
  });
  const tree = toTreeData([
    {
      key: 'g',
      title: '组',
      children: [
        { key: 'a', title: 'Alpha', desc: '尾部命中', appType: '0' },
        { key: 'b', title: 'Beta', appType: '1' },
      ],
    },
  ]);
  const category = (node) => node.data.appType;
  for (const query of ['ALPHA', '尾部命中', 'beta', 'missing', '']) {
    assert.deepEqual(
      deriveTreeView(tree, query, getText, undefined, false, category, matcher),
      deriveTreeView(tree, query, getText, undefined, false, category),
    );
  }
  assert.equal(reads, 2);
  const updated = { ...tree[0].children[0], title: 'Changed' };
  assert.equal(matcher(updated, 'changed'), true);
  assert.equal(reads, 3);
});
