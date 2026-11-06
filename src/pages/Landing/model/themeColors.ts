/** 为主题 token 替换透明度；Ant Design 的颜色可能是十六进制，也可能是 rgb/rgba。 */
export function withAlpha(color: string, alpha: number) {
  const normalized = color.trim().replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');
  if (/^#[\da-f]{6}$/i.test(normalized)) {
    const channels = [1, 3, 5].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
    return `rgba(${channels.join(',')},${alpha})`;
  }
  const channels =
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i.exec(normalized);
  return channels ? `rgba(${channels[1]},${channels[2]},${channels[3]},${alpha})` : color;
}
