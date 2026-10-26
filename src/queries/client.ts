/**
 * 整个应用唯一的 QueryClient，路由预取与组件查询必须共用该实例。
 * 列表在短时间内复用缓存，避免页面切换反复请求；用户刷新仍通过主动失效触发。
 */
import { QueryClient } from '@tanstack/react-query';

// 查询错误在列表内展示；写入错误由上下文弹窗展示。
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, refetchOnWindowFocus: false, retry: false },
    mutations: { retry: false },
  },
});
