/**
 * 产品介绍页独立配色，取自产品标志的红蓝双色；不跟随平台明暗主题，保证对外展示一致。
 * 页面根节点把色值写成 --lp-* 变量供 UnoCSS 使用，画布和渐变等脚本场景直接读取此对象。
 */
export const palette = {
  ink: '#0e1a2b',
  paper: '#f5f7fa',
  surface: '#ffffff',
  line: '#dde3ec',
  muted: '#5a6577',
  blue: '#1677ff',
  red: '#ef2f4f',
} as const;

export const paletteVariables = Object.fromEntries(
  Object.entries(palette).map(([name, value]) => [`--lp-${name}`, value]),
);
