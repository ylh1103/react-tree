import type { Modifier } from '@dnd-kit/core';

// DragOverlay 的 top/left 必须为 0，返回视口坐标。
// 不减 activeNodeRect：它会随目录展开、滚动和虚拟行卸载变化。
// 仅偏移预览，不改变指针命中位置。为上方的目标提示预留空间。
export const offsetDragPreview: Modifier = ({ activatorEvent, transform, windowRect }) => {
  if (!activatorEvent || !('clientX' in activatorEvent)) return transform;
  const pointer = activatorEvent as PointerEvent;
  const pointerX = pointer.clientX + transform.x;
  const pointerY = pointer.clientY + transform.y;
  const width = Math.min(208, (windowRect?.width ?? 240) - 24);
  const left =
    windowRect && pointerX + 24 + width > windowRect.width
      ? Math.max(8, pointerX - width - 24)
      : pointerX + 24;
  const top = windowRect ? Math.min(pointerY + 72, windowRect.height - 40) : pointerY + 72;
  return { ...transform, x: left, y: Math.max(64, top) };
};
