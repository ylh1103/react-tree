/** 预取系统的数据库参数类型；缓存缺少目标类型时重新获取清单。 */
import type { LoaderFunctionArgs } from 'react-router';
import { queryClient } from '@/queries/client.ts';
import { preloadRouteQuery } from '@/queries/routeQuery.ts';
import { parameterTypesOptions } from '@/queries/systems.ts';

export async function preloadDatabase({ params, request }: LoaderFunctionArgs) {
  if (params.systemName) {
    request?.signal.throwIfAborted();
    await preloadRouteQuery(
      queryClient,
      parameterTypesOptions(params.systemName),
      params.paramTypeName
        ? (items) => items.some((item) => item.paramTypeName === params.paramTypeName)
        : undefined,
    );
  }
  return null;
}
