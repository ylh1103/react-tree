import type { TreeNode } from './types';

export function buildDirectoryDestinations(tree: TreeNode[], excludedKey: string) {
  // 用数字值区分根节点与业务 key，并排除整个源子树。
  const destinationKeys: (string | null)[] = [null];
  type DirectoryOption = { title: string; value: number; children: DirectoryOption[] };
  const walk = (nodes: TreeNode[]): DirectoryOption[] =>
    nodes.flatMap((node) => {
      if (node.type !== 'branch' || node.key === excludedKey) return [];
      const value = destinationKeys.push(node.key) - 1;
      return [{ title: node.title || '未命名分组', value, children: walk(node.children) }];
    });
  const treeData = [{ title: '根节点', value: 0, children: walk(tree) }];
  return { destinationKeys, treeData };
}
