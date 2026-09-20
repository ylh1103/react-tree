import { DragOverlay, type Modifier } from '@dnd-kit/core';
import type { DropIndicator } from './types';
import type { buildTreeIndex } from './utils';

// 仅偏移预览，不改变指针命中位置。为上方的目标提示预留空间。
const offsetDragPreview: Modifier = ({ activatorEvent, activeNodeRect, transform, windowRect }) => {
  if (!activeNodeRect || !activatorEvent || !('clientX' in activatorEvent)) return transform;
  const pointer = activatorEvent as PointerEvent;
  const pointerX = pointer.clientX + transform.x;
  const pointerY = pointer.clientY + transform.y;
  const width = Math.min(208, (windowRect?.width ?? 240) - 24);
  const left =
    windowRect && pointerX + 24 + width > windowRect.width
      ? Math.max(8, pointerX - width - 24)
      : pointerX + 24;
  const top = windowRect ? Math.min(pointerY + 72, windowRect.height - 40) : pointerY + 72;
  return { ...transform, x: left - activeNodeRect.left, y: Math.max(64, top) - activeNodeRect.top };
};
const dragPreviewModifiers = [offsetDragPreview];

export function TreeDragPreview({
  activeDragKey,
  dropIndicator,
  treeIndex,
}: {
  activeDragKey: string | null;
  dropIndicator: DropIndicator | null;
  treeIndex: ReturnType<typeof buildTreeIndex>;
}) {
  const activeDragNode = activeDragKey ? treeIndex.nodeByKey.get(activeDragKey) : null;
  const dropTarget = dropIndicator ? treeIndex.nodeByKey.get(dropIndicator.overKey) : null;
  const dropParentKey = dropTarget ? treeIndex.parentByKey.get(dropTarget.key) : null;
  const dropParentTitle = dropParentKey ? treeIndex.nodeByKey.get(dropParentKey)?.title : '根目录';
  const dropDescription =
    dropTarget && dropIndicator
      ? dropIndicator.position === 'inside'
        ? '移入「' + dropTarget.title + '」· 成为子节点'
        : '与「' +
          dropTarget.title +
          '」同级 · 放在其' +
          (dropIndicator.position === 'before' ? '前' : '后') +
          '方（' +
          dropParentTitle +
          '）'
      : '移动到分组中部以移入，上下边缘以同级插入';

  return (
    <DragOverlay
      modifiers={dragPreviewModifiers}
      dropAnimation={null}
      style={{ pointerEvents: 'none', width: 'max-content' }}
    >
      {activeDragNode ? (
        <div
          aria-hidden="true"
          className="tree-drag-preview relative flex items-center gap-1.75 w-52 max-w-[calc(100vw-24px)] h-7.5 px-2.25 py-0 border border-solid border-[var(--accent-border)] rounded-[5px] bg-[#ffffffe6] text-[#536873] shadow-[0_2px_6px_#2038460d] text-[12px] pointer-events-none select-none"
        >
          <div className="tree-drag-hint absolute bottom-[calc(100%+5px)] left-0 w-52 max-w-[calc(100vw-24px)] px-2 py-1.25 border border-solid border-[var(--accent-border)] rounded-[5px] text-[var(--accent-text)] bg-[var(--accent-bg)] text-[11px] leading-[17px] line-clamp-2 [overflow-wrap:anywhere] pointer-events-none">
            {dropDescription}
          </div>
          <span className="tree-drag-preview-icon flex shrink-0 text-[var(--accent)] text-[14px]">
            {activeDragNode.type === 'branch' ? (
              <span aria-hidden="true" className="i-lucide-folder" />
            ) : (
              <span aria-hidden="true" className="i-lucide-file" />
            )}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">
            {activeDragNode.title || '未命名分组'}
          </span>
          {activeDragNode.type === 'branch' && (
            <span className="tree-drag-preview-count shrink-0 px-1.25 py-0.25 rounded-[3px] bg-[#edf3f5] text-[#70838c] text-[10px] leading-4 whitespace-nowrap tabular-nums">
              {activeDragNode.children.length} 项
            </span>
          )}
        </div>
      ) : null}
    </DragOverlay>
  );
}
