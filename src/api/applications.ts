/** 应用清单和分组始终按正常 HTTP 契约调用，服务实例绑定系统维度。 */
import { requestData } from '@/http/request.ts';
import type { ApplicationDetails, ApplicationItem } from '@/types/applications.ts';
import { createHttpListApi } from './grouped-list/httpApi.ts';
export const applicationApi = createHttpListApi<ApplicationItem, 'appGroupInfo'>({
  items: '/api/applications',
  groups: '/api/applications/groups',
});
export function createSystemApplicationApi(systemName: string) {
  return createHttpListApi<ApplicationItem, 'appGroupInfo'>({
    items: '/api/applications',
    groups: '/api/applications/groups',
    params: { systemName },
  });
}

/** 清单和编辑详情独立读取，仅打开编辑时获取完整字段。 */
export function loadApplicationDetails(systemName: string, appName: string, signal?: AbortSignal) {
  return requestData<ApplicationDetails>({
    url: '/api/applications/detail',
    params: { systemName, appName },
    signal,
  });
}

export function saveApplication(systemName: string, details: ApplicationDetails, editing: boolean) {
  return requestData<ApplicationItem>({
    url: '/api/applications',
    method: editing ? 'PATCH' : 'POST',
    params: { systemName },
    data: details,
  });
}
