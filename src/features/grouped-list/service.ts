import type { ListNode } from './model';

export interface ListApi<Item, Field extends string> {
  getItems: (signal?: AbortSignal) => Promise<Item[]>;
  getGroups: (signal?: AbortSignal) => Promise<Record<Field, string | null>>;
  saveGroups: (payload: Record<Field, string>) => Promise<void>;
}

export function createListService<Item, Field extends string>(
  api: ListApi<Item, Field>,
  field: Field,
  merge: (items: Item[], groups: string | null) => ListNode[],
) {
  return {
    async load(signal?: AbortSignal) {
      const [items, response] = await Promise.all([api.getItems(signal), api.getGroups(signal)]);
      if (response[field] !== null && typeof response[field] !== 'string') {
        throw new Error(`接口返回的 ${field} 必须是字符串或 null`);
      }
      return merge(items, response[field]);
    },
    async save(nodes: ListNode[]) {
      // 接口字段承载 JSON 字符串；HTTP 层还会序列化外层对象，这是约定的双层编码。
      await api.saveGroups({ [field]: JSON.stringify(nodes) } as Record<Field, string>);
    },
  };
}

/** 对接真实后端时传入实际 URL；默认 HTTP 契约：GET 清单、GET 分组、PUT 分组。 */
export function createHttpListApi<Item, Field extends string>(urls: {
  items: string;
  groups: string;
}): ListApi<Item, Field> {
  async function request(url: string, init?: RequestInit) {
    const response = await fetch(url, { credentials: 'same-origin', ...init });
    if (!response.ok) throw new Error(`请求失败（${response.status}）`);
    return response;
  }
  return {
    getItems: async (signal) => (await request(urls.items, { signal })).json(),
    getGroups: async (signal) => (await request(urls.groups, { signal })).json(),
    saveGroups: async (payload) => {
      await request(urls.groups, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    },
  };
}
