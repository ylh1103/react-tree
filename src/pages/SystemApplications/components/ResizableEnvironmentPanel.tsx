/** 页面私有环境面板：保留名称的折叠窄条、悬停操作、指针捕获拖拽及键盘调宽；放大由工作区统一控制。 */
import { useId, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { Button, Tooltip } from 'antd';
import { useDebounceFn, useEventListener } from 'ahooks';
import type { DragResizeState } from '@/components/SplitPane/dragResize';
import { splitPaneSeparatorClassName } from '@/components/SplitPane/separatorStyle';
import {
  collapsedEnvironmentWidth,
  defaultEnvironmentWidth,
  maximumEnvironmentWidth,
  resizeEnvironmentPanel,
  type EnvironmentPanelLayout,
} from './environmentPanelLayout';

interface ResizableEnvironmentPanelProps {
  environment: { key: string; name: string };
  compact: boolean;
  maximized: boolean;
  hidden: boolean;
  onMaximize: () => void;
  /** 布局由应用工作区持有，取消勾选卸载面板后仍保留；指针等瞬时状态留在本组件。 */
  layout: EnvironmentPanelLayout;
  onLayoutChange: Dispatch<SetStateAction<EnvironmentPanelLayout>>;
  children: ReactNode;
}

/** 将动作名和按键分开呈现；键帽继承 Tooltip 文字颜色，兼容统一浮层的浅色与暗色主题。 */
function PanelShortcutHint({ label, actionKey }: { label: string; actionKey: '+' | '-' }) {
  return (
    <span className="flex items-center gap-3 whitespace-nowrap text-13px leading-24px">
      <span>{label}</span>
      <span className="flex items-center gap-1" aria-label={`Ctrl ${actionKey}`}>
        {['Ctrl', actionKey].map((key) => (
          <kbd
            key={key}
            className={`
              inline-flex h-24px min-w-24px items-center justify-center rounded-control border
              border-solid [border-color:color-mix(in_srgb,currentColor_30%,transparent)]
              bg-transparent px-1.5 font-mono text-12px font-400 leading-none
            `}
          >
            {key}
          </kbd>
        ))}
      </span>
    </span>
  );
}

export function ResizableEnvironmentPanel({
  environment,
  compact,
  maximized,
  hidden,
  onMaximize,
  layout,
  onLayoutChange: setLayout,
  children,
}: ResizableEnvironmentPanelProps) {
  const contentId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragResizeState | null>(null);
  const separatorRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { run: scheduleHover, cancel: cancelHover } = useDebounceFn(() => setHovered(true), {
    wait: 300,
  });
  const collapsed = !maximized && layout.collapsed;
  const label = `${environment.key} 环境`;

  function clearHover() {
    cancelHover();
    setHovered(false);
  }

  function endDrag() {
    dragRef.current = null;
    setDragging(false);
    clearHover();
  }

  function toggleCollapsed() {
    endDrag();
    if (maximized) {
      onMaximize();
      setLayout((previous) => ({
        ...previous,
        restoreWidth: previous.collapsed ? previous.restoreWidth : previous.width,
        width: collapsedEnvironmentWidth,
        collapsed: true,
        fixed: true,
      }));
      return;
    }
    const width = panelRef.current?.getBoundingClientRect().width ?? layout.width;
    setLayout((previous) => ({
      width: previous.collapsed ? previous.restoreWidth : collapsedEnvironmentWidth,
      restoreWidth: previous.collapsed ? previous.restoreWidth : width,
      collapsed: !previous.collapsed,
      fixed: true,
    }));
  }

  /** 点击和快捷键统一聚焦稳定容器，提示重建后仍可连续操作，避免按钮聚焦重新打开提示。 */
  function activatePanelAction(action: 'collapse' | 'maximize') {
    panelRef.current?.focus({ preventScroll: true });
    if (action === 'collapse') toggleCollapsed();
    else onMaximize();
  }

  function resizeTo(nextWidth: number) {
    const width = Math.max(collapsedEnvironmentWidth, Math.min(maximumEnvironmentWidth, nextWidth));
    setLayout((previous) => ({
      width,
      restoreWidth: width === collapsedEnvironmentWidth ? previous.restoreWidth : width,
      collapsed: width === collapsedEnvironmentWidth,
      fixed: true,
    }));
  }

  function updateDrag(drag: DragResizeState, x: number) {
    const next = resizeEnvironmentPanel(drag, x);
    setLayout({
      ...next,
      // 连续缩窄到 48px 时保留手势开始前的展开宽度，按钮展开仍能回到原来的尺寸。
      restoreWidth: next.collapsed ? drag.width : next.width,
      fixed: true,
    });
  }

  // 快捷键只作用于聚焦的环境（包括分割线），没有聚焦环境时使用悬停环境；避免多个面板响应或影响输入框。
  useEventListener(
    'keydown',
    (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !event.ctrlKey ||
        event.altKey ||
        event.metaKey
      )
        return;
      const action =
        event.key === '-' ? 'collapse' : ['+', '='].includes(event.key) ? 'maximize' : null;
      if (!action) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'input, textarea, select, [role="textbox"], [role="dialog"], [role="alertdialog"], dialog',
          ))
      )
        return;
      const panel = panelRef.current;
      if (!panel) return;
      const focused =
        target instanceof Element
          ? target.closest('[data-environment-panel], [data-environment-separator]')
          : null;
      const active = focused ?? panel.ownerDocument.querySelector('[data-environment-panel]:hover');
      if (!active || (active !== panel && active !== separatorRef.current)) return;
      event.preventDefault();
      activatePanelAction(action);
    },
    { target: () => panelRef.current?.ownerDocument, enable: !hidden },
  );

  return (
    <>
      <div
        ref={panelRef}
        tabIndex={-1}
        hidden={hidden}
        data-environment-panel={environment.key}
        data-collapsed={collapsed}
        data-maximized={maximized}
        // 紧凑布局的边界由后方 1px 拖拽线统一绘制，避免与面板右边框叠成双线。
        className={`
          group/environment relative min-w-0 shrink-0 overflow-hidden
          ${compact ? 'bg-surface' : 'workspace-panel'}
          ${hidden ? 'hidden' : ''}
          ${collapsed || maximized || layout.fixed ? '' : 'grow'}
          ${dragging ? 'select-none' : ''}
        `}
        style={{
          width: maximized ? '100%' : collapsed ? collapsedEnvironmentWidth : layout.width,
          // 放大只改变当前显示，原尺寸和其他列始终保留；退出后直接恢复。
          flexBasis: maximized ? '100%' : undefined,
        }}
        onKeyDown={(event) => {
          if (maximized && event.key === 'Escape') {
            event.preventDefault();
            onMaximize();
          }
        }}
      >
        <div
          // 模式切换会移动按钮；同步销毁旧提示与延迟任务，避免浮层在原坐标淡出时显示新动作文字。
          key={`${collapsed}/${maximized}/${hidden}`}
          className={`
            absolute z-2 flex gap-0.5 rounded-control bg-surface opacity-0 pointer-events-none
            group-hover/environment:opacity-100 group-hover/environment:pointer-events-auto
            group-focus-within/environment:opacity-100
            group-focus-within/environment:pointer-events-auto [@media(hover:none)]:opacity-100
            [@media(hover:none)]:pointer-events-auto
            ${collapsed ? 'top-2 right-3 flex-col' : 'top-4 right-3'}
          `}
        >
          <Tooltip
            title={<PanelShortcutHint label={maximized ? '退出放大' : '放大'} actionKey="+" />}
            mouseEnterDelay={0.3}
            trigger={['hover', 'focus']}
          >
            <Button
              type="text"
              size="small"
              aria-label={`${maximized ? '退出放大' : '放大'} ${label}`}
              aria-pressed={maximized}
              aria-keyshortcuts="Control+Plus Control+="
              onClick={() => activatePanelAction('maximize')}
              icon={
                <span
                  className={`${maximized ? 'i-lucide-minimize' : 'i-lucide-maximize'} h-14px w-14px`}
                  aria-hidden="true"
                />
              }
            />
          </Tooltip>
          {!maximized && (
            <Tooltip
              title={<PanelShortcutHint label={collapsed ? '展开' : '折叠'} actionKey="-" />}
              mouseEnterDelay={0.3}
              trigger={['hover', 'focus']}
            >
              <Button
                type="text"
                size="small"
                aria-label={`${collapsed ? '展开' : '折叠'} ${label}`}
                aria-expanded={!collapsed}
                aria-keyshortcuts="Control+-"
                aria-controls={contentId}
                onClick={() => activatePanelAction('collapse')}
                icon={
                  <span
                    className={`${collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-left'} h-14px w-14px`}
                    aria-hidden="true"
                  />
                }
              />
            </Tooltip>
          )}
        </div>
        {collapsed && (
          <div
            className="flex h-full items-center flex-col gap-3 pt-20 pb-4 bg-surface"
            aria-label={`${label}已折叠`}
          >
            <span className="font-mono text-13px font-600 text-accent [writing-mode:vertical-rl]">
              {environment.key}
            </span>
            <span className="text-13px text-text-secondary [writing-mode:vertical-rl]">
              {environment.name}
            </span>
          </div>
        )}
        {/* 圆角与边框由实际调宽的外层持有；内部保留可读宽度并裁切，避免缩窄时把右侧外框一起裁掉。 */}
        <div
          id={contentId}
          hidden={collapsed}
          className={collapsed ? 'hidden' : 'h-full min-w-320px'}
        >
          {children}
        </div>
      </div>
      {!hidden && !maximized && (
        <div
          ref={separatorRef}
          data-environment-separator={environment.key}
          className={splitPaneSeparatorClassName({ compact, hovered, dragging })}
          role="separator"
          tabIndex={0}
          aria-label={`调整 ${label}宽度`}
          aria-orientation="vertical"
          aria-controls={contentId}
          aria-valuemin={collapsedEnvironmentWidth}
          aria-valuemax={maximumEnvironmentWidth}
          aria-valuenow={collapsed ? collapsedEnvironmentWidth : layout.width}
          aria-valuetext={collapsed ? '已折叠，仅显示环境名' : `${Math.round(layout.width)} 像素`}
          title="拖拽调整宽度，向左拖到底折叠，向右拖动展开；双击恢复默认；Ctrl+- 折叠 / 展开，Ctrl++ 放大 / 恢复"
          onPointerEnter={(event) => {
            if (event.pointerType !== 'touch') scheduleHover();
          }}
          onPointerLeave={clearHover}
          onPointerDown={(event) => {
            if (event.button !== 0 || !event.isPrimary) return;
            event.preventDefault();
            clearHover();
            event.currentTarget.focus();
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              x: event.clientX,
              width: collapsed
                ? layout.restoreWidth
                : (panelRef.current?.getBoundingClientRect().width ?? layout.width),
              visible: !collapsed,
              pointerId: event.pointerId,
            };
            setDragging(true);
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (drag?.pointerId === event.pointerId) updateDrag(drag, event.clientX);
          }}
          onPointerUp={(event) => {
            const drag = dragRef.current;
            if (drag?.pointerId !== event.pointerId) return;
            updateDrag(drag, event.clientX);
            endDrag();
          }}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onDoubleClick={() => {
            endDrag();
            setLayout({
              width: defaultEnvironmentWidth,
              restoreWidth: defaultEnvironmentWidth,
              collapsed: false,
              fixed: false,
            });
          }}
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            endDrag();
            if (event.key === 'Home') resizeTo(collapsedEnvironmentWidth);
            else if (event.key === 'End') resizeTo(maximumEnvironmentWidth);
            else
              resizeTo(
                (panelRef.current?.getBoundingClientRect().width ?? layout.width) +
                  (event.key === 'ArrowLeft' ? -10 : 10),
              );
          }}
        />
      )}
    </>
  );
}
