import { theme, type ThemeConfig } from 'antd';

export const appTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: { borderRadius: 6, fontSize: 14 },
};

const tokens = theme.getDesignToken(appTheme);

/** 全局配色的唯一来源：Ant Design 与 UnoCSS 共用这组颜色。 */
export const themeVariables = {
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
  '--color-nav-active': 'var(--color-accent)',
  '--color-nav-active-hover': 'var(--color-accent-hover)',
  '--color-nav-pressed': 'var(--color-accent-active)',
  '--color-nav-text': '#cbd5e1',
  '--color-nav-emphasis': 'var(--color-on-accent)',
  '--color-success': tokens.colorSuccess,
  '--color-warning': tokens.colorWarning,
  '--color-danger': tokens.colorError,
  '--color-logo-red': '#fa3155',
  '--color-logo-blue': '#1677ff',
  '--color-logo-cyan': '#22b5ef',
};
