/** 分栏尺寸的只读解析规则；骨架和交互容器共用，避免占位阶段写入偏好或引入交互依赖。 */
export interface SplitPaneLayout {
  width: number;
  visible: boolean;
}

/** 历史缓存缺字段或损坏时逐字段回退，宽度沿用正式分栏的有效范围。 */
export function readSplitPaneLayout(
  storageKey: string | undefined,
  defaultWidth: number,
  defaultVisible = true,
  minWidth = 260,
  maxWidth = 640,
): SplitPaneLayout {
  const fallback = { width: defaultWidth, visible: defaultVisible };
  if (!storageKey) return fallback;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    return {
      width: Number.isFinite(saved?.width)
        ? Math.max(minWidth, Math.min(maxWidth, saved.width))
        : defaultWidth,
      visible: typeof saved?.visible === 'boolean' ? saved.visible : defaultVisible,
    };
  } catch {
    return fallback;
  }
}
