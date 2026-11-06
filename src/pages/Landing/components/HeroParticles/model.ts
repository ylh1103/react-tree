/** 与参考效果一致的网格常量、色彩混合和缓动公式。 */
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const toRgb = (hex: string) => {
  const normalized = hex.replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');
  const value = parseInt(normalized.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = (rgb: number[]) =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

const mix = (from: string, to: string, t: number) => {
  if (typeof from === 'string' && typeof to === 'string' && HEX.test(from) && HEX.test(to)) {
    const a = toRgb(from);
    const b = toRgb(to);
    return toHex(a.map((channel, index) => channel + (b[index] - channel) * t));
  }
  return t < 0.5 ? from : to;
};

export const DOT = { size: 2.6, gap: 22, radius: 360, strength: 0.264 };

const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const dotTint = (wave: string, base: string, light: boolean) => {
  if (!HEX.test(wave) || !HEX.test(base)) return wave;
  const delta = Math.abs(luminance(wave) - luminance(base)) || 1;
  return mix(base, wave, Math.min(1, Math.max(0.15, (light ? 48 : 54) / delta)));
};
export const IDLE_MS = 2600;

export const smootherstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export interface PointerPosition {
  x: number;
  y: number;
}
