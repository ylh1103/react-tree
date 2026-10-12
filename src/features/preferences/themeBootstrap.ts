import type { ThemeMode } from './types.ts';
import type { createAppStore } from '../../store/index.ts';

const themeKey = 'react-tree:theme-mode:v1';

/** 仅缓存主题选择用于首屏配色，完整用户配置仍由服务端提供。 */
export function readBootstrapTheme(): ThemeMode {
  try {
    const value = window.localStorage.getItem(themeKey);
    return value === 'light' || value === 'dark' || value === 'system' ? value : 'light';
  } catch {
    return 'light';
  }
}

export function startThemePersistence(store: ReturnType<typeof createAppStore>) {
  let previous = store.getState().preferences;
  return store.subscribe(() => {
    const current = store.getState().preferences;
    if (
      current.status === 'ready' &&
      (previous.status !== 'ready' || previous.themeMode !== current.themeMode)
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
