export type LayoutMode = 'default' | 'compact';
export type ResolvedThemeMode = 'light' | 'dark';
export type ThemeMode = ResolvedThemeMode | 'system';
export interface UserSettings {
  layoutMode: LayoutMode;
  themeMode: ThemeMode;
  navigationIconOnly: boolean;
  headerToolsIconOnly: boolean;
}
export const defaultUserSettings: UserSettings = {
  layoutMode: 'default',
  themeMode: 'light',
  navigationIconOnly: false,
  headerToolsIconOnly: false,
};
export interface UserSettingsApi {
  load: (signal?: AbortSignal) => Promise<UserSettings>;
  save: (settings: UserSettings, signal?: AbortSignal) => Promise<UserSettings>;
}

/** 校验配置；旧接口缺少新增选项时保留原来的图文菜单。 */
export function parseUserSettings(value: unknown): UserSettings {
  if (
    !value ||
    typeof value !== 'object' ||
    !('layoutMode' in value) ||
    (value.layoutMode !== 'default' && value.layoutMode !== 'compact') ||
    ('themeMode' in value &&
      value.themeMode !== 'light' &&
      value.themeMode !== 'dark' &&
      value.themeMode !== 'system') ||
    ('navigationIconOnly' in value && typeof value.navigationIconOnly !== 'boolean') ||
    ('headerToolsIconOnly' in value && typeof value.headerToolsIconOnly !== 'boolean')
  ) {
    throw new Error('用户设置格式错误');
  }
  return {
    layoutMode: value.layoutMode,
    themeMode:
      'themeMode' in value && (value.themeMode === 'dark' || value.themeMode === 'system')
        ? value.themeMode
        : 'light',
    navigationIconOnly: 'navigationIconOnly' in value && value.navigationIconOnly === true,
    headerToolsIconOnly: 'headerToolsIconOnly' in value && value.headerToolsIconOnly === true,
  };
}
