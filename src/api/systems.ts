/**
 * 当前用户可访问的系统清单入口。
 * 只在配置明确的接口地址时请求后端；默认示例按需加载，返回副本避免调用方修改共享 Mock 数据。
 */
import { requestData } from '../http/request';
import type { SystemInfo } from '../types/systems';

/** 系统接口尚未提供：仅在配置真实地址后发起请求，不猜测后端路由。 */
export async function loadSystems(signal?: AbortSignal): Promise<SystemInfo[]> {
  const url = import.meta.env.VITE_SYSTEMS_API_URL;
  if (url) return requestData<SystemInfo[]>({ url, signal });
  const { mockSystems } = await import('../mocks/systems');
  return structuredClone(mockSystems);
}
