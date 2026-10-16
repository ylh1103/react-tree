/**
 * 启动主题缓存：连接 HTML 提前配色、Redux 初始化与服务端确认后的缓存更新。
 * 浏览器只保存最近一次确认的 light/dark/system，登录后仍以当前用户的服务端配置为准。
 * 乐观输入和读取错误不覆盖缓存；保存失败时保留最近成功值，存储不可用不阻止应用运行。
 */
import type { ThemeMode } from '../../types/preferences.ts';
import { defaultUserSettings } from '../../types/preferences.ts';
import type { createAppStore } from '../index.ts';

// 启动前尚不知道当前用户，因此只保存浏览器配色提示；不能用它恢复身份或完整用户设置。
export const bootstrapThemeKey = 'react-tree:bootstrap-theme:v1';

/**
 * HTML 和 Store 共用的缓存校验，只接受三种主题选择，非法或不可读的值使用调用方回退值。
 * 构建插件会将函数源码内联到 HTML，必须保持无闭包依赖：缓存键、默认值和存储对象均由参数传入。
 * 这里不把 system 转为实际颜色，避免刷新后变成固定的浅色或暗色。
 */
export function readThemeMode(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  fallback: ThemeMode,
): ThemeMode {
  try {
    const value = storage.getItem(key);
    return value === 'light' || value === 'dark' || value === 'system' ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 给 Redux 提供启动选择；与 HTML 分别读取同一个键，使两阶段遵循相同默认值和校验规则。
 * 不能从 HTML 的 data-theme 恢复选择：dark 既可能来自用户固定选择，也可能是 system 的解析结果。
 * 获取 localStorage 对象本身也可能抛错，且 Node 环境没有 window，因此在此增加环境级回退。
 */
export function readBootstrapTheme(): ThemeMode {
  try {
    return readThemeMode(window.localStorage, bootstrapThemeKey, defaultUserSettings.themeMode);
  } catch {
    return defaultUserSettings.themeMode;
  }
}

/**
 * 应用入口安装的缓存订阅，只写 savedThemeMode，不应用 DOM 主题、不向服务端发请求。
 * current.themeMode 可能是尚未保存成功的乐观值；savedThemeMode 才能作为下次启动的配色提示。
 * 返回 Store 的取消订阅函数，供入口在 HMR 或应用销毁时清理。
 */
export function startThemePersistence(store: ReturnType<typeof createAppStore>) {
  // 仅记录成功写入的值；无关 dispatch 不重复写，存储失败后仍能在后续有效状态更新时重试。
  let persistedTheme: ThemeMode | undefined;
  return store.subscribe(() => {
    const { preferences: current, session } = store.getState();
    // initialized 只表示首屏等待结束，也可能来自读取错误；错误状态和重试期间均不能确认默认值。
    // 连续保存时，较早请求成功会在 saving 期间推进基线；不能仅允许 ready，否则可能漏掉成功值。
    if (
      session.status !== 'loading' &&
      session.status !== 'expired' &&
      session.status !== 'error' &&
      current.initialized &&
      current.status !== 'load-error' &&
      current.status !== 'loading' &&
      persistedTheme !== current.savedThemeMode
    ) {
      try {
        window.localStorage.setItem(bootstrapThemeKey, current.savedThemeMode);
        persistedTheme = current.savedThemeMode;
      } catch {
        // 禁用存储时仍可以正常加载、切换主题。
      }
    }
  });
}
