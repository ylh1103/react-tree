/**
 * 路由数据预取策略：首次或目标缺失时等待，已有可用缓存时后台更新。
 * 普通预取的错误保存在 Query 状态中，由页面提供重试；授权查询独立传播错误。
 * 挂载时不自动重复失败请求。
 */
import type { QueryClient, QueryExecuteOptions, QueryKey } from '@tanstack/react-query';

/** 冷启动等待结果；已有缓存时刷新放到后台，错误由页面展示。 */
export function preloadRouteQuery<TData, TError = Error, TKey extends QueryKey = QueryKey>(
  client: QueryClient,
  options: QueryExecuteOptions<TData, TError, TData, TData, TKey>,
  hasTarget?: (data: TData) => boolean,
): Promise<void> {
  const cached = client.getQueryData<TData>(options.queryKey);
  // 有缓存但找不到 URL 指定目标时，先取最新清单再判断不存在，避免旧缓存造成误报。
  const missingTarget = cached !== undefined && hasTarget && !hasTarget(cached);
  // query 默认传播失败；仅普通页面预取在此消费错误，保持页面错误反馈和后台刷新行为。
  const refresh = client
    .query(missingTarget ? { ...options, staleTime: 0 } : options)
    .then(() => undefined)
    .catch(() => {});
  return cached === undefined || missingTarget ? refresh : Promise.resolve();
}

/** loader 失败后不在页面挂载时自动再请求，保留显式重试入口。 */
export const routeQueryMountOptions = {
  retryOnMount: false,
  refetchOnMount: (query: { state: { status: string } }) => query.state.status !== 'error',
};
