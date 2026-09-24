import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { DropIndicator, DropPosition } from './types';
import { buildTreeIndex } from './treeUtils';

// 指针落在目标行的相对位置决定放置方式：上下各 25% 区域视为“插入前/后”，
// 中间 50% 视为“放入内部”（仅分组节点支持）；叶子节点没有“内部”概念，直接对半判断前后。
function computeDropPosition(rect: DOMRect, pointerY: number, overIsBranch: boolean): DropPosition {
  const ratio = (pointerY - rect.top) / rect.height;
  if (overIsBranch) {
    if (ratio < 0.25) return 'before';
    if (ratio > 0.75) return 'after';
    return 'inside';
  }
  return ratio < 0.5 ? 'before' : 'after';
}

export function useDragDrop(
  index: ReturnType<typeof buildTreeIndex>,
  onMove: (dragKey: string, overKey: string, position: DropPosition) => void,
) {
  const [activeDragKey, setActiveDragKey] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  // state 驱动提示渲染，ref 同步记录最新落点，供拖拽结束事件立即读取。
  const dropIndicatorRef = useRef<DropIndicator | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const isValidDrop = useCallback(
    (dragKey: string, overKey: string, position: DropPosition): boolean => {
      if (dragKey === overKey) return false;
      const dragNode = index.nodeByKey.get(dragKey);
      const overNode = index.nodeByKey.get(overKey);
      if (!dragNode || !overNode) return false;
      if (position === 'inside' && overNode.type !== 'branch') return false;
      // 防止成环：分组不能被拖入自身或自己的子孙分组内。
      if (dragNode.type === 'branch' && index.ancestors(overKey).includes(dragKey)) return false;
      return true;
    },
    [index],
  );

  // 放置目标改用 elementFromPoint 根据指针实时坐标手动命中测试（而非 dnd-kit 自带的
  // useDroppable + 碰撞检测）。原因：dnd-kit 的碰撞检测依赖各 droppable 的矩形测量，
  // 在这种绝对定位 + translateY 驱动的虚拟列表行上测量结果不稳定（曾出现拖拽中途
  // over 变为 undefined、rect 坐标与实际行位置对不上等问题），改为直接测量鼠标下方
  // 的真实 DOM 元素（原理与 antd Tree 自身用 dragover 事件的 clientY 计算方式一致）更可靠。
  useEffect(() => {
    if (!activeDragKey) return;

    const handlePointerMove = (e: PointerEvent) => {
      const target = (
        document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      )?.closest('[data-node-key]');
      const overKey = target?.getAttribute('data-node-key') ?? null;

      if (!overKey || overKey === activeDragKey) {
        dropIndicatorRef.current = null;
        setDropIndicator(null);
        return;
      }

      const overNode = index.nodeByKey.get(overKey);
      if (!overNode) {
        dropIndicatorRef.current = null;
        setDropIndicator(null);
        return;
      }

      const rect = target!.getBoundingClientRect();
      const position = computeDropPosition(rect, e.clientY, overNode.type === 'branch');

      if (!isValidDrop(activeDragKey, overKey, position)) {
        dropIndicatorRef.current = null;
        setDropIndicator(null);
        return;
      }

      const previous = dropIndicatorRef.current;
      if (previous?.overKey === overKey && previous.position === position) return;
      const next = { overKey, position };
      dropIndicatorRef.current = next;
      setDropIndicator(next);
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [activeDragKey, index, isValidDrop]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragKey(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const dragKey = String(event.active.id);
    const indicator = dropIndicatorRef.current;
    setActiveDragKey(null);
    setDropIndicator(null);
    dropIndicatorRef.current = null;

    if (!indicator) return;
    if (!isValidDrop(dragKey, indicator.overKey, indicator.position)) return;
    onMove(dragKey, indicator.overKey, indicator.position);
  };

  const handleDragCancel = () => {
    setActiveDragKey(null);
    setDropIndicator(null);
    dropIndicatorRef.current = null;
  };

  return {
    sensors,
    activeDragKey,
    dropIndicator,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
