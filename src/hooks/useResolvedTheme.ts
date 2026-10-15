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

/** React 收到 change 通知后会重新读取快照；返回清理函数，卸载或改为手动主题时取消监听。 */
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

/** 只派生显示主题，不修改 Redux 或后端配置，用户的 system 选择始终保留。 */
export function useResolvedTheme(mode: ThemeMode): ResolvedThemeMode {
  return useSyncExternalStore(
    // subscribe：只有跟随系统才订阅；切换订阅函数时 React 会先清理旧监听。
    mode === 'system' ? subscribeSystemTheme : subscribeManualTheme,
    // getSnapshot：首次渲染及变化通知后读取；React 用 Object.is 比较值，变化时触发组件更新。
    mode === 'system' ? getSystemTheme : () => mode,
    // getServerSnapshot：服务端及客户端水合阶段使用确定值，system 先回退浅色。
    () => (mode === 'system' ? 'light' : mode),
  );
}
