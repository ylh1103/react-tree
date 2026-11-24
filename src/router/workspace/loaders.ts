/** 预取系统切换器数据，并为应用和数据库清单共用路由重校验规则。 */
import type { LoaderFunctionArgs, ShouldRevalidateFunction } from 'react-router';
import { queryClient } from '@/queries/client.ts';
import { preloadRouteQuery } from '@/queries/routeQuery.ts';
import { mySystemsOptions, parameterTypesOptions } from '@/queries/systems.ts';
import type { ListNode } from '@/components/GroupedList/types.ts';
import { applicationListId, groupedListKeys, hasApplication } from '@/queries/groupedList.ts';

/** 列表按系统缓存，切换列表中的应用/类型无需重新运行整页 loader。 */
export const revalidateSystemCollection: ShouldRevalidateFunction = ({
  currentParams,
  nextParams,
  currentUrl,
  nextUrl,
  formMethod,
  defaultShouldRevalidate,
}) => {
  const { systemName, appName, paramTypeName } = nextParams;
  if (
    formMethod ||
    !systemName ||
    currentParams.systemName !== systemName ||
    currentUrl.pathname === nextUrl.pathname ||
    currentUrl.search !== nextUrl.search
  )
    return defaultShouldRevalidate;

  if (!defaultShouldRevalidate) return false;

  if (appName) {
    const applications = queryClient.getQueryData<ListNode[]>(
      groupedListKeys.list(applicationListId(systemName)),
    );
    return !hasApplication(applications ?? [], appName);
  }
  if (paramTypeName) {
    const parameterTypes = queryClient.getQueryData(parameterTypesOptions(systemName).queryKey);
    return !parameterTypes?.some((item) => item.paramTypeName === paramTypeName);
  }
  return false;
};

/** 供工作区切换器读取已加入系统，目录写入后通过失效查询刷新。 */
export async function preloadSystems({ request }: LoaderFunctionArgs) {
  request.signal.throwIfAborted();
  await preloadRouteQuery(queryClient, { ...mySystemsOptions(), staleTime: Infinity });
  return null;
}
