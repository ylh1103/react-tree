export type LayoutMode = 'default' | 'compact';
export type ResolvedThemeMode = 'light' | 'dark';
export type ThemeMode = ResolvedThemeMode | 'system';
export type NavigationTheme = 'contrast' | 'theme';
export const layoutGapRange = { min: 2, max: 16 } as const;
export const borderRadiusRange = { min: 0, max: 24 } as const;
export interface UserSettings {
  layoutMode: LayoutMode;
  /** 标准布局的模块间距（px）；紧凑布局固定使用 0。 */
  layoutGap: number;
  /** 页面面板和列表节点的圆角（px）；保留字段名以兼容旧配置。 */
  borderRadius: number;
  /** Ant Design 控件的基础圆角，各尺寸由主题算法生成。 */
  controlBorderRadius: number;
  themeMode: ThemeMode;
  /** 撞色保留现有导航配色；跟随主题与内容模块共用表面色。 */
  navigationTheme: NavigationTheme;
  navigationIconOnly: boolean;
  headerToolsIconOnly: boolean;
}
export const defaultUserSettings: UserSettings = {
  layoutMode: 'default',
  layoutGap: 4,
  borderRadius: 8,
  controlBorderRadius: 6,
  themeMode: 'system',
  navigationTheme: 'contrast',
  navigationIconOnly: true,
  headerToolsIconOnly: true,
};
export interface UserSettingsApi {
  load: (signal?: AbortSignal) => Promise<UserSettingsSnapshot>;
  save: (settings: UserSettings, signal?: AbortSignal) => Promise<UserSettingsSnapshot>;
}
/** 完整文档只用于同步会话；布局 Slice 只保存自己负责的字段。 */
export interface UserSettingsSnapshot extends UserSettings {
  document?: string;
}

/** 校验配置；缺少新增选项时使用默认值，旧版 17–24px 间距收敛到当前上限。 */
export function parseUserSettings(value: unknown): UserSettings {
  if (
    !value ||
    typeof value !== 'object' ||
    !('layoutMode' in value) ||
    (value.layoutMode !== 'default' && value.layoutMode !== 'compact') ||
    ('controlBorderRadius' in value &&
      (typeof value.controlBorderRadius !== 'number' ||
        !Number.isInteger(value.controlBorderRadius) ||
        value.controlBorderRadius < borderRadiusRange.min ||
        value.controlBorderRadius > borderRadiusRange.max)) ||
    ('borderRadius' in value &&
      (typeof value.borderRadius !== 'number' ||
        !Number.isInteger(value.borderRadius) ||
        value.borderRadius < borderRadiusRange.min ||
        value.borderRadius > borderRadiusRange.max)) ||
    ('layoutGap' in value &&
      (typeof value.layoutGap !== 'number' ||
        !Number.isInteger(value.layoutGap) ||
        value.layoutGap < layoutGapRange.min ||
        value.layoutGap > 24)) ||
    ('themeMode' in value &&
      value.themeMode !== 'light' &&
      value.themeMode !== 'dark' &&
      value.themeMode !== 'system') ||
    ('navigationTheme' in value &&
      value.navigationTheme !== 'contrast' &&
      value.navigationTheme !== 'theme') ||
    ('navigationIconOnly' in value && typeof value.navigationIconOnly !== 'boolean') ||
    ('headerToolsIconOnly' in value && typeof value.headerToolsIconOnly !== 'boolean')
  ) {
    throw new Error('用户设置格式错误');
  }
  return {
    layoutMode: value.layoutMode,
    controlBorderRadius:
      'controlBorderRadius' in value
        ? (value.controlBorderRadius as number)
        : defaultUserSettings.controlBorderRadius,
    borderRadius:
      'borderRadius' in value ? (value.borderRadius as number) : defaultUserSettings.borderRadius,
    layoutGap:
      'layoutGap' in value
        ? Math.min(value.layoutGap as number, layoutGapRange.max)
        : defaultUserSettings.layoutGap,
    themeMode:
      'themeMode' in value ? (value.themeMode as ThemeMode) : defaultUserSettings.themeMode,
    navigationTheme:
      'navigationTheme' in value
        ? (value.navigationTheme as NavigationTheme)
        : defaultUserSettings.navigationTheme,
    navigationIconOnly:
      'navigationIconOnly' in value
        ? value.navigationIconOnly === true
        : defaultUserSettings.navigationIconOnly,
    headerToolsIconOnly:
      'headerToolsIconOnly' in value
        ? value.headerToolsIconOnly === true
        : defaultUserSettings.headerToolsIconOnly,
  };
}
