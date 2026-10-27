/** 应用参数工具栏：根据控件实测宽度分配空间，优先保留环境，再保留操作文字。 */
export type ActionLabelMode = 'all' | 'primary' | 'icons';

/** 一次布局结果；扩展时沿用上一结果，为临界宽度预留缓冲。 */
export interface ToolbarLayout {
  visibleCount: number;
  actionLabelMode: ActionLabelMode;
  showMoreLabel: boolean;
}

export const actionLabelModes: ActionLabelMode[] = ['all', 'primary', 'icons'];

/** 输入只包含独立测量的自然宽度，避免当前收纳结果反过来影响下一轮计算。 */
export function fitToolbarLayout({
  availableWidth,
  allWidth,
  environmentWidths,
  moreWidths,
  actionWidths,
  groupGap,
  previous,
}: {
  availableWidth: number;
  allWidth: number;
  environmentWidths: number[];
  moreWidths: { label: number; icon: number };
  actionWidths: Record<ActionLabelMode, number>;
  groupGap: number;
  previous?: ToolbarLayout;
}): ToolbarLayout {
  const candidates: ToolbarLayout[] = [];
  for (let count = environmentWidths.length; count >= 1; count--) {
    for (const mode of actionLabelModes) {
      for (const label of count < environmentWidths.length ? [true, false] : [false]) {
        candidates.push({ visibleCount: count, actionLabelMode: mode, showMoreLabel: label });
      }
    }
  }
  const previousIndex = previous
    ? candidates.findIndex(
        (candidate) =>
          candidate.visibleCount === previous.visibleCount &&
          candidate.actionLabelMode === previous.actionLabelMode &&
          candidate.showMoreLabel === previous.showMoreLabel,
      )
    : -1;
  for (const [index, candidate] of candidates.entries()) {
    const count = candidate.visibleCount;
    const environmentWidth =
      allWidth +
      8 +
      environmentWidths.slice(0, count).reduce((sum, width) => sum + width, 0) +
      Math.max(0, count - 1) * 4 +
      (count < environmentWidths.length
        ? 4 + (candidate.showMoreLabel ? moreWidths.label : moreWidths.icon)
        : 0);
    // 缩小时立即收纳，展开多留 16px，避免分栏拖拽时反复切换。
    const buffer = previousIndex >= 0 && index < previousIndex ? 16 : 0;
    if (
      environmentWidth + actionWidths[candidate.actionLabelMode] + groupGap + buffer <=
      availableWidth
    )
      return candidate;
  }
  return { visibleCount: 1, actionLabelMode: 'icons', showMoreLabel: false };
}
