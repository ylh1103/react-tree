/** 应用清单和分组始终按正常 HTTP 契约调用，服务实例绑定系统维度。 */
import type { ApplicationItem } from '../types/applications.ts';
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
