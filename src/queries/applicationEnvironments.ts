/** 环境列表按系统和应用隔离，返回时可以先显示旧数据并刷新；排序不改写 HTTP 返回数组。 */
import { queryOptions } from '@tanstack/react-query';
import { loadApplicationEnvironments } from '@/api/applicationEnvironments.ts';

export function applicationEnvironmentsOptions(systemName: string, appName: string) {
  return queryOptions({
    queryKey: ['application-environments', systemName, appName],
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const items = await loadApplicationEnvironments(systemName, appName, signal);
      return items.toSorted((a, b) => a.envOrder - b.envOrder);
    },
  });
}

/** 首次挂载接收 loader 的结果，切换应用时查询键变化仍会请求最新环境。 */
export function applicationEnvironmentsPageOptions(systemName: string, appName: string) {
  return {
    ...applicationEnvironmentsOptions(systemName, appName),
    refetchOnMount: false,
    retryOnMount: false,
  };
}
