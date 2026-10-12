/**
 * 将 light、dark、system 用户选择解析为实际浅色或暗色。
 * useSyncExternalStore 管理系统外观订阅；服务端和不支持 matchMedia 的环境使用安全回退。
 */
import { useSyncExternalStore } from 'react';
import type { ResolvedThemeMode, ThemeMode } from '../types/preferences';

/** 系统外观仅影响实际显示，持久化配置仍保留 system。 */
export function getSystemTheme(): ResolvedThemeMode {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function subscribeSystemTheme(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const subscribeManualTheme = () => () => {};

export function useResolvedTheme(mode: ThemeMode): ResolvedThemeMode {
  return useSyncExternalStore(
    mode === 'system' ? subscribeSystemTheme : subscribeManualTheme,
    mode === 'system' ? getSystemTheme : () => mode,
    () => (mode === 'system' ? 'light' : mode),
  );
}
