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

export function removeNode(
  tree: TreeNode[],
  key: string,
): { tree: TreeNode[]; removed: TreeNode | null } {
  let removed: TreeNode | null = null;

  const walk = (nodes: TreeNode[]): TreeNode[] => {
    const next: TreeNode[] = [];
    for (const node of nodes) {
      if (node.key === key) {
        removed = node;
        continue;
      }
      if (node.type === 'branch') {
        next.push({ ...node, children: walk(node.children) });
      } else {
        next.push(node);
      }
    }
    return next;
  };

  const newTree = walk(tree);
  return { tree: newTree, removed };
}

export function insertNode(
  tree: TreeNode[],
  node: TreeNode,
  overKey: string,
  position: DropPosition,
): TreeNode[] {
  if (position === 'inside') {
    // 拖入分组内部时，节点或目录统一插到子节点头部。
    const walk = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => {
        if (n.key === overKey && n.type === 'branch') {
          return { ...n, children: [node, ...n.children] };
        }
        if (n.type === 'branch') {
          return { ...n, children: walk(n.children) };
        }
        return n;
      });
    return walk(tree);
  }

  const walk = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const n of nodes) {
      if (n.key === overKey) {
        if (position === 'before') result.push(node, n);
        else result.push(n, node);
        continue;
      }
      if (n.type === 'branch') {
        result.push({ ...n, children: walk(n.children) });
      } else {
        result.push(n);
      }
    }
    return result;
  };

  return walk(tree);
}

// 快速移动保留整个子树，追加到目标末尾；null 表示根节点。
export function moveNodeToDirectory(
  tree: TreeNode[],
  key: string,
  destinationKey: string | null,
): TreeNode[] {
  if (!findNode(tree, key)) return tree;
  if (
    destinationKey !== null &&
    (destinationKey === key ||
      isDescendant(tree, key, destinationKey) ||
      findNode(tree, destinationKey)?.type !== 'branch')
  )
    return tree;

  const { tree: remaining, removed } = removeNode(tree, key);
  if (!removed) return tree;
  if (destinationKey === null) return [...remaining, removed];
  const append = (nodes: TreeNode[]): TreeNode[] =>
    nodes.map((node) => {
      if (node.type !== 'branch') return node;
      return {
        ...node,
        children: node.key === destinationKey ? [...node.children, removed] : append(node.children),
      };
    });
  return append(remaining);
}

export function updateNodeTitle(tree: TreeNode[], key: string, title: string): TreeNode[] {
  const walk = (nodes: TreeNode[]): TreeNode[] =>
    nodes.map((n) => {
      if (n.key === key) return { ...n, title };
      if (n.type === 'branch') return { ...n, children: walk(n.children) };
      return n;
    });
  return walk(tree);
}

// 删除目录后，将其直接子节点按原顺序追加到目标目录（null 表示根节点）。
export function deleteBranchAndPromoteChildren(
  tree: TreeNode[],
  key: string,
  destinationKey: string | null = buildParentMap(tree).get(key) ?? null,
): TreeNode[] {
  const target = findNode(tree, key);
  if (!target || target.type !== 'branch') return tree;

  // 目标不能是自身、子孙或叶子节点，避免成环或丢失子树。
  if (
    destinationKey !== null &&
    (destinationKey === key ||
      isDescendant(tree, key, destinationKey) ||
      findNode(tree, destinationKey)?.type !== 'branch')
  )
    return tree;

  const { tree: withoutTarget } = removeNode(tree, key);

  if (target.children.length === 0) {
    return withoutTarget;
  }

  if (destinationKey === null) return [...withoutTarget, ...target.children];

  const appendChildren = (nodes: TreeNode[]): TreeNode[] =>
    nodes.map((node) => {
      if (node.type !== 'branch') return node;
      if (node.key === destinationKey) {
        return { ...node, children: [...node.children, ...target.children] };
      }
      return { ...node, children: appendChildren(node.children) };
    });
  return appendChildren(withoutTarget);
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
export function filterTreeByMatchingLeaves(
  tree: TreeNode[],
  query: string,
  getSearchText: (node: LeafNode) => string = (node) => node.title,
  filterLeaf?: (node: LeafNode) => boolean,
  keepEmptyBranches = false,
): TreeNode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery && !filterLeaf) return tree;

  const walk = (nodes: TreeNode[]): TreeNode[] => {
    const filtered: TreeNode[] = [];

    for (const node of nodes) {
      if (node.type === 'leaf') {
        if (
          (!filterLeaf || filterLeaf(node)) &&
          (!normalizedQuery || getSearchText(node).toLowerCase().includes(normalizedQuery))
        )
          filtered.push(node);
        continue;
      }

      const children = walk(node.children);
      if (children.length > 0 || (keepEmptyBranches && node.children.length === 0)) {
        filtered.push({ ...node, children });
      }
    }

    return filtered;
  };

  return walk(tree);
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
