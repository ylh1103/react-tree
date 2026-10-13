/**
 * 缓存服务端已确认的主题选择，仅用于下一次启动时的首屏配色。
 * 乐观保存和失败状态不写缓存；完整用户配置仍由后端提供，存储不可用时安全回退。
 */
import type { ThemeMode } from '../../types/preferences.ts';
import { defaultUserSettings } from '../../types/preferences.ts';
import type { createAppStore } from '../index.ts';

const themeKey = 'react-tree:theme-mode:v1';

/** 仅缓存主题选择用于首屏配色，完整用户配置仍由服务端提供。 */
export function readBootstrapTheme(): ThemeMode {
  try {
    const value = window.localStorage.getItem(themeKey);
    return value === 'light' || value === 'dark' || value === 'system'
      ? value
      : defaultUserSettings.themeMode;
  } catch {
    return defaultUserSettings.themeMode;
  }
}

/** 订阅配置状态，只持久化已确认的 savedThemeMode；返回取消订阅函数供 HMR 或卸载调用。 */
export function startThemePersistence(store: ReturnType<typeof createAppStore>) {
  let previous = store.getState().preferences;
  return store.subscribe(() => {
    const current = store.getState().preferences;
    if (
      current.initialized &&
      (previous.savedThemeMode !== current.savedThemeMode ||
        (!previous.initialized && current.status === 'ready'))
    ) {
      try {
        window.localStorage.setItem(themeKey, current.savedThemeMode);
      } catch {
        // 禁用存储时仍可以正常加载、切换主题。
      }
    }
    previous = current;
  });
}
