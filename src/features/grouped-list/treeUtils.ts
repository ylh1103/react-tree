import type { TreeNode, FlatNode, DropPosition, LeafNode } from './types';

// 顺序与层级都是树结构的一部分；编辑操作保留叶子 data 的引用。
export function areTreesEqual(left: TreeNode[], right: TreeNode[]): boolean {
  if (left === right) return true;
  if (left.length !== right.length) return false;
  return left.every((node, index) => {
    const other = right[index];
    if (node === other) return true;
    if (node.key !== other.key || node.type !== other.type || node.title !== other.title) {
      return false;
    }
    if (node.type === 'branch' && other.type === 'branch') {
      return areTreesEqual(node.children, other.children);
    }
    return node.type === 'leaf' && other.type === 'leaf' && Object.is(node.data, other.data);
  });
}

/** 按展示顺序展开可见节点；折叠子树不占虚拟列表行，depth 用于缩进和子树边界判断。 */
export function flattenTree(tree: TreeNode[], expandedKeys: Set<string>): FlatNode[] {
  const result: FlatNode[] = [];

  const walk = (nodes: TreeNode[], depth: number, parentKey: string | null) => {
    for (const node of nodes) {
      result.push({ node, depth, parentKey });
      if (node.type === 'branch' && expandedKeys.has(node.key)) {
        walk(node.children, depth + 1, node.key);
      }
    }
  };

  walk(tree, 0, null);
  return result;
}

export function buildParentMap(tree: TreeNode[]): Map<string, string | null> {
  const map = new Map<string, string | null>();

  const walk = (nodes: TreeNode[], parentKey: string | null) => {
    for (const node of nodes) {
      map.set(node.key, parentKey);
      if (node.type === 'branch') {
        walk(node.children, node.key);
      }
    }
  };

  walk(tree, null);
  return map;
}

export function findNode(tree: TreeNode[], key: string): TreeNode | null {
  for (const node of tree) {
    if (node.key === key) return node;
    if (node.type === 'branch') {
      const found = findNode(node.children, key);
      if (found) return found;
    }
  }
  return null;
}

export function isDescendant(
  tree: TreeNode[],
  ancestorKey: string,
  maybeDescendantKey: string,
): boolean {
  const ancestor = findNode(tree, ancestorKey);
  if (!ancestor || ancestor.type !== 'branch') return false;

  const walk = (nodes: TreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.key === maybeDescendantKey) return true;
      if (node.type === 'branch' && walk(node.children)) return true;
    }
    return false;
  };

  return walk(ancestor.children);
}

export function getAncestorKeys(tree: TreeNode[], targetKey: string): string[] {
  const parentMap = buildParentMap(tree);
  const ancestors: string[] = [];
  let current = parentMap.get(targetKey) ?? null;
  while (current) {
    ancestors.push(current);
    current = parentMap.get(current) ?? null;
  }
  return ancestors;
}

/** 只复制目标所在路径；没有变化时保留整棵树引用。 */
function transformNode(
  tree: TreeNode[],
  key: string,
  transform: (node: TreeNode) => TreeNode[],
): TreeNode[] {
  for (let index = 0; index < tree.length; index++) {
    const node = tree[index];
    if (node.key === key) {
      const replacement = transform(node);
      if (replacement.length === 1 && replacement[0] === node) return tree;
      return [...tree.slice(0, index), ...replacement, ...tree.slice(index + 1)];
    }
    if (node.type === 'branch') {
      const children = transformNode(node.children, key, transform);
      if (children !== node.children) {
        const next = tree.slice();
        next[index] = { ...node, children };
        return next;
      }
    }
  }
  return tree;
}

export function removeNode(
  tree: TreeNode[],
  key: string,
): { tree: TreeNode[]; removed: TreeNode | null } {
  let removed: TreeNode | null = null;
  const next = transformNode(tree, key, (node) => {
    removed = node;
    return [];
  });
  return { tree: next, removed };
}

export function insertNode(
  tree: TreeNode[],
  node: TreeNode,
  overKey: string,
  position: DropPosition,
): TreeNode[] {
  return transformNode(tree, overKey, (target) => {
    if (position === 'inside') {
      return target.type === 'branch'
        ? [{ ...target, children: [node, ...target.children] }]
        : [target];
    }
    return position === 'before' ? [node, target] : [target, node];
  });
}

/** 移动前验证目标，防止先移除节点后发现目标无效而丢失数据。 */
export function moveNode(
  tree: TreeNode[],
  key: string,
  overKey: string,
  position: DropPosition,
): TreeNode[] {
  const target = findNode(tree, overKey);
  if (
    key === overKey ||
    !target ||
    (position === 'inside' && target.type !== 'branch') ||
    isDescendant(tree, key, overKey)
  )
    return tree;
  const { tree: remaining, removed } = removeNode(tree, key);
  if (!removed) return tree;
  const next = insertNode(remaining, removed, overKey, position);
  return areTreesEqual(tree, next) ? tree : next;
}

// 快速移动保留整个子树，追加到目标末尾；null 表示根节点。
export function moveNodeToDirectory(
  tree: TreeNode[],
  key: string,
  destinationKey: string | null,
): TreeNode[] {
  if (
    destinationKey !== null &&
    (destinationKey === key ||
      isDescendant(tree, key, destinationKey) ||
      findNode(tree, destinationKey)?.type !== 'branch')
  )
    return tree;
  const { tree: remaining, removed } = removeNode(tree, key);
  if (!removed) return tree;
  const next =
    destinationKey === null
      ? [...remaining, removed]
      : transformNode(remaining, destinationKey, (node) =>
          node.type === 'branch' ? [{ ...node, children: [...node.children, removed] }] : [node],
        );
  return areTreesEqual(tree, next) ? tree : next;
}

export function updateNodeTitle(tree: TreeNode[], key: string, title: string): TreeNode[] {
  return transformNode(tree, key, (node) => [node.title === title ? node : { ...node, title }]);
}

// 删除目录后，将其直接子节点按原顺序追加到目标目录（null 表示根节点）。
export function deleteBranchAndPromoteChildren(
  tree: TreeNode[],
  key: string,
  destinationKey: string | null = buildParentMap(tree).get(key) ?? null,
): TreeNode[] {
  const target = findNode(tree, key);
  if (!target || target.type !== 'branch') return tree;
  if (
    destinationKey !== null &&
    (destinationKey === key ||
      isDescendant(tree, key, destinationKey) ||
      findNode(tree, destinationKey)?.type !== 'branch')
  )
    return tree;
  const { tree: remaining } = removeNode(tree, key);
  if (target.children.length === 0) return remaining;
  if (destinationKey === null) return [...remaining, ...target.children];
  return transformNode(remaining, destinationKey, (node) =>
    node.type === 'branch'
      ? [{ ...node, children: [...node.children, ...target.children] }]
      : [node],
  );
}

/** 为完整树建立查询索引，统计不受折叠或搜索影响；ancestors 按父级到根级返回。 */
export function buildTreeIndex(
  tree: TreeNode[],
  getLeafCategory?: (node: LeafNode) => string | undefined,
) {
  const nodeByKey = new Map<string, TreeNode>();
  const parentByKey = new Map<string, string | null>();
  const leafCountsByCategory = new Map<string, number>();
  let leafCount = 0;
  const walk = (nodes: TreeNode[], parentKey: string | null) => {
    for (const node of nodes) {
      nodeByKey.set(node.key, node);
      parentByKey.set(node.key, parentKey);
      if (node.type === 'branch') walk(node.children, node.key);
      else {
        leafCount++;
        const category = getLeafCategory?.(node);
        if (category !== undefined)
          leafCountsByCategory.set(category, (leafCountsByCategory.get(category) ?? 0) + 1);
      }
    }
  };
  walk(tree, null);
  const ancestors = (key: string): string[] => {
    const keys: string[] = [];
    let parent = parentByKey.get(key);
    while (parent != null) {
      keys.push(parent);
      parent = parentByKey.get(parent);
    }
    return keys;
  };
  return { nodeByKey, parentByKey, leafCount, leafCountsByCategory, ancestors };
}

export function highlightText(text: string, query: string): { text: string; match: boolean }[] {
  if (!query) return [{ text, match: false }];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let start = 0;
  let idx = lowerText.indexOf(lowerQuery, start);

  if (idx === -1) return [{ text, match: false }];

  while (idx !== -1) {
    if (idx > start) parts.push({ text: text.slice(start, idx), match: false });
    parts.push({ text: text.slice(idx, idx + query.length), match: true });
    start = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, start);
  }
  if (start < text.length) parts.push({ text: text.slice(start), match: false });

  return parts;
}

export function collectMatchingLeafAncestors(
  tree: TreeNode[],
  query: string,
  getSearchText: (node: LeafNode) => string = (node) => node.title,
): Set<string> {
  const ancestorKeys = new Set<string>();
  if (!query) return ancestorKeys;
  const lowerQuery = query.toLowerCase();

  const walk = (nodes: TreeNode[], ancestors: string[]) => {
    for (const node of nodes) {
      if (node.type === 'leaf') {
        if (getSearchText(node).toLowerCase().includes(lowerQuery)) {
          ancestors.forEach((a) => ancestorKeys.add(a));
        }
      } else {
        walk(node.children, [...ancestors, node.key]);
      }
    }
  };

  walk(tree, []);
  return ancestorKeys;
}

// 搜索时只保留命中的叶子节点，以及通往这些叶子节点的目录路径。
// 返回新目录对象以免修改原始树；叶子节点本身可安全复用。
export function deriveTreeView(
  tree: TreeNode[],
  query: string,
  getSearchText: (node: LeafNode) => string = (node) => node.title,
  filterLeaf?: (node: LeafNode) => boolean,
  keepEmptyBranches = false,
  getLeafCategory?: (node: LeafNode) => string | undefined,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltered = Boolean(normalizedQuery || filterLeaf);
  const branchKeys = new Set<string>();
  const ancestorKeys = new Set<string>();
  const leafCountsByCategory = new Map<string, number>();
  let leafCount = 0;
  const walk = (nodes: TreeNode[]): TreeNode[] => {
    const filtered: TreeNode[] = [];
    for (const node of nodes) {
      if (node.type === 'leaf') {
        if (
          (!filterLeaf || filterLeaf(node)) &&
          (!normalizedQuery || getSearchText(node).toLowerCase().includes(normalizedQuery))
        ) {
          filtered.push(node);
          leafCount++;
          const category = getLeafCategory?.(node);
          if (category !== undefined)
            leafCountsByCategory.set(category, (leafCountsByCategory.get(category) ?? 0) + 1);
        }
        continue;
      }
      const before = leafCount;
      const children = walk(node.children);
      // 编辑态只在没有搜索词时保留空分组；搜索结果始终只包含命中叶子的路径。
      if (
        !isFiltered ||
        children.length > 0 ||
        (keepEmptyBranches && !normalizedQuery && node.children.length === 0)
      ) {
        filtered.push(children === node.children ? node : { ...node, children });
        branchKeys.add(node.key);
        if (normalizedQuery && leafCount > before) ancestorKeys.add(node.key);
      }
    }
    return filtered.length === nodes.length &&
      filtered.every((node, index) => node === nodes[index])
      ? nodes
      : filtered;
  };
  const filteredTree = walk(tree);
  return { filteredTree, leafCount, leafCountsByCategory, branchKeys, ancestorKeys };
}

export function filterTreeByMatchingLeaves(
  tree: TreeNode[],
  query: string,
  getSearchText?: (node: LeafNode) => string,
  filterLeaf?: (node: LeafNode) => boolean,
  keepEmptyBranches = false,
): TreeNode[] {
  return deriveTreeView(tree, query, getSearchText, filterLeaf, keepEmptyBranches).filteredTree;
}

export function generateKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** 统计完整层级中的叶子，分组和空分组不计入数量。 */
export function countLeafNodes(tree: TreeNode[]): number {
  let count = 0;
  for (const node of tree) {
    count += node.type === 'leaf' ? 1 : countLeafNodes(node.children);
  }
  return count;
}
