import { QueryClient } from '@tanstack/react-query';

// 查询错误在列表内展示；写入错误由上下文弹窗展示。
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: false },
    mutations: { retry: false },
  },
});
