/**
 * 系统清单和数据库类型清单的查询配置，供 loader 与页面共用。
 * 查询键包含系统维度；数据库结果剔除 setting 保留名称，避免与静态设置路由冲突。
 */
import { queryOptions } from '@tanstack/react-query';
import { loadSystems, loadMySystems, loadSystemPage } from '@/api/systems.ts';
import { queryClient } from './client.ts';
import type { SystemAccessInfo, SystemPageParams } from '@/types/systems.ts';
import { loadSystemParameters } from '@/api/parameters.ts';
import type { ParameterType } from '@/types/systems.ts';
import { store } from '@/store/index.ts';
import type { SystemAccessIdentity } from '@/types/user.ts';
import { routeQueryMountOptions } from './routeQuery.ts';

export const systemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'list'],
    queryFn: ({ signal }) => loadSystems(signal),
  });

/** 我的系统按用户隔离；消费者可显式传入身份快照，避免迟到响应写入另一用户目录。创建后由 systems 前缀失效。 */
export const mySystemsOptions = (openId = store.getState().user.userInfo?.openId ?? null) =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'mine', openId],
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

/** 本地演示授权：平台人员访问存在的系统，普通用户必须在接口成员清单中；真实后端仍须逐请求鉴权。 */
export function systemAccessOptions(
  systemName: string,
  user: SystemAccessIdentity | null = store.getState().user.userInfo,
) {
  return queryOptions<SystemAccessInfo>({
    queryKey: ['system-access', systemName, user?.openId ?? null, user?.userType ?? null],
    queryFn: async ({ signal }) => {
      const { resolveSystemAccess } = await import('./systemAccess.ts');
      return resolveSystemAccess(systemName, user, signal);
    },
    staleTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
  });
}
/** middleware 决定何时调用；显式校验始终读取最新授权，共用在途查询，失败不得回退旧缓存。 */
export async function requireSystemAccess(systemName: string) {
  return queryClient.query(systemAccessOptions(systemName));
}
