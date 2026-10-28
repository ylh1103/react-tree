/** 环境参数列表 HTTP 契约；系统、应用及取消信号贯穿请求。 */
import { requestData } from '@/http/request.ts';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments.ts';

export function loadApplicationEnvironments(
  systemName: string,
  appName: string,
  signal?: AbortSignal,
) {
  return requestData<ApplicationEnvironment[]>({
    url: '/api/applications/environments',
    params: { systemName, appName },
    signal,
  });
}
