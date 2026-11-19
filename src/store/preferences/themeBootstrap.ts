/**
 * 启动主题缓存：连接 HTML 提前配色、Redux 初始化；服务端确认后的缓存更新由 effects.ts 管理。
 * 浏览器保留最近确认的主题、明暗模式与控件圆角提示，设置读取成功后以响应配置为准。
 * 乐观输入和读取错误不覆盖缓存；保存失败时保留最近成功值，存储不可用不阻止应用运行。
 */
import { userStorageKey } from '../../utils/userStorage.ts';
import { defaultUserSettings } from '../../types/preferences.ts';
import { parseThemeMode, type ThemeMode } from '../../types/themeMode.ts';

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
 * 给 Redux 提供启动选择；与 HTML 分别读取同一个键，使两阶段遵循相同默认值和校验规则。
 * 不能从 HTML 的 data-theme 恢复选择：dark 既可能来自用户固定选择，也可能是 system 的解析结果。
 * 获取 localStorage 对象本身也可能抛错，且 Node 环境没有 window，因此在此增加环境级回退。
 */
export function readBootstrapTheme(): ThemeMode {
  try {
    const cached = window.localStorage.getItem(
      userStorageKey(bootstrapThemeKey, window.localStorage),
    );
    return parseThemeMode(cached?.split('|', 1)[0]) ?? defaultUserSettings.themeMode;
  } catch {
    // 存储访问失败时使用默认模式。
  }
  return defaultUserSettings.themeMode;
}
