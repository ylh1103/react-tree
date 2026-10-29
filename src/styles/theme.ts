/**
 * 平台主题定义：Ant Design 使用 token，UnoCSS 和 body 弹层使用由同一 token 派生的 CSS 变量。
 * Vite 首屏插件也从这里提取画布与文字颜色，修改配色无需同步维护另一套首屏色值。
 * 本模块计算主题和变量映射；运行时 DOM 写入统一由 AppThemeProvider 调用 applyTheme 完成。
 */
import { theme, type ThemeConfig } from 'antd';
import type { NavigationTheme, ResolvedThemeMode } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';

/** 浅色主题以 Ant Design 默认算法为基础，只覆盖平台主色、边框和控件基础尺寸。 */
export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: '#0d99ff',
    colorBorder: '#e5e5e5',
    colorBorderSecondary: '#e5e5e5',
    borderRadius: defaultUserSettings.controlBorderRadius,
    fontSize: 14,
  },
};

/** 暗色基础调色板沿用 Dracula 色系，控件与导航按平台的可读性需求调整。 */
const dracula = {
  background: '#282a36',
  foreground: '#f8f8f2',
  selection: '#44475a',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c6',
  purple: '#bd93f9',
  red: '#ff5555',
  // 用不同亮度区分浮层、侧栏和页面画布，避免暗色界面只靠阴影表达层级。
  surfaceLight: '#343746',
  surfaceDark: '#21222c',
  surfaceDarker: '#191a21',
};

/** 保留暗色算法的控件层级，再显式校准文本、表面和交互状态色。 */
export const darkAppTheme: ThemeConfig = {
  ...appTheme,
  algorithm: (seed, map) => ({
    ...theme.darkAlgorithm(seed, map),
    // 暗色算法会调整种子色；强调色和语义色沿用下方指定值，避免再次降低亮度。
    colorPrimary: seed.colorPrimary,
    colorInfo: seed.colorInfo,
    colorSuccess: seed.colorSuccess,
    colorWarning: seed.colorWarning,
    colorError: seed.colorError,
  }),
  token: {
    ...appTheme.token,
    colorBgBase: dracula.background,
    colorBgLayout: dracula.surfaceDarker,
    colorBgContainer: dracula.background,
    colorBgElevated: dracula.surfaceLight,
    colorText: dracula.foreground,
    colorTextSecondary: '#c0c5dc',
    // 正文辅助信息提亮，comment 原色仅用于禁用内容和装饰。
    colorTextTertiary: '#a6afcf',
    colorTextQuaternary: dracula.comment,
    colorTextDisabled: dracula.comment,
    colorTextPlaceholder: '#a6afcf',
    // 覆盖暗色算法的降亮结果，保留 Dracula 标志性的紫色。
    colorPrimary: dracula.purple,
    colorPrimaryHover: '#d6acff',
    colorPrimaryActive: '#a87de8',
    colorPrimaryText: dracula.purple,
    colorPrimaryTextHover: '#d6acff',
    colorPrimaryTextActive: '#a87de8',
    colorPrimaryBg: '#353044',
    colorPrimaryBgHover: '#403650',
    colorPrimaryBorder: '#786198',
    colorPrimaryBorderHover: dracula.purple,
    // 亮色实心按钮、勾选框和节点徽标使用深字，保证对比度。
    colorTextLightSolid: dracula.surfaceDark,
    colorLink: dracula.cyan,
    colorLinkHover: '#a4ffff',
    colorLinkActive: '#6dd5ed',
    colorInfo: dracula.cyan,
    colorInfoText: dracula.cyan,
    colorSuccess: dracula.green,
    colorSuccessText: dracula.green,
    colorWarning: dracula.orange,
    colorWarningText: dracula.orange,
    colorError: dracula.red,
    colorErrorText: '#ff8585',
    colorBorder: '#414249',
    colorBorderSecondary: '#414249',
    colorFill: dracula.selection,
    colorFillSecondary: dracula.surfaceLight,
    colorFillTertiary: '#303340',
    colorFillQuaternary: '#2c2f3b',
    colorFillAlter: dracula.surfaceDark,
  },
  components: {
    Tooltip: {
      colorBgSpotlight: dracula.selection,
      colorTextLightSolid: dracula.foreground,
    },
    Button: {
      // 默认按钮使用同色系表面与中性边框，避免在弹层上形成突兀的深色块。
      defaultBg: dracula.surfaceLight,
      defaultColor: '#c0c5dc',
      defaultBorderColor: '#414249',
      defaultShadow: 'none',
      // 禁用按钮降低表面与边框亮度，并使用中性灰字，与可点击按钮清晰区分。
      defaultBgDisabled: dracula.surfaceDark,
      dashedBgDisabled: dracula.surfaceDark,
      colorBgContainerDisabled: dracula.surfaceDark,
      colorBorderDisabled: dracula.background,
      colorTextDisabled: '#737687',
      defaultHoverBg: dracula.selection,
      defaultHoverColor: dracula.foreground,
      defaultHoverBorderColor: dracula.comment,
      defaultActiveBg: dracula.background,
      defaultActiveColor: dracula.foreground,
      defaultActiveBorderColor: dracula.purple,
      // 主按钮使用浅字配深紫底；组件级配置保留其他控件的亮色强调。
      primaryColor: dracula.foreground,
      colorPrimary: '#7652ad',
      colorPrimaryHover: '#805bb8',
      colorPrimaryActive: '#68469c',
    },
  },
};
export const appThemes = { light: appTheme, dark: darkAppTheme };

/**
 * 生成控件主题；面板圆角只作用于 CSS，不参与此处的 Ant Design token 计算。
 * 常用圆角沿用默认层级，大圆角按各尺寸控件高度扩展，避免 SM/LG 的固定上限破坏相对比例。
 */
export function createAppTheme(mode: ResolvedThemeMode, controlBorderRadius: number): ThemeConfig {
  const base = appThemes[mode];
  const config: ThemeConfig = {
    ...base,
    token: {
      ...base.token,
      borderRadius: controlBorderRadius,
    },
  };
  if (controlBorderRadius <= 8) return config;
  const tokens = theme.getDesignToken(config);
  return {
    ...config,
    token: {
      ...config.token,
      borderRadiusSM: Math.max(
        tokens.borderRadiusSM,
        Math.round((controlBorderRadius * tokens.controlHeightSM) / tokens.controlHeight),
      ),
      borderRadiusLG: Math.max(
        tokens.borderRadiusLG,
        Math.round((controlBorderRadius * tokens.controlHeightLG) / tokens.controlHeight),
      ),
    },
  };
}

/** 将 token 映射为共享语义变量，固定主题色与用户可调的布局参数在这里提供初始值。 */
function createThemeVariables(mode: ResolvedThemeMode) {
  const tokens = theme.getDesignToken(appThemes[mode]);

  const variables = {
    '--layout-gap': `${defaultUserSettings.layoutGap}px`,
    '--ui-radius': `${defaultUserSettings.borderRadius}px`,
    '--control-radius': `${defaultUserSettings.controlBorderRadius}px`,
    '--color-canvas': tokens.colorBgLayout,
    '--color-header': tokens.colorBgContainer,
    '--color-surface': tokens.colorBgContainer,
    '--color-sidebar': tokens.colorFillAlter,
    '--color-text': tokens.colorText,
    '--color-text-secondary': tokens.colorTextSecondary,
    '--color-text-muted': tokens.colorTextTertiary,
    '--color-watermark': tokens.colorFillSecondary,
    '--color-accent': tokens.colorPrimary,
    '--color-accent-hover': tokens.colorPrimaryHover,
    '--color-accent-active': tokens.colorPrimaryActive,
    '--color-accent-text': tokens.colorPrimaryText,
    '--color-settings-surface': tokens.colorBgElevated,
    '--color-on-accent': tokens.colorTextLightSolid,
    '--color-hover': tokens.colorPrimaryBg,
    '--color-accent-bg-hover': tokens.colorPrimaryBgHover,
    '--color-accent-border': tokens.colorPrimaryBorder,
    '--color-accent-border-hover': tokens.colorPrimaryBorderHover,
    '--color-border': tokens.colorBorder,
    '--color-border-subtle': tokens.colorBorderSecondary,
    '--color-divider': tokens.colorBorderSecondary,
    '--color-handle': tokens.colorTextQuaternary,
    '--color-nav': '#1e293b',
    '--color-nav-hover': '#334155',
    // 导航与主按钮共用主色；交互时加深背景，保持白字可读。
    '--color-nav-active': 'var(--color-accent)',
    '--color-nav-active-text': 'var(--color-on-accent)',
    '--color-nav-active-hover': 'var(--color-accent-active)',
    '--color-nav-pressed': 'var(--color-accent-active)',
    '--color-nav-text': '#cbd5e1',
    '--color-nav-emphasis': 'var(--color-on-accent)',
    '--color-success': tokens.colorSuccess,
    '--color-warning': tokens.colorWarning,
    '--color-danger': tokens.colorError,
    // 树列表与应用类型的专用配色；组件和样式仅引用语义变量。
    '--color-tree-panel-border': tokens.colorBorderSecondary,
    '--color-tree-empty': '#75838d',
    '--color-tree-switcher': '#8a9aa3',
    '--color-tree-folder': '#77939e',
    '--color-tree-count-text': '#7d8e98',
    '--color-tree-count-bg': '#f1f5f7',
    '--color-tree-search-bg': '#fff1f0',
    '--color-tree-search-text': '#cf1322',
    '--color-tree-locate': '#f5222d',
    '--color-tree-preview-bg': '#ffffffe6',
    '--color-tree-preview-text': '#536873',
    '--color-tree-preview-shadow': '#2038460d',
    '--color-tree-preview-count-bg': '#edf3f5',
    '--color-tree-preview-count-text': '#70838c',
    '--color-tree-loading-bg': '#ffffffa6',
    '--color-tree-filter-shadow': '#20384612',
    '--color-leaf-default': '#8c959f',
    '--color-leaf-default-text': '#59636e',
    '--color-leaf-default-bg': '#f0f2f4',
    '--color-leaf-public': '#fa8c16',
    '--color-leaf-public-hover': '#ffa940',
    '--color-leaf-public-border': '#ffd591',
    '--color-leaf-public-bg': '#fff7e6',
    '--color-leaf-public-bg-hover': '#ffe7ba',
    '--color-leaf-public-text': '#d46b08',
    '--color-leaf-incremental': '#13c2c2',
    '--color-leaf-incremental-hover': '#36cfc9',
    '--color-leaf-incremental-border': '#87e8de',
    '--color-leaf-incremental-bg': '#e6fffb',
    '--color-leaf-incremental-bg-hover': '#b5f5ec',
    '--color-leaf-incremental-text': '#087f8c',

    '--color-logo-red': '#fa3155',
    '--color-logo-blue': '#1677ff',
    '--color-logo-cyan': '#22b5ef',

    // 树节点可在自己的作用域切换强调色，默认沿用全局主题。
    '--accent': 'var(--color-accent)',
    '--accent-hover': 'var(--color-accent-hover)',
    '--accent-border': 'var(--color-accent-border)',
    '--accent-bg': 'var(--color-hover)',
    '--accent-bg-hover': 'var(--color-accent-bg-hover)',
    '--accent-text': 'var(--color-accent-text)',
    '--tree-focus-color': 'var(--color-accent-border)',
    '--tree-focus-width': `${tokens.lineWidthFocus}px`,
    '--tree-focus-radius': `${tokens.borderRadius}px`,
  };

  if (mode === 'light') return variables;
  const orange = theme.getDesignToken({
    ...darkAppTheme,
    token: {
      ...darkAppTheme.token,
      colorPrimary: dracula.orange,
      colorPrimaryHover: '#ffd09b',
      colorPrimaryActive: '#eaa35b',
      colorPrimaryText: dracula.orange,
      colorPrimaryTextHover: '#ffd09b',
      colorPrimaryTextActive: '#eaa35b',
      colorPrimaryBg: '#3b3031',
      colorPrimaryBgHover: '#4a3933',
      colorPrimaryBorder: '#896342',
      colorPrimaryBorderHover: dracula.orange,
    },
  });
  const cyan = theme.getDesignToken({
    ...darkAppTheme,
    token: {
      ...darkAppTheme.token,
      colorPrimary: dracula.cyan,
      colorPrimaryHover: '#a4ffff',
      colorPrimaryActive: '#6dd5ed',
      colorPrimaryText: dracula.cyan,
      colorPrimaryTextHover: '#a4ffff',
      colorPrimaryTextActive: '#6dd5ed',
      colorPrimaryBg: '#293b45',
      colorPrimaryBgHover: '#304954',
      colorPrimaryBorder: '#4d7d8d',
      colorPrimaryBorderHover: dracula.cyan,
    },
  });
  return {
    ...variables,
    // 头部与内容面板共用表面色，通过现有分隔线区分区域。
    '--color-header': tokens.colorBgContainer,
    '--color-nav': dracula.surfaceLight,
    '--color-nav-hover': dracula.selection,
    '--color-nav-active': '#353044',
    '--color-nav-active-text': dracula.purple,
    '--color-nav-active-hover': '#403650',
    '--color-nav-pressed': dracula.selection,
    '--color-nav-text': tokens.colorTextSecondary,
    '--color-nav-emphasis': tokens.colorText,
    '--color-tree-panel-border': tokens.colorBorderSecondary,
    '--color-tree-empty': tokens.colorTextSecondary,
    '--color-tree-switcher': tokens.colorTextSecondary,
    '--color-tree-folder': dracula.purple,
    '--color-tree-count-text': tokens.colorTextSecondary,
    '--color-tree-count-bg': dracula.selection,
    '--color-tree-search-bg': '#4a3933',
    '--color-tree-search-text': dracula.orange,
    '--color-tree-locate': dracula.pink,
    '--color-tree-preview-bg': tokens.colorBgElevated,
    '--color-tree-preview-text': tokens.colorTextSecondary,
    '--color-tree-preview-shadow': '#00000066',
    '--color-tree-preview-count-bg': tokens.colorFillSecondary,
    '--color-tree-preview-count-text': tokens.colorTextSecondary,
    '--color-tree-loading-bg': `${tokens.colorBgContainer}a6`,
    '--color-tree-filter-shadow': '#00000066',
    '--color-leaf-default': tokens.colorTextSecondary,
    '--color-leaf-default-text': tokens.colorTextSecondary,
    '--color-leaf-default-bg': tokens.colorFillSecondary,
    '--color-leaf-public': orange.colorPrimary,
    '--color-leaf-public-hover': orange.colorPrimaryHover,
    '--color-leaf-public-border': orange.colorPrimaryBorder,
    '--color-leaf-public-bg': orange.colorPrimaryBg,
    '--color-leaf-public-bg-hover': orange.colorPrimaryBgHover,
    '--color-leaf-public-text': orange.colorPrimaryText,
    '--color-leaf-incremental': cyan.colorPrimary,
    '--color-leaf-incremental-hover': cyan.colorPrimaryHover,
    '--color-leaf-incremental-border': cyan.colorPrimaryBorder,
    '--color-leaf-incremental-bg': cyan.colorPrimaryBg,
    '--color-leaf-incremental-bg-hover': cyan.colorPrimaryBgHover,
    '--color-leaf-incremental-text': cyan.colorPrimaryText,
  };
}

// 固定主题变量在模块加载时计算一次；用户圆角预览由 applyTheme 覆盖，不重算整套调色板。
export const themeVariables = createThemeVariables('light');
export const themeVariablesByMode = { light: themeVariables, dark: createThemeVariables('dark') };

/** 导航局部覆盖：contrast 继承独立导航色，theme 在导航及预览作用域复用全局表面色与文字色。 */
export const navigationThemeVariables: Record<NavigationTheme, Record<string, string>> = {
  contrast: {},
  theme: {
    '--color-nav': 'var(--color-surface)',
    '--color-nav-hover': 'var(--color-sidebar)',
    '--color-nav-active': 'var(--color-hover)',
    '--color-nav-active-text': 'var(--color-accent-text)',
    '--color-nav-active-hover': 'var(--color-accent-bg-hover)',
    '--color-nav-pressed': 'var(--color-accent-bg-hover)',
    '--color-nav-text': 'var(--color-text-secondary)',
    '--color-nav-emphasis': 'var(--color-text)',
  },
};

/**
 * Provider 在 React 提交阶段调用的 DOM 同步入口：补齐首屏变量，并同步实际配色与两类圆角。
 * 不解析 system、不读写 Redux 或存储；系统外观解析由 Hook 负责，设置保存由偏好状态机负责。
 * HTML 设置的画布背景引用 --color-canvas，因此这里更新变量即可接管背景，无需再次写固定色值。
 */
export function applyTheme(
  mode: ResolvedThemeMode,
  borderRadius = defaultUserSettings.borderRadius,
  controlBorderRadius = defaultUserSettings.controlBorderRadius,
) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(themeVariablesByMode[mode])) {
    // 圆角由用户设置覆盖，避免拖动时先恢复主题默认值再写入预览值。
    if (name !== '--ui-radius' && name !== '--control-radius' && name !== '--tree-focus-radius')
      root.style.setProperty(name, value);
  }
  root.style.setProperty('--ui-radius', `${borderRadius}px`);
  root.style.setProperty('--control-radius', `${controlBorderRadius}px`);
  root.style.setProperty('--tree-focus-radius', `${controlBorderRadius}px`);
  // color-scheme 影响浏览器原生控件与滚动条，data-theme 供主题选择器读取，两者都使用实际配色。
  root.style.colorScheme = mode;
  root.dataset.theme = mode;
}
