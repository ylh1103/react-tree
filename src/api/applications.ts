/**
 * 应用清单与分组的接口定义。真实接口和 Mock 共用相同契约，系统接口携带 systemName。
 * Mock 通过延迟代理初始化；服务组装与清单/分组合并放在 queries/applications 和列表模型中。
 */
import type { ApplicationItem } from '../types/applications';
import { createHttpListApi } from './grouped-list/httpApi';
import { createLazyListApi } from './grouped-list/lazyApi';

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
export const applicationApi = baseUrl
  ? createHttpListApi<ApplicationItem, 'appGroupInfo'>({
      items: `${baseUrl}/applications`,
      groups: `${baseUrl}/applications/groups`,
    })
  : createLazyListApi(() => import('../mocks/applications').then((module) => module.createApi()));

/** 接口请求和模拟数据均按系统隔离。 */
export function createSystemApplicationApi(systemName: string) {
  return baseUrl
    ? createHttpListApi<ApplicationItem, 'appGroupInfo'>({
        items: `${baseUrl}/applications`,
        groups: `${baseUrl}/applications/groups`,
        params: { systemName },
      })
    : createLazyListApi(() =>
        import('../mocks/applications').then((module) => module.createApi(systemName)),
      );
}
