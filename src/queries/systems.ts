/**
 * 系统清单和数据库类型清单的查询配置，供 loader 与页面共用。
 * 查询键包含系统维度；数据库结果剔除 setting 保留名称，避免与静态设置路由冲突。
 */
import { queryOptions } from '@tanstack/react-query';
import { loadSystems, loadAllSystems, loadSystemAccess } from '../api/systems.ts';
import { store } from '../store/index.ts';
import { HttpError } from '../http/request.ts';
import { queryClient } from './client.ts';
import { requireSession } from '../store/session.ts';
import type { SystemInfo } from '../types/systems.ts';
import { loadSystemParameters } from '../api/parameters.ts';
import type { ParameterType } from '../types/systems.ts';
import { routeQueryMountOptions } from './routeQuery.ts';

export const systemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', store.getState().session.user?.ystId ?? 'anonymous', 'mine'],
    queryFn: ({ signal }) => loadSystems(signal),
  });

export function parameterTypesOptions(systemName: string) {
  return queryOptions({
    ...routeQueryMountOptions,
    queryKey: [
      'systems',
      store.getState().session.user?.ystId ?? 'anonymous',
      systemName,
      'database-types',
    ],
    queryFn: async ({ signal }): Promise<ParameterType[]> => {
      const items = await loadSystemParameters(systemName, signal);
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

/** 所有系统公开资料不意味着有工作区授权。 */
export const allSystemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', store.getState().session.user?.ystId ?? 'anonymous', 'all'],
    queryFn: ({ signal }) => loadAllSystems(signal),
  });
export function systemAccessOptions(systemName: string) {
  return queryOptions<SystemInfo | { denied: true }>({
    queryKey: ['system-access', store.getState().session.user?.ystId ?? 'anonymous', systemName],
    queryFn: ({ signal }) => loadSystemAccess(systemName, signal),
    staleTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
  });
}
/** 并发父子 loader 共用在途查询，每次导航校验新鲜授权，失败不得回退旧缓存。 */
export async function requireSystemAccess(systemName: string) {
  await requireSession();
  const system = await queryClient.fetchQuery(systemAccessOptions(systemName));
  if ('denied' in system) throw new HttpError(403, '无权访问此系统');
  return system;
}
