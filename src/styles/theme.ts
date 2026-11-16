/**
 * 平台主题定义：Ant Design 使用 token，UnoCSS 和 body 弹层使用由同一 token 派生的 CSS 变量。
 * Vite 首屏插件也从这里提取画布与文字颜色，修改配色无需同步维护另一套首屏色值。
 * 本模块计算主题和变量映射；运行时 DOM 写入统一由 AppThemeProvider 调用 applyTheme 完成。
 */
import { theme, type ThemeConfig } from 'antd';
import type { NavigationTheme, ResolvedThemeMode } from '../types/preferences.ts';
import { defaultUserSettings } from '../types/preferences.ts';
import type { ThemePaletteId } from '../types/themeMode.ts';
import { shadcnPalettes } from './shadcnPalettes.ts';

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
  red: '#ff5555',
  // 用不同亮度区分浮层、侧栏和页面画布，避免暗色界面只靠阴影表达层级。
  surfaceLight: '#343746',
  surfaceDark: '#21222c',
  surfaceDarker: '#191a21',
};

/** 主色采用 Dracula 徽标粉；平台强调与 Ant Design 控件共用同一组交互色。 */
const darkAccent = {
  main: dracula.pink,
  hover: '#ff92df',
  active: '#e563af',
  background: '#402d3b',
  backgroundHover: '#503346',
  border: '#9b527e',
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
    // 覆盖暗色算法的降亮结果，粉色强调与低亮度选中背景分别控制。
    colorPrimary: darkAccent.main,
    colorPrimaryHover: darkAccent.hover,
    colorPrimaryActive: darkAccent.active,
    colorPrimaryText: darkAccent.main,
    colorPrimaryTextHover: darkAccent.hover,
    colorPrimaryTextActive: darkAccent.active,
    colorPrimaryBg: darkAccent.background,
    colorPrimaryBgHover: darkAccent.backgroundHover,
    colorPrimaryBorder: darkAccent.border,
    colorPrimaryBorderHover: darkAccent.main,
    // 亮色实心区域默认使用深字；主按钮文字单独与复选框勾选标记保持一致。
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
      // Ant Design 复选框勾选标记使用 colorWhite（#fff），主按钮文字同步使用纯白。
      primaryColor: '#fff',
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
      // 仅覆盖交互表面色；文字与边框使用 Ant Design 从主色派生的 hover/active 默认值。
      defaultHoverBg: dracula.selection,
      defaultActiveBg: dracula.background,
    },
  },
};
export const appThemes = { light: appTheme, dark: darkAppTheme };

function rgb(hex: string) {
  const color = Number.parseInt(hex.slice(1), 16);
  return [color >> 16, (color >> 8) & 255, color & 255];
}

function mix(color: string, target: string, amount: number) {
  const channels = rgb(target);
  return (
    '#' +
    rgb(color)
      .map((channel, index) =>
        Math.round(channel + (channels[index] - channel) * amount)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function luminance(color: string) {
  const [r, g, b] = rgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first: string, second: string) {
  const a = luminance(first) + 0.05;
  const b = luminance(second) + 0.05;
  return Math.max(a, b) / Math.min(a, b);
}

function readableColor(color: string, surfaces: string[], fallback: string) {
  for (let step = 0; step < 10; step += 1) {
    const candidate = mix(color, fallback, step / 10);
    if (surfaces.every((surface) => contrast(candidate, surface) >= 4.5)) return candidate;
  }
  return fallback;
}

const paletteThemes = new Map<string, ThemeConfig>();

/** 按需映射当前配色；品牌色保留给填充，文字和选中状态按实际表面校正对比度。 */
export function getAppTheme(mode: ResolvedThemeMode, palette: ThemePaletteId = 'platform') {
  if (palette === 'platform') return appThemes[mode];
  const key = `${palette}:${mode}`;
  const cached = paletteThemes.get(key);
  if (cached) return cached;
  const [
    canvas,
    surface,
    popover,
    muted,
    sidebar,
    border,
    foreground,
    secondary,
    primary,
    onPrimary,
    ,
    popoverForeground,
  ] = shadcnPalettes[palette][mode === 'light' ? 1 : 2];
  const textFallback = mode === 'light' ? '#000000' : '#ffffff';
  const surfaces = [canvas, surface, popover, muted, sidebar];
  const text = readableColor(foreground, surfaces, textFallback);
  const secondaryText = readableColor(secondary, surfaces, textFallback);
  const popupText = readableColor(popoverForeground, [popover], textFallback);
  const placeholder = readableColor(secondary, [surface, popover], textFallback);
  // 保留原主题的主按钮文字色；需要时微调填充色，让文字在普通、悬停与按下状态都清晰。
  const fillTarget = luminance(onPrimary) > 0.179 ? '#000000' : '#ffffff';
  const fill = readableColor(primary, [onPrimary], fillTarget);
  const selected = mix(surface, primary, 0.13);
  const selectedHover = mix(surface, primary, 0.2);
  const accentText = readableColor(primary, [...surfaces, selected, selectedHover], textFallback);
  const config: ThemeConfig = {
    algorithm: appThemes[mode].algorithm,
    token: {
      ...appTheme.token,
      colorBgBase: canvas,
      colorBgLayout: canvas,
      colorBgContainer: surface,
      colorBgElevated: popover,
      colorFillAlter: muted,
      colorTextBase: foreground,
      colorText: text,
      colorTextSecondary: secondaryText,
      colorTextTertiary: secondaryText,
      colorTextPlaceholder: placeholder,
      colorBorder: border,
      colorBorderSecondary: border,
      colorPrimary: fill,
      colorPrimaryHover: mix(fill, fillTarget, 0.08),
      colorPrimaryActive: mix(fill, fillTarget, 0.16),
      colorPrimaryBg: selected,
      colorPrimaryBgHover: selectedHover,
      colorPrimaryBorder: mix(border, primary, 0.55),
      colorPrimaryBorderHover: mix(border, primary, 0.75),
      colorPrimaryText: accentText,
      colorPrimaryTextHover: accentText,
      colorPrimaryTextActive: accentText,
      colorLink: accentText,
      colorLinkHover: accentText,
      colorLinkActive: accentText,
    },
    components: {
      Dropdown: { colorText: popupText },
      Popover: { colorText: popupText, colorTextHeading: popupText },
      Tooltip: { colorTextLightSolid: popupText, colorBgSpotlight: popover },
      Button: {
        primaryColor: onPrimary,
        defaultShadow: 'none',
        primaryShadow: 'none',
        defaultHoverColor: accentText,
        defaultActiveColor: accentText,
        linkHoverBg: selected,
      },
    },
  };
  paletteThemes.set(key, config);
  return config;
}

/**
 * 生成控件主题；面板圆角只作用于 CSS，不参与此处的 Ant Design token 计算。
 * 常用圆角沿用默认层级，大圆角按各尺寸控件高度扩展，避免 SM/LG 的固定上限破坏相对比例。
 */
export function createAppTheme(
  mode: ResolvedThemeMode,
  controlBorderRadius: number,
  palette: ThemePaletteId = 'platform',
): ThemeConfig {
  const base = getAppTheme(mode, palette);
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
function createThemeVariables(mode: ResolvedThemeMode, palette: ThemePaletteId = 'platform') {
  const config = getAppTheme(mode, palette);
  const tokens = theme.getDesignToken(config);

  const variables = {
    '--layout-gap': `${defaultUserSettings.layoutGap}px`,
    '--ui-radius': `${defaultUserSettings.borderRadius}px`,
    '--control-radius': `${defaultUserSettings.controlBorderRadius}px`,
    '--color-canvas': tokens.colorBgLayout,
    '--color-header': tokens.colorBgContainer,
    '--color-surface': tokens.colorBgContainer,
    '--color-sidebar': tokens.colorFillAlter,
    '--color-text': tokens.colorText,
    '--color-surface-text': tokens.colorText,
    '--color-popover-text': config.components?.Popover?.colorText ?? tokens.colorText,
    '--color-sidebar-text': tokens.colorTextSecondary,
    '--color-text-secondary': tokens.colorTextSecondary,
    '--color-text-muted': tokens.colorTextTertiary,
    '--color-watermark': tokens.colorFillSecondary,
    '--color-accent': tokens.colorPrimary,
    '--color-accent-hover': tokens.colorPrimaryHover,
    '--color-accent-active': tokens.colorPrimaryActive,
    '--color-accent-text': tokens.colorPrimaryText,
    '--color-settings-surface': tokens.colorBgElevated,
    '--color-on-accent':
      palette === 'platform'
        ? tokens.colorTextLightSolid
        : (config.components?.Button?.primaryColor ?? tokens.colorTextLightSolid),
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
    '--color-nav-active': tokens.colorPrimaryBg,
    '--color-nav-active-text': tokens.colorPrimaryText,
    '--color-nav-active-hover': tokens.colorPrimaryBgHover,
    '--color-nav-pressed': dracula.selection,
    '--color-nav-text': tokens.colorTextSecondary,
    '--color-nav-emphasis': tokens.colorText,
    '--color-tree-panel-border': tokens.colorBorderSecondary,
    '--color-tree-empty': tokens.colorTextSecondary,
    '--color-tree-switcher': tokens.colorTextSecondary,
    '--color-tree-folder': darkAccent.main,
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
const paletteVariables = new Map<string, ReturnType<typeof createThemeVariables>>();

/** 设置缩略图和根节点共用映射，按需计算并复用同一套固定色值。 */
export function getThemeVariables(mode: ResolvedThemeMode, palette: ThemePaletteId = 'platform') {
  if (palette === 'platform') return themeVariablesByMode[mode];
  const key = `${palette}:${mode}`;
  let variables = paletteVariables.get(key);
  if (!variables) {
    const base = createThemeVariables(mode, palette);
    const [canvas, surface, , , sidebar, , foreground, , , , cardForeground, , sidebarForeground] =
      shadcnPalettes[palette][mode === 'light' ? 1 : 2];
    const fallback = mode === 'light' ? '#000000' : '#ffffff';
    const sidebarText = readableColor(sidebarForeground, [sidebar], fallback);
    const nav = mix(sidebar, '#000000', mode === 'light' ? 0.79 : 0.25);
    variables = {
      ...base,
      '--color-text': readableColor(foreground, [canvas], fallback),
      '--color-surface-text': readableColor(cardForeground, [surface], fallback),
      '--color-sidebar': sidebar,
      '--color-sidebar-text': sidebarText,
      '--color-nav': nav,
      '--color-nav-hover': mix(nav, '#ffffff', 0.12),
      '--color-nav-pressed': mix(nav, '#ffffff', 0.12),
      '--color-nav-text': mix(nav, '#ffffff', 0.78),
      '--color-nav-emphasis': '#ffffff',
      '--color-nav-active': base['--color-accent'],
      '--color-nav-active-text': base['--color-on-accent'],
      '--color-nav-active-hover': base['--color-accent-active'],
      '--color-tree-empty': base['--color-text-secondary'],
      '--color-tree-switcher': base['--color-text-secondary'],
      '--color-tree-folder': base['--color-accent-text'],
      '--color-tree-count-text': sidebarText,
      '--color-tree-count-bg': 'var(--color-sidebar)',
      '--color-tree-preview-bg': base['--color-settings-surface'],
      '--color-tree-preview-text': base['--color-popover-text'],
      '--color-tree-preview-count-bg': sidebar,
      '--color-tree-preview-count-text': sidebarText,
      '--color-leaf-default': base['--color-text-secondary'],
      '--color-leaf-default-text': base['--color-text-secondary'],
      '--color-leaf-default-bg': sidebar,
      '--color-tree-loading-bg': 'color-mix(in srgb, var(--color-surface) 65%, transparent)',
    };
    paletteVariables.set(key, variables);
  }
  return variables;
}

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
    '--color-nav-emphasis': 'var(--color-surface-text)',
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
  palette: ThemePaletteId = 'platform',
) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(getThemeVariables(mode, palette))) {
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
