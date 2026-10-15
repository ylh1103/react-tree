/**
 * 复用分栏容器：管理宽度、收起状态、键盘操作及拖拽调整。
 * 尺寸按 storageKey 隔离持久化；纯拖拽计算位于 dragResize.ts，骨架可使用只读模式。
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Typography } from 'antd';
import { useDebounceFn, useEventListener, useSize } from 'ahooks';
import { dragResize } from './dragResize';
import type { DragResizeState } from './dragResize';
import { useLayoutPreferences } from '../../hooks/useLayoutPreferences';

export interface SplitPaneProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarLabel?: string;
  title?: string;
  /** 同行操作区，按标题栏容器宽度适配显示。 */
  toolbar?: ReactNode;
  /** 标题栏与主体共用面板，不显示分隔线或间距。 */
  integratedHeader?: boolean;
  /** 加载占位只读取布局，不注册交互或写入偏好。 */
  readOnly?: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  minContentWidth?: number;
  defaultVisible?: boolean;
  /** 每个面板使用独立的 key；省略则不持久化。 */
  storageKey?: string;
}

export function SplitPane({
  sidebar,
  children,
  sidebarLabel = '侧边栏',
  title,
  toolbar,
  integratedHeader = false,
  readOnly = false,
  defaultWidth = 290,
  minWidth = 260,
  maxWidth = 640,
  minContentWidth = 240,
  defaultVisible = true,
  storageKey,
}: SplitPaneProps) {
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  const separatorWidth = compact ? 1 : 4;
  const sidebarId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragResizeState | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingLayoutRef = useRef<{ width: number; visible: boolean } | null>(null);
  // useSize 合并同一帧的尺寸通知，并在容器卸载时解除观察。
  const containerSize = useSize(containerRef);
  const availableWidth = containerSize?.width ?? null;
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  // 延迟高亮由防抖函数管理；离开、按下和卸载都会取消待执行任务。
  const { run: scheduleHover, cancel: cancelHover } = useDebounceFn(
    (separator: HTMLDivElement) => {
      if (separator.isConnected && separator.getAttribute('aria-disabled') !== 'true') {
        setHovered(true);
      }
    },
    { wait: 300 },
  );

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  function clearHover() {
    cancelHover();
    setHovered(false);
  }
  const [layout, setLayout] = useState(() => {
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
  });
  const flushDragLayout = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    const next = pendingLayoutRef.current;
    pendingLayoutRef.current = null;
    if (!next) return;
    setLayout((previous) =>
      previous.width === next.width && previous.visible === next.visible ? previous : next,
    );
  }, []);

  const endDrag = useCallback(() => {
    // 松开或切换侧栏时提交末帧，避免异步更新覆盖后续操作。
    flushDragLayout();
    const drag = dragRef.current;
    dragRef.current = null;
    const separator = separatorRef.current;
    if (drag && separator?.hasPointerCapture(drag.pointerId)) {
      separator.releasePointerCapture(drag.pointerId);
    }
    setDragging(false);
  }, [flushDragLayout]);
  // 优先给右侧内容留出空间，小容器中允许侧栏小于配置的最小宽度。
  const upper = Math.max(
    0,
    Math.min(
      maxWidth,
      availableWidth === null ? maxWidth : availableWidth - minContentWidth - separatorWidth,
    ),
  );
  const lower = Math.min(Math.max(0, minWidth), upper);
  const width = Math.max(lower, Math.min(layout.width, upper));
  const expanded = layout.visible && upper > 0;

  useEffect(() => {
    if (!storageKey || dragging || readOnly) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      /* 禁用存储时仍可使用面板。 */
    }
  }, [layout, dragging, storageKey, readOnly]);

  // 处理器读取最新边界，尺寸变化时无需重新注册键盘监听。
  useEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const ownerDocument = container.ownerDocument;
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        upper === 0 ||
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== 'b'
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'input, textarea, select, [role="textbox"], [role="dialog"], [role="alertdialog"], dialog',
          ))
      )
        return;
      // 对话框焦点尚未转移时，也不触发背景页面的快捷键。
      const dialogs = ownerDocument.querySelectorAll<HTMLElement>(
        '[role="dialog"], [role="alertdialog"], dialog[open]',
      );
      if (Array.from(dialogs).some((dialog) => dialog.getClientRects().length > 0)) return;
      const focusedPane = target instanceof Element ? target.closest('[data-split-pane]') : null;
      const activePane =
        focusedPane ??
        Array.from(ownerDocument.querySelectorAll<HTMLElement>('[data-split-pane]')).find(
          (pane) => pane.getClientRects().length > 0,
        );
      if (activePane !== container || !container?.getClientRects().length) return;
      event.preventDefault();
      endDrag();
      toggleRef.current?.focus();
      setLayout((previous) => ({ ...previous, visible: !previous.visible }));
    },
    { target: () => containerRef.current?.ownerDocument, enable: !readOnly },
  );

  function resize(next: number) {
    setLayout((previous) => ({ ...previous, width: Math.max(lower, Math.min(upper, next)) }));
  }
  function updateDrag(x: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const next = dragResize(drag, x, lower, upper);
    pendingLayoutRef.current = { width: next.width, visible: next.visible };
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(flushDragLayout);
    }
  }
  function toggle() {
    if (readOnly) return;
    endDrag();
    toggleRef.current?.focus();
    setLayout((previous) => ({ ...previous, visible: !previous.visible }));
  }

  return (
    <div
      ref={containerRef}
      data-split-pane
      data-sidebar-expanded={expanded}
      className={`flex w-full h-full min-h-0 min-w-0 overflow-hidden bg-canvas ${dragging ? ' cursor-ew-resize! select-none! [&_*]:cursor-ew-resize! [&_*]:select-none!' : ''}`}
    >
      <aside
        id={sidebarId}
        className={`shrink-0 min-w-0 overflow-auto bg-sidebar ${compact ? 'rounded-0' : 'workspace-frame'}`}
        hidden={!expanded}
        style={{ width }}
        aria-label={sidebarLabel}
      >
        {sidebar}
      </aside>
      <div
        ref={separatorRef}
        className={`layout-focus relative z-1 ${readOnly ? 'cursor-default' : 'cursor-ew-resize touch-none'} transition-colors duration-100 ease-out motion-reduce:transition-none [&.hover]:bg-accent [&.active]:bg-accent [&.hover]:after:opacity-0 [&.active]:after:opacity-0 focus-visible:bg-accent focus-visible:after:opacity-0 ${compact ? `flex-[0_0_1px] rounded-0 bg-divider before:content-[''] before:absolute before:inset-y-0 before:left-1/2 before:translate-x-[-50%] before:w-4px before:transition-colors before:duration-100 motion-reduce:before:transition-none [&.hover]:before:bg-accent [&.active]:before:bg-accent [&:focus-visible:not([aria-disabled=true])]:before:bg-accent ${expanded ? '' : 'basis-0! bg-transparent!'}` : 'flex-[0_0_var(--layout-gap)] rounded-ui bg-transparent'} ${upper > 0 && !compact ? `after:content-[''] after:absolute after:pointer-events-none after:top-1/2 after:left-1/2 after:translate-x-[-50%] after:translate-y-[-50%] after:w-2px after:h-2px after:rounded-full after:bg-handle after:text-handle after:[box-shadow:0_-5px_currentColor,0_5px_currentColor]` : ''} ${upper > 0 && hovered ? 'hover' : ''} ${upper > 0 && dragging ? 'active' : ''}`}
        role="separator"
        tabIndex={readOnly ? -1 : 0}
        aria-label={`调整${sidebarLabel}宽度`}
        aria-orientation="vertical"
        aria-controls={sidebarId}
        aria-valuemin={0}
        aria-valuemax={Math.round(upper)}
        aria-valuenow={expanded ? Math.round(width) : 0}
        aria-valuetext={expanded ? `${Math.round(width)} 像素` : '侧边栏已隐藏'}
        aria-disabled={readOnly || upper === 0}
        title={
          readOnly
            ? '加载中，布局暂不可调整'
            : '拖拽调整宽度，向左拖到底收起，向右拖动展开；双击恢复默认，Enter 切换侧栏'
        }
        onPointerEnter={(event) => {
          if (readOnly || event.pointerType === 'touch' || upper === 0) return;
          clearHover();
          if (dragRef.current) {
            setHovered(true);
            return;
          }
          scheduleHover(event.currentTarget);
        }}
        onPointerLeave={clearHover}
        onPointerDown={(event) => {
          if (readOnly || event.button !== 0 || !event.isPrimary || upper === 0) return;
          clearHover();
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          dragRef.current = {
            x: event.clientX,
            width,
            visible: expanded,
            pointerId: event.pointerId,
          };
          setDragging(true);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          if (drag?.pointerId !== event.pointerId) return;
          updateDrag(event.clientX);
        }}
        onPointerUp={(event) => {
          if (dragRef.current?.pointerId !== event.pointerId) return;
          updateDrag(event.clientX);
          endDrag();
        }}
        onPointerCancel={(event) => {
          if (dragRef.current?.pointerId !== event.pointerId) return;
          clearHover();
          endDrag();
        }}
        onLostPointerCapture={(event) => {
          if (dragRef.current?.pointerId === event.pointerId) endDrag();
        }}
        onDoubleClick={() => {
          if (readOnly) return;
          endDrag();
          if (upper > 0)
            setLayout({ width: Math.max(lower, Math.min(upper, defaultWidth)), visible: true });
        }}
        onKeyDown={(event) => {
          if (readOnly || upper === 0) return;
          if (event.key === 'Enter') {
            event.preventDefault();
            endDrag();
            setLayout((previous) => ({ ...previous, visible: !previous.visible }));
            return;
          }
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          endDrag();
          if (!expanded) {
            event.preventDefault();
            if (event.key === 'ArrowRight' || event.key === 'End') {
              setLayout({ width: event.key === 'End' ? upper : width, visible: true });
            }
            return;
          }
          event.preventDefault();
          resize(
            event.key === 'Home'
              ? lower
              : event.key === 'End'
                ? upper
                : width + (event.key === 'ArrowLeft' ? -10 : 10),
          );
        }}
      />
      <section
        className={`flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden ${integratedHeader ? (compact ? 'bg-surface rounded-0' : 'workspace-panel') : `gap-layout ${compact ? 'bg-surface rounded-0' : 'bg-canvas'}`}`}
        aria-label="页面内容"
      >
        <div
          className={`workspace-collection-titlebar ${
            integratedHeader
              ? `workspace-titlebar-layout ${compact ? '' : 'workspace-titlebar-frame-edge'}`
              : compact
                ? 'workspace-titlebar'
                : 'workspace-titlebar-detached'
          }`}
        >
          <div className="workspace-title-identity shrink! flex-[0_1_220px]!">
            <Button
              ref={toggleRef}
              type="text"
              htmlType="button"
              onClick={toggle}
              disabled={readOnly || upper === 0}
              aria-controls={sidebarId}
              aria-expanded={expanded}
              aria-label={expanded ? '收起侧边栏' : '展开侧边栏'}
              title={upper === 0 ? '当前空间不足以展开侧边栏' : '切换侧边栏（Ctrl / ⌘ B）'}
              icon={
                <span
                  className={`w-18px h-18px ${expanded ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'}`}
                  aria-hidden="true"
                />
              }
            />
            {title && (
              <h2 className="workspace-page__title min-w-0 max-w-200px">
                <Typography.Text
                  className="block! text-inherit! text-14px! font-600! leading-22px!"
                  ellipsis={{ tooltip: title }}
                >
                  {title}
                </Typography.Text>
              </h2>
            )}
          </div>
          {toolbar}
        </div>
        <div
          className={`layout-scroll ${compact || integratedHeader ? '' : 'rounded-ui bg-surface'}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
