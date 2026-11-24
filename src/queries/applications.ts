/**
 * 把原始应用 API 组装成分组列表服务，不在 UI 内重复实现清单/分组合并。
 * 系统服务绑定一个 systemName；组件通过 useMemo 保持实例稳定，缓存身份由列表查询键决定。
 */
import { queryOptions } from '@tanstack/react-query';
import { createSystemApplicationApi, loadApplicationDetails } from '@/api/applications.ts';
import { mergeApplications } from '@/components/GroupedList/model/model.ts';
import { createListService } from '@/components/GroupedList/model/service.ts';
import { applicationListId, groupedListOptions } from './groupedList.ts';

/** 每个系统工作区绑定自己的服务；组件通过 useMemo 保持实例稳定。 */
export function createSystemApplicationService(systemName: string) {
  return createListService(
    createSystemApplicationApi(systemName),
    'appGroupInfo',
    mergeApplications,
  );
}

/** loader 和应用页按同一个系统清单键读取；页面可复用自己的可写服务。 */
export function systemApplicationListOptions(
  systemName: string,
  service = createSystemApplicationService(systemName),
) {
  return groupedListOptions(applicationListId(systemName), service);
}

/** 编辑详情按系统与应用隔离，并沿用 Query 的取消信号。 */
export function applicationDetailsOptions(systemName: string, appName: string) {
  return queryOptions({
    queryKey: ['application-details', systemName, appName],
    queryFn: ({ signal }) => loadApplicationDetails(systemName, appName, signal),
  });
}
