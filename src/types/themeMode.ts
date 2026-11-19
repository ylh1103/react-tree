export type ResolvedThemeMode = 'light' | 'dark';
export type ThemeMode = ResolvedThemeMode | 'system';

/** 兼容已保存的“色板:模式”，只保留明暗偏好；首屏脚本也会内联此函数。 */
export function parseThemeMode(value: unknown): ThemeMode | undefined {
  if (typeof value !== 'string') return undefined;
  const mode = /^(?:[a-z0-9-]+:)?(light|dark|system)$/.exec(value)?.[1];
  return mode === 'light' || mode === 'dark' || mode === 'system' ? mode : undefined;
}
