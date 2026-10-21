/** 可持久化的加载图标标识；独立于 React，供配置校验、图库和指示器共同使用。 */
export const loadingStyleIds = [
  'data-trace',
  'data-wave',
  'data-matrix',
  'data-comet',
  'flat-split',
] as const;

/** 使用系列前缀和稳定方案键，展示排序变化不会改变用户已保存的选择。 */
export type LoadingStyleId = (typeof loadingStyleIds)[number];

/** 配置边界只接受当前支持的图标；非法配置由原有读取错误流程处理，避免覆盖原文档。 */
export function isLoadingStyleId(value: unknown): value is LoadingStyleId {
  return loadingStyleIds.some((id) => id === value);
}
