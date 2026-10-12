export interface DragResizeState {
  x: number;
  width: number;
  visible: boolean;
  pointerId: number;
}

/** 和 VS Code 一样，整次手势使用固定起点及吸附阈值，显隐切换不重置位移。 */
export function dragResize(
  drag: DragResizeState,
  x: number,
  min: number,
  max: number,
  threshold = Math.floor(min / 2),
) {
  const clamp = (width: number) => Math.max(min, Math.min(max, width));
  const next = (drag.visible ? drag.width : 0) + x - drag.x;
  const snapWidth = drag.visible ? min - threshold : threshold;
  const visible = max > 0 && next >= snapWidth;
  // 隐藏时保留手势开始前的宽度供按钮恢复；拖动展开则直接跟随鼠标。
  return { drag, width: clamp(visible ? next : drag.width), visible };
}
