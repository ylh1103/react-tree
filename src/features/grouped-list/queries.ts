import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { GroupedListService } from './types';

export type GroupedListId = 'applications' | 'parameters';

export const groupedListKeys = {
  list: (id: GroupedListId) => ['grouped-list', id] as const,
  write: (id: GroupedListId) => ['grouped-list-write', id] as const,
};

export function groupedListOptions(id: GroupedListId, service: GroupedListService) {
  return queryOptions({
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
