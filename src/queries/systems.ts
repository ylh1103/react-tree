/**
 * 系统清单和数据库类型清单的查询配置，供 loader 与页面共用。
 * 查询键包含系统维度；数据库结果剔除 setting 保留名称，避免与静态设置路由冲突。
 */
import { queryOptions } from '@tanstack/react-query';
import { loadSystems, loadMySystems, loadSystemAccess, loadSystemPage } from '@/api/systems.ts';
import { queryClient } from './client.ts';
import type { SystemInfo, SystemPageParams } from '@/types/systems.ts';
import { loadSystemParameters } from '@/api/parameters.ts';
import type { ParameterType } from '@/types/systems.ts';
import { routeQueryMountOptions } from './routeQuery.ts';

export const systemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'list'],
    queryFn: ({ signal }) => loadSystems(signal),
  });

/** 两份清单使用独立查询键，创建后由 systems 前缀同时失效，不复制进 Redux。 */
export const mySystemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'mine'],
    queryFn: ({ signal }) => loadMySystems(signal),
  });

/** 页码、条数和所有筛选共同决定缓存；不使用上页占位，避免失败后误展示其他页的数据。 */
export const systemPageOptions = (params: SystemPageParams) =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'catalog', params],
    queryFn: ({ signal }) => loadSystemPage(params, signal),
  });

export function parameterTypesOptions(systemName: string) {
  return queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', systemName, 'database-types'],
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

export function systemAccessOptions(systemName: string) {
  return queryOptions<SystemInfo>({
    queryKey: ['system-access', systemName],
    queryFn: ({ signal }) => loadSystemAccess(systemName, signal),
    staleTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
  });
}
/** 并发父子 loader 共用在途查询，每次导航校验新鲜授权，失败不得回退旧缓存。 */
export async function requireSystemAccess(systemName: string) {
  return queryClient.query(systemAccessOptions(systemName));
}
