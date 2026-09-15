import Mock from 'mockjs';
import type { ListApi } from './service';

Mock.setup({ timeout: '200-500' });

// Mock.js 拦截 XMLHttpRequest；localStorage 模拟后端持久化。
export function createMockListApi<Item, Field extends string>(
  path: string,
  items: Item[],
  field: Field,
): ListApi<Item, Field> {
  const storageKey = `react-tree:mock:${field}`;
  Mock.mock(path, 'get', () => Mock.mock(items));
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
  function request<T>(
    url: string,
    method: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const cleanup = () => signal?.removeEventListener('abort', abort);
      const abort = () => {
        cleanup();
        xhr.abort();
        reject(new DOMException('请求已取消', 'AbortError'));
      };
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      xhr.open(method, url);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        cleanup();
        try {
          if (signal?.aborted) return;
          if (xhr.status < 200 || xhr.status >= 300) throw new Error(`请求失败（${xhr.status}）`);
          const result = JSON.parse(xhr.responseText);
          if (result?.error) throw new Error(result.error);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      xhr.onerror = () => {
        cleanup();
        reject(new Error('网络请求失败'));
      };
      xhr.onabort = cleanup;
      xhr.send(body === undefined ? null : JSON.stringify(body));
    });
  }
  return {
    getItems: (signal) => request<Item[]>(path, 'GET', undefined, signal),
    getGroups: (signal) =>
      request<Record<Field, string | null>>(`${path}/groups`, 'GET', undefined, signal),
    saveGroups: async (payload) => {
      await request(`${path}/groups`, 'PUT', payload);
    },
  };
}
