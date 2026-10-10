import { queryOptions } from '@tanstack/react-query';
import { requestData } from '../../lib/http';
import type { ApplicationItem, ParameterItem } from '../grouped-list/types';
import type { ParameterType, SystemInfo } from './types';

/** 系统接口尚未提供：仅在配置真实地址后发起请求，不猜测后端路由。 */
export async function loadSystems(signal?: AbortSignal): Promise<SystemInfo[]> {
  const url = import.meta.env.VITE_SYSTEMS_API_URL;
  if (url) return requestData<SystemInfo[]>({ url, signal });
  const { mockSystems } = await import('./mock');
  return structuredClone(mockSystems);
}

export const systemsOptions = () =>
  queryOptions({
    queryKey: ['systems', 'mine'],
    queryFn: ({ signal }) => loadSystems(signal),
  });

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');

export function applicationsOptions(systemName: string) {
  return queryOptions({
    queryKey: ['systems', systemName, 'applications'],
    queryFn: async ({ signal }): Promise<ApplicationItem[]> => {
      if (baseUrl)
        return requestData({ url: `${baseUrl}/applications`, params: { systemName }, signal });
      const { mockSystems } = await import('./mock');
      if (mockSystems.find((system) => system.systemName === systemName)?.appCount === 0) return [];
      const { createMockApplications } = await import('../applications/mock');
      if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
      return createMockApplications();
    },
  });
}

export function parameterTypesOptions(systemName: string) {
  return queryOptions({
    queryKey: ['systems', systemName, 'database-types'],
    queryFn: async ({ signal }): Promise<ParameterType[]> => {
      let items: ParameterItem[];
      if (baseUrl) {
        items = await requestData({ url: `${baseUrl}/parameters`, params: { systemName }, signal });
      } else {
        const { mockSystems } = await import('./mock');
        if (mockSystems.find((system) => system.systemName === systemName)?.paramTypeCount === 0)
          return [];
        const { createMockParameters } = await import('../parameters/mock');
        if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
        items = createMockParameters();
      }
      // setting 为静态设置路由的保留名称，不能作为类型入口。
      return items
        .filter((item) => item.paramTypeName !== 'setting')
        .map((item) => ({
          paramTypeName: item.paramTypeName,
          displayName: item.paramTypeName,
          description: item.paramTypeDesc,
        }));
    },
  });
}
