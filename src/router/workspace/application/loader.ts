/** 授权后并行预取应用清单和目标环境；已挂载工作区切换应用时由页面查询环境。 */
import type { LoaderFunctionArgs } from 'react-router';
import { applicationEnvironmentsOptions } from '@/queries/applicationEnvironments.ts';
import { queryClient } from '@/queries/client.ts';
import { applicationListId, groupedListKeys, hasApplication } from '@/queries/groupedList.ts';
import { preloadRouteQuery } from '@/queries/routeQuery.ts';
import { getCommittedRouteParams } from '../../middleware/systemAccess.ts';

export const applicationWorkspaceRouteId = 'application-workspace';

async function preloadList(systemName: string, appName: string | undefined, signal: AbortSignal) {
  const mutationKey = groupedListKeys.write(applicationListId(systemName));
  if (queryClient.isMutating({ mutationKey })) return;
  const { systemApplicationListOptions } = await import('@/queries/applications.ts');
  signal.throwIfAborted();
  // 动态导入期间可能开始保存，读取前再确认写入锁。
  if (queryClient.isMutating({ mutationKey })) return;
  return preloadRouteQuery(
    queryClient,
    systemApplicationListOptions(systemName),
    appName ? (nodes) => hasApplication(nodes, appName) : undefined,
  );
}

export async function preloadApplications({ params, request, context }: LoaderFunctionArgs) {
  const { systemName, appName } = params;
  if (!systemName) return null;
  request.signal.throwIfAborted();
  const current = getCommittedRouteParams(context, applicationWorkspaceRouteId);
  const switchingApplication = current?.systemName === systemName && current.appName !== appName;
  await Promise.all([
    preloadList(systemName, appName, request.signal),
    appName && !switchingApplication
      ? preloadRouteQuery(queryClient, applicationEnvironmentsOptions(systemName, appName))
      : undefined,
  ]);
  return null;
}
