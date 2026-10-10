import { useEffect, useRef, useState, type ReactNode, type UIEvent } from 'react';

export function OverlayHorizontalScroll({
  children,
  className = '',
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  const viewportRef = useRef<HTMLElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ content: 0, viewport: 0 });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const content = viewport.scrollWidth;
      const width = viewport.clientWidth;
      setSize((previous) =>
        previous.content === content && previous.viewport === width
          ? previous
          : { content, viewport: width },
      );
      if (scrollbarRef.current) scrollbarRef.current.scrollLeft = viewport.scrollLeft;
    });
    observer.observe(viewport);
    // 列数、模块尺寸和容器尺寸变化时，都重新计算滚动范围。
    if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild);
      for (const child of viewport.firstElementChild.children) observer.observe(child);
    }
    return () => observer.disconnect();
  }, [children]);

  function syncScroll(event: UIEvent<HTMLElement>) {
    const other =
      event.currentTarget === viewportRef.current ? scrollbarRef.current : viewportRef.current;
    if (other && other.scrollLeft !== event.currentTarget.scrollLeft)
      other.scrollLeft = event.currentTarget.scrollLeft;
  }

  return (
    <div className="group relative flex flex-1 min-w-0">
      <section
        ref={viewportRef}
        aria-label={label}
        onScroll={syncScroll}
        className={`flex flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </section>
      <div
        ref={scrollbarRef}
        role="region"
        aria-label={`${label}横向滚动条`}
        tabIndex={0}
        hidden={size.content <= size.viewport}
        onScroll={syncScroll}
        className="tree-scrollbar layout-focus absolute inset-x-0 bottom-0 z-1 h-12px overflow-x-auto overflow-y-hidden opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-opacity duration-150 motion-reduce:transition-none [scrollbar-gutter:auto]! [scrollbar-color:var(--color-border)_transparent]! [&::-webkit-scrollbar-thumb]:bg-border!"
      >
        <div className="h-1px" style={{ width: size.content }} />
      </div>
    </div>
  );
}
