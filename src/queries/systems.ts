/**
 * 系统目录、工作区访问及数据库类型的查询配置，供路由和页面共用。
 * 目录缓存用于展示；工作区访问以系统精确检索返回的最新信息为依据。
 */
import { queryOptions } from '@tanstack/react-query';
import {
  loadSystems,
  loadMySystems,
  loadSystemPage,
  loadSystemByName,
  loadFtcSubsystem,
  loadSubsystemMetadata,
} from '@/api/systems.ts';
import { SystemAccessError } from '@/api/systemAccessError.ts';
import { HttpError } from '@/http/request.ts';
import type { ParameterType, SystemAccessInfo, SystemPageParams } from '@/types/systems.ts';
import type { LoginUser } from '@/types/user.ts';
import { loadSystemParameters } from '@/api/parameters.ts';
import { store } from '@/store/index.ts';
import { queryClient } from './client.ts';
import { routeQueryMountOptions } from './routeQuery.ts';

export const systemsOptions = () =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'list'],
    queryFn: ({ signal }) => loadSystems(signal),
  });

/** 我的系统按用户隔离；消费者可显式传入身份快照，避免迟到响应写入另一用户目录。创建后由 systems 前缀失效。 */
export const mySystemsOptions = (ystId = store.getState().user.userInfo?.ystId ?? null) =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: ['systems', 'mine', ystId],
    queryFn: ({ signal }) => loadMySystems(signal),
  });

/** 页码、条数和所有筛选共同决定缓存；不使用上页占位，避免失败后误展示其他页的数据。 */
export const systemCatalogKey = ['systems', 'catalog'] as const;

export const systemPageOptions = (
  params: SystemPageParams,
  ystId = store.getState().user.userInfo?.ystId ?? null,
) =>
  queryOptions({
    ...routeQueryMountOptions,
    queryKey: [...systemCatalogKey, params, ystId],
    queryFn: ({ signal }) => loadSystemPage(params, signal),
  });

/** 授权缓存以一事通 ID 和平台角色识别用户，资料展示字段不参与。 */
export type SystemAccessIdentity = Pick<LoginUser, 'ystId' | 'userType'>;

/** 中间件与布局使用同一查询键；角色变化也会切换授权缓存。 */
export function systemAccessOptions(
  systemName: string,
  user: SystemAccessIdentity | null = store.getState().user.userInfo,
) {
  return queryOptions<SystemAccessInfo>({
    queryKey: ['system-access', systemName, user?.ystId ?? null, user?.userType ?? null],
    queryFn: ({ signal }) => resolveSystemAccess(systemName, user, signal),
    staleTime: 0,
    retry: false,
    // 导航已经校验过，布局挂载时复用结果。窗口重新聚焦时刷新，以发现访问权限变化。
    refetchOnMount: false,
    refetchOnWindowFocus: 'always',
  });
}

/** 等待最新校验结果；复用同键的在途请求，失败交给路由错误边界。 */
export async function requireSystemAccess(
  systemName: string,
  user: SystemAccessIdentity | null = store.getState().user.userInfo,
) {
  return queryClient.query(systemAccessOptions(systemName, user));
}

/** 平台人员只需确认系统存在，普通用户还须确认已加入。真实后端仍须逐请求鉴权。 */
async function resolveSystemAccess(
  systemName: string,
  user: SystemAccessIdentity | null,
  signal: AbortSignal,
): Promise<SystemAccessInfo> {
  signal.throwIfAborted();
  if (!user) throw new HttpError(401, '请先登录');
  if (user.userType !== '0' && user.userType !== '1')
    throw new SystemAccessError(403, '无系统访问权限');
  const system = await loadSystemByName(systemName, signal);
  signal.throwIfAborted();
  // 只信任本次查询返回的明确加入状态，不再为鉴权读取我的系统或使用其旧缓存。
  if (user.userType === '0' || system.userRelation === true) return system;
  throw new SystemAccessError(403, '尚未加入该系统', {
    systemName: system.systemName,
    systemChineseName: system.systemChineseName,
    systemCharges: system.systemCharges,
  });
}

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

/** 精确查询键隔离快速修改输入时的在途结果，取消信号透传至 HTTP。 */
export const ftcSubsystemOptions = (systemName: string) =>
  queryOptions({
    queryKey: ['system-directory', 'ftc', systemName],
    queryFn: ({ signal }) => loadFtcSubsystem(systemName, signal),
    retry: false,
  });

export const subsystemMetadataOptions = (systemArchNo: string) =>
  queryOptions({
    queryKey: ['system-directory', 'subsystem', systemArchNo],
    queryFn: ({ signal }) => loadSubsystemMetadata(systemArchNo, signal),
    retry: false,
  });
