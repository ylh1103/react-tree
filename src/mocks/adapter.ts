/** 唯一模拟接入点：首次请求时加载执行器，避免模拟路由处理进入首页静态启动包。 */
import type { AxiosAdapter } from 'axios';

export const mockAdapter: AxiosAdapter = async (config) => {
  const { executeMockRequest } = await import('./adapterImplementation.ts');
  return executeMockRequest(config);
};
