import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { GroupedListService, ListNode } from './types';
import { routeQueryMountOptions } from '../../lib/routeQuery.ts';

export type GroupedListId = 'applications' | 'parameters' | `applications:${string}`;

export const applicationListId = (systemName: string): GroupedListId =>
  `applications:${systemName}`;

export function hasApplication(nodes: ListNode[], name: string): boolean {
  return nodes.some((node) =>
    node.children ? hasApplication(node.children, name) : node.key === name,
  );
}

export const groupedListKeys = {
  list: (id: GroupedListId) => ['grouped-list', id] as const,
  write: (id: GroupedListId) => ['grouped-list-write', id] as const,
};

export function groupedListOptions(id: GroupedListId, service: GroupedListService) {
  return queryOptions({
    ...routeQueryMountOptions,
    queryKey: groupedListKeys.list(id),
    queryFn: ({ signal }) => service.load(signal),
  });
}

/** 组件和业务操作共用入口。写入期间只标记过期，写入结束后统一重新获取。 */
export function refreshGroupedList(client: QueryClient, id: GroupedListId) {
  return client.invalidateQueries({
    queryKey: groupedListKeys.list(id),
    exact: true,
    refetchType: client.isMutating({ mutationKey: groupedListKeys.write(id) }) ? 'none' : 'active',
  });
}
