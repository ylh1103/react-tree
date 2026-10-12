/**
 * 为 Mock 列表接口提供延迟初始化代理，避免启动时加载 Mock.js 和生成数据。
 * 并发调用共享同一个初始化 Promise；失败后清空它允许重试，已取消的读取不会继续发送请求。
 */
import type { ListApi } from './types';

/** 首次访问才初始化，并发请求共享初始化；失败后允许重试。 */
export function createLazyListApi<Item, Field extends string>(
  initialize: () => Promise<ListApi<Item, Field> & { deleteItem: (key: string) => Promise<void> }>,
): ListApi<Item, Field> & { deleteItem: (key: string) => Promise<void> } {
  let pending: ReturnType<typeof initialize> | undefined;
  const getApi = () => {
    pending ??= initialize().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return {
    getItems: async (signal) => {
      const api = await getApi();
      if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
      return api.getItems(signal);
    },
    getGroups: async (signal) => {
      const api = await getApi();
      if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
      return api.getGroups(signal);
    },
    saveGroups: async (payload) => (await getApi()).saveGroups(payload),
    deleteItem: async (key) => (await getApi()).deleteItem(key),
  };
}
