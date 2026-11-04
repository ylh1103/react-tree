/**
 * 启动主题缓存：连接 HTML 提前配色、Redux 初始化；服务端确认后的缓存更新由 effects.ts 管理。
 * 浏览器保留最近确认的 light/dark/system 与控件圆角提示，设置读取成功后以响应配置为准。
 * 乐观输入和读取错误不覆盖缓存；保存失败时保留最近成功值，存储不可用不阻止应用运行。
 */
import { userStorageKey } from '../../utils/userStorage.ts';
import type { ThemeMode } from '../../types/preferences.ts';
import { defaultUserSettings } from '../../types/preferences.ts';

// 这里只保存浏览器配色提示，完整显示偏好仍通过设置接口读取。
export const bootstrapThemeKey = 'parameter-management:bootstrap-theme:v1';
/** 启动失败页独立于配置接口，圆角仅使用按用户隔离的最近确认值。 */
export const bootstrapControlRadiusKey = 'parameter-management:bootstrap-control-radius:v1';

/** 同时供 HTML 内联脚本使用；参数传入范围，避免序列化后依赖模块闭包。 */
export function readControlRadius(
  storage: Pick<Storage, 'getItem'>,
  key: string,
  fallback: number,
  range: { min: number; max: number },
): number {
  try {
    const value = storage.getItem(key);
    const radius = value === null || value.trim() === '' ? NaN : Number(value);
    return Number.isInteger(radius) && radius >= range.min && radius <= range.max
      ? radius
      : fallback;
  } catch {
    return fallback;
  }
}

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
    return readThemeMode(
      window.localStorage,
      userStorageKey(bootstrapThemeKey, window.localStorage),
      defaultUserSettings.themeMode,
    );
  } catch {
    return defaultUserSettings.themeMode;
  }
}
