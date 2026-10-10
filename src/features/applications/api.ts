import { mergeApplications } from '../grouped-list/model';
import type { ApplicationItem } from '../grouped-list/types';
import { createHttpListApi, createListService } from '../grouped-list/service';
import { createLazyListApi } from '../grouped-list/lazyApi';

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
const api = baseUrl
  ? createHttpListApi<ApplicationItem, 'appGroupInfo'>({
      items: `${baseUrl}/applications`,
      groups: `${baseUrl}/applications/groups`,
    })
  : createLazyListApi(() => import('./mock').then((module) => module.createApi()));

export const applicationService = createListService(api, 'appGroupInfo', mergeApplications);

/** 每个系统工作区绑定自己的服务；组件通过 useMemo 保持实例稳定。 */
export function createSystemApplicationService(systemName: string) {
  const systemApi = baseUrl
    ? createHttpListApi<ApplicationItem, 'appGroupInfo'>({
        items: `${baseUrl}/applications`,
        groups: `${baseUrl}/applications/groups`,
        params: { systemName },
      })
    : createLazyListApi(() => import('./mock').then((module) => module.createApi(systemName)));
  return createListService(systemApi, 'appGroupInfo', mergeApplications);
}
