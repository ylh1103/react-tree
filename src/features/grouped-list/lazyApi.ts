import type { ListApi } from './service';

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
