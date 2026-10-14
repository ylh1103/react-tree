/** 按标题栏外框宽度判断，和用户看到的整条标题栏尺寸一致。 */
export function getToolbarActionLabelMode(width: number) {
  return width >= 1450 ? 'all' : width >= 1050 ? 'primary' : 'icons';
}

/** 环境从末尾收纳；展开预留缓冲，避免分栏边界附近反复切换。 */
export function fitEnvironmentCount({
  availableWidth,
  allWidth,
  environmentWidths,
  moreWidth,
  previousCount,
}: {
  availableWidth: number;
  allWidth: number;
  environmentWidths: number[];
  moreWidth: number;
  previousCount: number;
}) {
  for (let count = environmentWidths.length; count > 0; count--) {
    const width =
      allWidth +
      8 +
      environmentWidths.slice(0, count).reduce((sum, item) => sum + item, 0) +
      Math.max(0, count - 1) * 4 +
      (count < environmentWidths.length ? moreWidth + 4 : 0);
    if (width + (count > previousCount ? 16 : 0) <= availableWidth) return count;
  }
  return 1;
}
