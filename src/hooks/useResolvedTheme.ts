/**
 * 解析 React 运行期间的实际配色，保持用户选择与系统外观两个来源各自独立。
 * 系统外观是浏览器外部状态，由 useSyncExternalStore 读取和订阅，不通过 Effect 复制进 Redux。
 */
import { useSyncExternalStore } from 'react';
import type { ResolvedThemeMode, ThemeMode } from '../types/preferences';

/** 同步读取系统外观；Node、SSR 或缺少 matchMedia 的环境回退浅色，不读写用户设置。 */
export function getSystemTheme(): ResolvedThemeMode {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * 系统外观变化时通知 React 重新读取快照，不在监听回调中保存主题。
 * 返回解除监听的函数；卸载或从 system 切换到固定主题时由 React 调用。
 */
export function subscribeSystemTheme(onChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

// 手动模式没有外部变化源，但仍提供符合 useSyncExternalStore 契约的订阅及清理函数。
const subscribeManualTheme = () => () => {};

/**
 * 固定主题直接返回用户选择，仅 system 订阅系统外观；订阅函数保持模块级稳定引用。
 * 服务端无法得知本机外观，system 的服务端及水合快照回退浅色，固定主题仍原样返回。
 * 当前客户端挂载读取本机快照，不使用服务端回退来判断用户的系统外观。
 */
export function useResolvedTheme(mode: ThemeMode): ResolvedThemeMode {
  return useSyncExternalStore(
    mode === 'system' ? subscribeSystemTheme : subscribeManualTheme,
    mode === 'system' ? getSystemTheme : () => mode,
    () => (mode === 'system' ? 'light' : mode),
  );
}
