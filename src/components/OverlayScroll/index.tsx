/** 覆盖式单轴滚动容器：原生内容区负责滚轮、触控和键盘，浮动滚动条双向同步且不占布局空间。 */
import { useEffect, useRef, useState, type ReactNode, type UIEvent } from 'react';
import { useRafState } from 'ahooks';
import { createScrollSync } from './scrollSync';

export function OverlayScroll({
  children,
  className = '',
  label,
  direction = 'horizontal',
}: {
  children: ReactNode;
  className?: string;
  label: string;
  /** 默认横向以沿用环境参数区行为；纵向内容自然撑高，由外层约束可视高度。 */
  direction?: 'horizontal' | 'vertical';
}) {
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [scrollSync] = useState(createScrollSync);
  const vertical = direction === 'vertical';
  const position = vertical ? 'scrollTop' : 'scrollLeft';
  // 多列 ResizeObserver 通知可能连续到达；每帧仅提交最后一次测量，卸载自动取消。
  const [size, setSize] = useRafState({ content: 0, viewport: 0 });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const measure = () => {
      const content = vertical ? viewport.scrollHeight : viewport.scrollWidth;
      const length = vertical ? viewport.clientHeight : viewport.clientWidth;
      setSize((previous) =>
        previous.content === content && previous.viewport === length
          ? previous
          : { content, viewport: length },
      );
      if (scrollbarRef.current) scrollSync.align(viewport, scrollbarRef.current, position);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    // 纵向观察自然高度包装层，异步内容、字体或展开操作改变高度时也能更新；横向保留多列尺寸观察。
    if (contentRef.current) {
      observer.observe(contentRef.current);
      for (const child of contentRef.current.children) {
        observer.observe(child);
        for (const item of child.children) observer.observe(item);
      }
    }
    measure();
    return () => observer.disconnect();
  }, [children, setSize, vertical, position, scrollSync]);

  function syncScroll(event: UIEvent<HTMLElement>) {
    const other =
      event.currentTarget === viewportRef.current ? scrollbarRef.current : viewportRef.current;
    if (other) scrollSync.synchronize(event.currentTarget, other, position);
  }

  return (
    <div
      className={`group/overlay-scroll relative flex flex-1 min-w-0 min-h-0 ${vertical ? 'h-full' : ''}`}
    >
      <section
        ref={viewportRef}
        aria-label={label}
        tabIndex={0}
        onScroll={syncScroll}
        className={`
          flex-1 min-w-0 min-h-0 layout-focus overscroll-contain [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
          ${vertical ? 'overflow-y-auto overflow-x-hidden' : 'flex overflow-x-auto'}
          ${className}
        `}
      >
        <div ref={contentRef} className={vertical ? 'flow-root min-w-0' : 'flex flex-1 min-w-0'}>
          {children}
        </div>
      </section>
      <div
        ref={scrollbarRef}
        role="region"
        aria-label={`${label}${vertical ? '纵向' : '横向'}滚动条`}
        tabIndex={0}
        hidden={size.content <= size.viewport}
        onScroll={syncScroll}
        className={`
          tree-scrollbar layout-focus absolute z-1 overscroll-contain opacity-0 pointer-events-none
          group-hover/overlay-scroll:opacity-100 group-hover/overlay-scroll:pointer-events-auto
          group-focus-within/overlay-scroll:opacity-100
          group-focus-within/overlay-scroll:pointer-events-auto transition-opacity duration-150
          [scrollbar-gutter:auto]!
          [scrollbar-color:var(--color-border)_transparent]! [&::-webkit-scrollbar-thumb]:bg-border!
          ${vertical ? 'inset-y-0 right-0 w-12px overflow-y-auto overflow-x-hidden' : 'inset-x-0 bottom-0 h-12px overflow-x-auto overflow-y-hidden'}
        `}
      >
        <div
          className={vertical ? 'w-1px' : 'h-1px'}
          style={vertical ? { height: size.content } : { width: size.content }}
        />
      </div>
    </div>
  );
}
