import type { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/react-query';

/** 冷启动等待结果；已有缓存时刷新放到后台，错误由页面展示。 */
export function preloadRouteQuery<TData, TError = Error, TKey extends QueryKey = QueryKey>(
  client: QueryClient,
  options: FetchQueryOptions<TData, TError, TData, TKey>,
  hasTarget?: (data: TData) => boolean,
) {
  const cached = client.getQueryData<TData>(options.queryKey);
  const missingTarget = cached !== undefined && hasTarget && !hasTarget(cached);
  const refresh = client.prefetchQuery(missingTarget ? { ...options, staleTime: 0 } : options);
  return cached === undefined || missingTarget ? refresh : Promise.resolve();
}

/** loader 失败后不在页面挂载时自动再请求，保留显式重试入口。 */
export const routeQueryMountOptions = {
  retryOnMount: false,
  refetchOnMount: (query: { state: { status: string } }) => query.state.status !== 'error',
};
