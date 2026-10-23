/**
 * 把清单接口与分组接口组合成列表的 load/save 服务。
 * load 并行读取后交由传入的合并函数处理；save 按后端字段约定写入 JSON 字符串。
 */
import type { ListApi } from '@/api/grouped-list/types';
import type { ListNode } from '../types';

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
