import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from 'antd';
import { dragResize } from './dragResize';
import type { DragResizeState } from './dragResize';
import { useLayoutPreferences } from '../../features/preferences/useLayoutPreferences';

export interface SplitPaneProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarLabel?: string;
  title?: string;
  titleExtra?: ReactNode;
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
  titleExtra,
  integratedHeader = false,
  readOnly = false,
  defaultWidth = 340,
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
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) clearTimeout(hoverTimerRef.current);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  function clearHover() {
    if (hoverTimerRef.current !== null) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
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
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!storageKey || dragging || readOnly) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(layout));
    } catch {
      /* 禁用存储时仍可使用面板。 */
    }
  }, [layout, dragging, storageKey, readOnly]);

  useEffect(() => {
    if (readOnly) return;
    const container = containerRef.current;
    if (!container) return;
    const ownerDocument = container.ownerDocument;
    function onKeyDown(event: KeyboardEvent) {
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
    }
    ownerDocument.addEventListener('keydown', onKeyDown);
    return () => ownerDocument.removeEventListener('keydown', onKeyDown);
  }, [upper, endDrag, readOnly]);

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
        className={`layout-focus relative z-1 ${readOnly ? 'cursor-default' : 'cursor-ew-resize touch-none'} transition-colors duration-100 ease-out motion-reduce:transition-none [&.hover]:bg-accent [&.active]:bg-accent [&.hover]:after:opacity-0 [&.active]:after:opacity-0 focus-visible:bg-accent focus-visible:after:opacity-0 ${compact ? 'compact-split-divider' : 'flex-[0_0_var(--layout-gap)] rounded-sm bg-transparent'} ${upper > 0 && !compact ? 'split-grip' : ''} ${upper > 0 && hovered ? 'hover' : ''} ${upper > 0 && dragging ? 'active' : ''}`}
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
          const separator = event.currentTarget;
          hoverTimerRef.current = setTimeout(() => {
            hoverTimerRef.current = null;
            if (separator.isConnected && separator.getAttribute('aria-disabled') !== 'true') {
              setHovered(true);
            }
          }, 300);
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
          className={
            integratedHeader
              ? 'workspace-titlebar-layout'
              : compact
                ? 'workspace-titlebar'
                : 'workspace-titlebar-detached'
          }
        >
          <div className="workspace-title-identity">
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
              <h2 className="workspace-page__title min-w-0 max-w-200px truncate" title={title}>
                {title}
              </h2>
            )}
          </div>
          {titleExtra}
        </div>
        <div
          className={`layout-scroll ${compact || integratedHeader ? '' : 'rounded-8px bg-surface'}`}
        >
          {children}
        </div>
      </section>
    </div>
  );
}
