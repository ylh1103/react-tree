/**
 * 产品介绍页独立的深色配色，强调色取自产品标志的红蓝双色；不跟随平台明暗主题，保证对外展示一致。
 * 页面根节点把色值写成 --lp-* 变量供 UnoCSS 使用，画布和渐变等脚本场景直接读取此对象。
 */
export const palette = {
  bg: '#09090b',
  panel: '#111115',
  line: '#24242b',
  fg: '#ededf0',
  muted: '#8b8b96',
  blue: '#4d8dff',
  red: '#ff4d6a',
} as const;

export const paletteVariables = Object.fromEntries(
  Object.entries(palette).map(([name, value]) => [`--lp-${name}`, value]),
);
