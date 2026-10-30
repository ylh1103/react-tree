/** 工具栏两侧提示：仅在对应方向还有被裁切的内容时渐隐，随尺寸、环境列布局与横向滚动更新。 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { OverlayScroll } from '@/components/OverlayScroll';

export function ToolbarOverflowFade({
  children,
  showScrollbar = true,
}: {
  children: ReactNode;
  /** 底部状态栏隐藏滚动条，保持固定高度；仍保留原生横向滚动及键盘焦点滚入。 */
  showScrollbar?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState<{
    left: number | null;
    right: number | null;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const viewport = showScrollbar
      ? container?.querySelector('section')
      : container?.firstElementChild;
    const content = viewport?.firstElementChild;
    if (!(viewport instanceof HTMLElement) || !content) return;
    // 整个环境面板也可能被外层工作区裁切，不能只比较工具栏自己的 scrollWidth/clientWidth。
    const clippingParents: HTMLElement[] = [];
    for (let parent = viewport.parentElement; parent; parent = parent.parentElement) {
      if (/hidden|auto|scroll|clip/.test(getComputedStyle(parent).overflowX)) {
        clippingParents.push(parent);
      }
    }
    let frame: number | undefined;
    function measure() {
      if (!viewport) return;
      const bounds = viewport.getBoundingClientRect();
      let left = Math.max(0, bounds.left);
      let right = Math.min(document.documentElement.clientWidth, bounds.right);
      for (const parent of clippingParents) {
        const rect = parent.getBoundingClientRect();
        const edge = rect.left + parent.clientLeft;
        left = Math.max(left, edge);
        right = Math.min(right, edge + parent.clientWidth);
      }
      // 同时计入工具栏自身滚动与外层裁切；允许 1px 舍入误差，到达对应端点后移除遮罩。
      const overflowLeft = viewport.scrollLeft + left - bounds.left > 1;
      const overflowRight = viewport.scrollWidth - viewport.scrollLeft - (right - bounds.left) > 1;
      const next =
        right > left && (overflowLeft || overflowRight)
          ? {
              left: overflowLeft ? Math.max(0, left - bounds.left) : null,
              right: overflowRight ? Math.max(0, bounds.right - right) : null,
              width: Math.min(32, (right - left) / (overflowLeft && overflowRight ? 2 : 1)),
            }
          : null;
      setFade((previous) =>
        previous?.left === next?.left &&
        previous?.right === next?.right &&
        previous?.width === next?.width
          ? previous
          : next,
      );
    }
    // 多层 ResizeObserver 与捕获阶段的 scroll 通知合并到一帧；只重渲染渐隐容器。
    function scheduleMeasure() {
      if (frame !== undefined) return;
      frame = window.requestAnimationFrame(() => {
        frame = undefined;
        measure();
      });
    }
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(viewport);
    observer.observe(content);
    for (const parent of clippingParents) observer.observe(parent);
    // 相邻环境折叠或调宽时，本列可能只平移而不改变尺寸；必须监听整行环境列。
    const panelRow = viewport.closest('[data-environment-panel]')?.parentElement;
    let panels = new Set<Element>();
    function observePanels() {
      const next = new Set(panelRow?.children);
      for (const panel of panels) {
        if (!next.has(panel)) observer.unobserve(panel);
      }
      for (const panel of next) {
        if (!panels.has(panel)) observer.observe(panel);
      }
      panels = next;
      scheduleMeasure();
    }
    observePanels();
    // 勾选环境会增删同级列；只监听行的直接子节点，避免编辑器内部变化触发测量。
    const panelObserver = new MutationObserver(observePanels);
    if (panelRow) panelObserver.observe(panelRow, { childList: true });
    document.addEventListener('scroll', scheduleMeasure, { passive: true, capture: true });
    window.addEventListener('resize', scheduleMeasure);
    measure();
    return () => {
      observer.disconnect();
      panelObserver.disconnect();
      document.removeEventListener('scroll', scheduleMeasure, true);
      window.removeEventListener('resize', scheduleMeasure);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [showScrollbar]);

  return (
    <div ref={containerRef} className="relative min-w-0">
      {/* 顶栏复用覆盖式滚动条，不占底部内边距，调宽时也不会改变高度。 */}
      {showScrollbar ? (
        <OverlayScroll label="参数工具栏">{children}</OverlayScroll>
      ) : (
        <div className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </div>
      )}
      {fade &&
        (['left', 'right'] as const).map(
          (side) =>
            fade[side] !== null && (
              <div
                key={side}
                aria-hidden="true"
                data-toolbar-overflow-fade={side}
                // 两侧均定位到实际可见的裁切边缘，而非可能已滚到工作区外的面板边缘。
                style={{ [side]: fade[side], width: fade.width }}
                // 浅色工具栏使用半透明填充，须叠加其下的面板底色才能真正遮住内容；底栏底层保持透明。
                className={`pointer-events-none absolute inset-y-0 z-10 ${
                  side === 'left'
                    ? 'bg-[linear-gradient(to_left,transparent,var(--toolbar-background,var(--color-surface))),linear-gradient(to_left,transparent,var(--toolbar-fade-base,transparent))]'
                    : 'bg-[linear-gradient(to_right,transparent,var(--toolbar-background,var(--color-surface))),linear-gradient(to_right,transparent,var(--toolbar-fade-base,transparent))]'
                }`}
              />
            ),
        )}
    </div>
  );
}
