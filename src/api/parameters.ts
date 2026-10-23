/** 数据库类型只读清单，授权与取消由 HTTP 层及 loader 保证。 */
import { requestData } from '@/http/request.ts';
import type { ParameterItem } from '@/types/parameters.ts';
export const loadSystemParameters = (systemName: string, signal?: AbortSignal) =>
  requestData<ParameterItem[]>({ url: '/api/parameters', params: { systemName }, signal });
