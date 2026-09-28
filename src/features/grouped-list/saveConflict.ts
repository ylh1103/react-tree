import type { ListNode } from './types';

const conflictMessage =
  '分组结构或清单已被其他用户修改，本次未保存，当前输入已保留。请取消编辑并刷新列表后重新操作。';

/** 保存前的尽力检查；查询与写入之间的并发窗口仍需后端版本校验才能消除。 */
export function reconcileGroupSave(
  baseline: ListNode[],
  draft: ListNode[],
  latest: ListNode[],
): ListNode[] {
  const index = (nodes: ListNode[]) => {
    const result = new Map<string, ListNode>();
    const walk = (items: ListNode[]) => {
      for (const node of items) {
        if (result.has(node.key)) throw new Error(conflictMessage);
        result.set(node.key, node);
        if (node.children !== undefined) walk(node.children);
      }
    };
    walk(nodes);
    return result;
  };
  const baseByKey = index(baseline);
  const draftByKey = index(draft);
  const latestByKey = index(latest);
  // 叶子的描述、类型等以最新业务清单为准，不作为分组冲突。
  const structure = (nodes: ListNode[]): unknown[] =>
    nodes.flatMap((node): unknown[] => {
      if (node.children !== undefined) {
        return [[node.key, node.title, node.desc ?? null, structure(node.children)]];
      }
      return baseByKey.has(node.key) ? [[node.key]] : [];
    });
  if (JSON.stringify(structure(baseline)) !== JSON.stringify(structure(latest))) {
    throw new Error(conflictMessage);
  }
  const additions = new Map<string | null, ListNode[]>();
  const collect = (nodes: ListNode[], parent: string | null) => {
    for (const node of nodes) {
      if (node.children !== undefined) {
        collect(node.children, node.key);
      } else if (!baseByKey.has(node.key)) {
        // 新应用所在分组被本地删除、或 key 与本地新分组碰撞时，不猜测归属。
        if (draftByKey.has(node.key) || (parent !== null && !draftByKey.has(parent))) {
          throw new Error(conflictMessage);
        }
        const siblings = additions.get(parent) ?? [];
        siblings.push(node);
        additions.set(parent, siblings);
      }
    }
  };
  collect(latest, null);
  const merge = (nodes: ListNode[], parent: string | null): ListNode[] => [
    ...nodes.map((node) => {
      if (node.children !== undefined) {
        return { ...node, children: merge(node.children, node.key) };
      }
      const current = latestByKey.get(node.key);
      if (!current || current.children !== undefined) throw new Error(conflictMessage);
      return { ...current };
    }),
    ...(additions.get(parent) ?? []).map((node) => ({ ...node })),
  ];
  return merge(draft, null);
}
