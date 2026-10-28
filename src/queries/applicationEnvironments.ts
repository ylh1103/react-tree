/** 环境列表按系统和应用隔离缓存；排序不改写 HTTP 返回数组，loader 与页面共用选项。 */
import { queryOptions } from '@tanstack/react-query';
import { loadApplicationEnvironments } from '@/api/applicationEnvironments.ts';
import { routeQueryMountOptions } from './routeQuery.ts';

export function applicationEnvironmentsOptions(systemName: string, appName: string) {
  return queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['application-environments', systemName, appName],
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const items = await loadApplicationEnvironments(systemName, appName, signal);
      return items.toSorted((a, b) => a.envOrder - b.envOrder);
    },
  });
}
