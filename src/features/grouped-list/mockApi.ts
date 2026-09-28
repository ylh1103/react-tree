import { requestData } from '../../lib/http.ts';
import Mock from 'mockjs';
import type { ListApi } from './service';

Mock.setup({ timeout: '200-500' });

// Mock.js 拦截 XMLHttpRequest；localStorage 模拟后端持久化。
export function createMockListApi<Item, Field extends string>(
  path: string,
  items: Item[],
  field: Field,
  getItemKey?: (item: Item) => string,
): ListApi<Item, Field> & { deleteItem: (key: string) => Promise<void> } {
  const storageKey = `react-tree:mock:${field}`;
  const deletedStorageKey = `${storageKey}:deletedItems`;
  const readDeletedKeys = (): string[] => {
    const keys: unknown = JSON.parse(localStorage.getItem(deletedStorageKey) ?? '[]');
    if (!Array.isArray(keys) || keys.some((key) => typeof key !== 'string')) {
      throw new Error('模拟删除记录格式错误');
    }
    return keys;
  };
  Mock.mock(path, 'get', () => {
    try {
      if (!getItemKey) return Mock.mock(items);
      const deleted = new Set(readDeletedKeys());
      return Mock.mock(items.filter((item) => !deleted.has(getItemKey(item))));
    } catch {
      return { error: '无法读取模拟参数清单，请检查浏览器存储' };
    }
  });
  if (getItemKey) {
    Mock.mock(path, 'delete', (options: { body: string }) => {
      try {
        const { key } = JSON.parse(options.body);
        if (typeof key !== 'string' || !items.some((item) => getItemKey(item) === key)) {
          return { error: '要删除的节点不存在' };
        }
        const deleted = new Set(readDeletedKeys());
        deleted.add(key);
        localStorage.setItem(deletedStorageKey, JSON.stringify([...deleted]));
        return { success: true };
      } catch {
        return { error: '模拟删除失败，请检查浏览器存储权限或空间' };
      }
    });
  }
  Mock.mock(`${path}/groups`, 'get', () => {
    try {
      return { [field]: localStorage.getItem(storageKey) };
    } catch {
      return { error: '无法读取模拟分组存储，请检查浏览器存储权限' };
    }
  });
  Mock.mock(`${path}/groups`, 'put', (options: { body: string }) => {
    try {
      const payload = JSON.parse(options.body);
      if (typeof payload[field] !== 'string' || !Array.isArray(JSON.parse(payload[field]))) {
        return { error: '分组信息必须是 JSON 数组字符串' };
      }
      localStorage.setItem(storageKey, payload[field]);
      return { success: true };
    } catch {
      return { error: '模拟保存失败，请检查数据格式或浏览器存储空间' };
    }
  });
  async function request<T>(
    url: string,
    method: string,
    data?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    const result = await requestData<T>({ url, method, data, signal, adapter: 'xhr' });
    // Mock 接口以响应体表达业务失败，HTTP 200 不代表操作成功。
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      throw new Error(String(result.error));
    }
    return result;
  }
  return {
    deleteItem: async (key) => {
      if (!getItemKey) throw new Error('该列表未配置删除接口');
      await request(path, 'DELETE', { key });
    },
    getItems: (signal) => request<Item[]>(path, 'GET', undefined, signal),
    getGroups: (signal) =>
      request<Record<Field, string | null>>(`${path}/groups`, 'GET', undefined, signal),
    saveGroups: async (payload) => {
      await request(`${path}/groups`, 'PUT', payload);
    },
  };
}
