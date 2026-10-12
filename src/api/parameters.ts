/**
 * 数据库工作区的只读类型清单接口，不维护分组或删除状态。
 * 真实请求按系统过滤；离线示例根据系统计数返回空清单或默认数据，并在动态加载后检查取消信号。
 */
import { requestData } from '../http/request';
import type { ParameterItem } from '../types/parameters';

const baseUrl = import.meta.env.VITE_LIST_API_BASE_URL?.replace(/\/$/, '');
/** 数据库工作区只读取参数类型清单。 */
export async function loadSystemParameters(
  systemName: string,
  signal: AbortSignal,
): Promise<ParameterItem[]> {
  if (baseUrl) return requestData({ url: `${baseUrl}/parameters`, params: { systemName }, signal });
  const { mockSystems } = await import('../mocks/systems');
  if (mockSystems.find((system) => system.systemName === systemName)?.paramTypeCount === 0)
    return [];
  const { createMockParameters } = await import('../mocks/parameters');
  if (signal.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
  return createMockParameters();
}
