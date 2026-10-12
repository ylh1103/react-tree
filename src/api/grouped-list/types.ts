/**
 * 清单与分组接口的最小契约，供真实接口、Mock 和列表服务共同实现。
 * Field 表示后端承载 JSON 字符串的字段名；null 代表尚未保存分组。
 */
export interface ListApi<Item, Field extends string> {
  getItems: (signal?: AbortSignal) => Promise<Item[]>;
  getGroups: (signal?: AbortSignal) => Promise<Record<Field, string | null>>;
  saveGroups: (payload: Record<Field, string>) => Promise<void>;
}
