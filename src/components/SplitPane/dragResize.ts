export interface DragResizeState {
  x: number;
  width: number;
  visible: boolean;
  pointerId: number;
}

/** 切换显隐后重置拖拽起点，保留反向拖动的缓冲距离，避免阈值附近抖动。 */
export function dragResize(
  drag: DragResizeState,
  x: number,
  min: number,
  max: number,
  threshold = Math.floor(min / 2),
) {
  const clamp = (width: number) => Math.max(min, Math.min(max, width));
  if (!drag.visible) {
    if (max > 0 && x - drag.x >= threshold) {
      const width = clamp(drag.width);
      return { drag: { ...drag, x, width, visible: true }, width, visible: true };
    }
    return { drag, width: drag.width, visible: false };
  }
  const next = drag.width + x - drag.x;
  if (next <= min - threshold) {
    return { drag: { ...drag, x, width: min, visible: false }, width: min, visible: false };
  }
  return { drag, width: clamp(next), visible: true };
}
