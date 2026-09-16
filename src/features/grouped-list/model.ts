import type { TreeNode } from '../../components/VirtualTree/types';

export interface ListNode {
  key: string;
  title: string;
  desc?: string;
  appType?: '0' | '1';
  maintType?: '0' | '1';
  // 存在 children 即为分组，空数组表示空分组；叶子不带 children。
  children?: ListNode[];
}

export interface ApplicationItem {
  appName: string;
  appDesc: string;
  appType: '0' | '1';
}
export interface ParameterItem {
  paramTypeName: string;
  paramTypeDesc: string;
  maintType: '0' | '1';
}

export function parseGroups(value: string | null): ListNode[] {
  if (value === null) return [];
  const parsed: unknown = JSON.parse(value);
  function validate(nodes: unknown): asserts nodes is ListNode[] {
    if (!Array.isArray(nodes)) throw new Error('分组信息必须是 JSON 数组');
    for (const node of nodes) {
      if (
        !node ||
        typeof node !== 'object' ||
        typeof node.key !== 'string' ||
        !node.key ||
        typeof node.title !== 'string' ||
        (node.desc !== undefined && typeof node.desc !== 'string')
      ) {
        throw new Error('分组节点格式不正确');
      }
      if ('children' in node) validate(node.children);
    }
  }
  validate(parsed);
  return parsed;
}

/** 清单是叶子数据的唯一来源；分组只负责结构与顺序。 */
export function mergeGroups(items: ListNode[], groupInfo: string | null): ListNode[] {
  const groups = parseGroups(groupInfo);
  const catalog = new Map(items.map((item) => [item.key, item]));
  if (
    catalog.size !== items.length ||
    items.some((item) => !item.key || item.children !== undefined)
  ) {
    throw new Error('清单名称必须非空且唯一，清单中不能包含分组');
  }
  const seenLeaves = new Set<string>();
  const seenGroups = new Set<string>();
  const walk = (nodes: ListNode[]): ListNode[] =>
    nodes.flatMap((node): ListNode[] => {
      if (node.children !== undefined) {
        if (seenGroups.has(node.key) || catalog.has(node.key)) {
          throw new Error('分组 key 必须唯一且不能与清单名称重复');
        }
        seenGroups.add(node.key);
        return [{ ...node, children: walk(node.children) }];
      }
      const item = catalog.get(node.key);
      if (!item || seenLeaves.has(node.key)) return [];
      seenLeaves.add(node.key);
      return [{ ...item }];
    });
  const result = walk(groups);
  for (const item of items) {
    if (!seenLeaves.has(item.key)) result.push({ ...item });
  }
  return result;
}

export function mergeApplications(items: ApplicationItem[], groups: string | null): ListNode[] {
  return mergeGroups(
    items.map(({ appName, appDesc, appType }) => ({
      key: appName,
      title: appName,
      desc: appDesc,
      ...(appType !== undefined ? { appType } : {}),
    })),
    groups,
  );
}

export function mergeParameters(items: ParameterItem[], groups: string | null): ListNode[] {
  return mergeGroups(
    items.map(({ paramTypeName, paramTypeDesc, maintType }) => ({
      key: paramTypeName,
      title: paramTypeName,
      desc: paramTypeDesc,
      ...(maintType !== undefined ? { maintType } : {}),
    })),
    groups,
  );
}

export function toTreeData(nodes: ListNode[]): TreeNode[] {
  return nodes.map((node) =>
    node.children !== undefined
      ? {
          key: node.key,
          title: node.title,
          desc: node.desc,
          type: 'branch',
          children: toTreeData(node.children),
        }
      : { key: node.key, title: node.title, type: 'leaf', data: node },
  );
}

export function fromTreeData(nodes: TreeNode[]): ListNode[] {
  return nodes.map((node) =>
    node.type === 'branch'
      ? {
          key: node.key,
          title: node.title,
          ...(node.desc !== undefined ? { desc: node.desc } : {}),
          children: fromTreeData(node.children),
        }
      : { ...(node.data as ListNode), key: node.key, title: node.title },
  );
}
