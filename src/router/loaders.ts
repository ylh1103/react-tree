/**
 * 静态路由 loader：在页面 chunk 加载时预取数据，并与页面共用缓存。
 * 同系统切换选中项通常复用清单；缓存缺少目标时重新验证，应用写入期间暂缓预取。
 */
import type { LoaderFunctionArgs, ShouldRevalidateFunction } from 'react-router';
import { queryClient } from '@/queries/client.ts';
import { preloadRouteQuery } from '@/queries/routeQuery.ts';
import { applicationEnvironmentsOptions } from '@/queries/applicationEnvironments.ts';
import { mySystemsOptions, parameterTypesOptions } from '@/queries/systems.ts';
import type { ListNode } from '@/components/GroupedList/types.ts';
import {
  applicationListId,
  groupedListKeys,
  groupedListOptions,
  hasApplication,
} from '@/queries/groupedList.ts';

/** 列表按系统缓存，切换列表中的应用/类型无需重新运行整页 loader。 */
export const revalidateSystemCollection: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  if (
    !formMethod &&
    currentParams.systemName === nextParams.systemName &&
    currentUrl.pathname !== nextUrl.pathname &&
    currentUrl.search === nextUrl.search
  ) {
    if (
      nextParams.appName &&
      !hasApplication(
        queryClient.getQueryData<ListNode[]>(
          groupedListKeys.list(applicationListId(nextParams.systemName!)),
        ) ?? [],
        nextParams.appName,
      )
    )
      return defaultShouldRevalidate;
    if (
      nextParams.paramTypeName &&
      !queryClient
        .getQueryData(parameterTypesOptions(nextParams.systemName!).queryKey)
        ?.some((item) => item.paramTypeName === nextParams.paramTypeName)
    )
      return defaultShouldRevalidate;
    return false;
  }
  return defaultShouldRevalidate;
};

/** 静态 loader 与 route.lazy 并行执行；请求结果沿用页面的 Query 缓存。 */
export async function preloadSystems(args?: LoaderFunctionArgs) {
  const systemName = args?.params.systemName;
  args?.request?.signal.throwIfAborted();
  // 系统授权由父路由 middleware 前置执行；工作区内重跑 loader 不重复刷新切换器目录。
  // 首页仍按原策略刷新我的系统，目录写入可通过失效查询触发更新。
  await preloadRouteQuery(
    queryClient,
    systemName ? { ...mySystemsOptions(), staleTime: Infinity } : mySystemsOptions(),
  );
  return null;
}

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

export async function preloadApplications({ params, request }: LoaderFunctionArgs) {
  if (!params.systemName) return null;
  request?.signal.throwIfAborted();
  const id = applicationListId(params.systemName);
  // 与页面共用写入锁，避免导航预取读取尚未提交的数据。
  if (queryClient.isMutating({ mutationKey: groupedListKeys.write(id) })) return null;
  const { createSystemApplicationService } = await import('@/queries/applications.ts');
  if (queryClient.isMutating({ mutationKey: groupedListKeys.write(id) })) return null;
  // 授权完成后并行读取清单和目标环境，直达应用 URL 时不等待清单再请求配置。
  await Promise.all([
    preloadRouteQuery(
      queryClient,
      groupedListOptions(id, createSystemApplicationService(params.systemName)),
      params.appName ? (nodes) => hasApplication(nodes, params.appName!) : undefined,
    ),
    params.appName
      ? preloadRouteQuery(
          queryClient,
          applicationEnvironmentsOptions(params.systemName, params.appName),
        )
      : Promise.resolve(),
  ]);
  return null;
}
