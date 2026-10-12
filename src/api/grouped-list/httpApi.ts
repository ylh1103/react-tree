/**
 * 将清单、分组和删除操作映射为 GET、PUT、DELETE HTTP 请求。
 * 这里只负责请求契约，不处理树结构；系统参数在所有请求中保持一致，GET 支持取消。
 */
import { requestData } from '../../http/request.ts';
import type { ListApi } from './types';

/** 对接真实后端时传入实际 URL；默认 HTTP 契约：GET 清单、GET 分组、PUT 分组。 */
export function createHttpListApi<Item, Field extends string>(urls: {
  items: string;
  groups: string;
  params?: Record<string, string>;
}): ListApi<Item, Field> & { deleteItem: (key: string) => Promise<void> } {
  return {
    deleteItem: async (key) => {
      await requestData({
        url: urls.items,
        method: 'DELETE',
        data: { key },
        params: urls.params,
      });
    },
    getItems: (signal) => requestData<Item[]>({ url: urls.items, params: urls.params, signal }),
    getGroups: (signal) =>
      requestData<Record<Field, string | null>>({ url: urls.groups, params: urls.params, signal }),
    saveGroups: async (payload) => {
      await requestData({
        url: urls.groups,
        method: 'PUT',
        data: payload,
        params: urls.params,
      });
    },
  };
}
