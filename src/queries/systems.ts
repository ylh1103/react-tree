/**
 * 系统清单和数据库类型清单的查询配置，供 loader 与页面共用。
 * 查询键包含系统维度；数据库结果剔除 setting 保留名称，避免与静态设置路由冲突。
 */
import { queryOptions } from '@tanstack/react-query';
import { loadSystems } from '../api/systems';
import { loadSystemParameters } from '../api/parameters';
import type { ParameterType } from '../types/systems';
import { routeQueryMountOptions } from './routeQuery';

export const systemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'mine'],
    queryFn: ({ signal }) => loadSystems(signal),
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
