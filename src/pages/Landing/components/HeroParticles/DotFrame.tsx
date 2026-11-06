/** 超宽屏边缘静态网格，鼠标区域为可交互画布留空。 */
import { useEffect, useRef, type RefObject, type CSSProperties } from 'react';
import { DOT } from './model';
import { frameShape, frameFloor, frameHole } from './masks';
function useDotAlignment(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    if (!node || !host) return undefined;
    const layout = () => {
      const cell = DOT.size + DOT.gap;
      const width = host.clientWidth;
      const height = host.clientHeight;
      const cols = Math.max(1, Math.floor((width + DOT.gap) / cell));
      const rows = Math.max(1, Math.floor((height + DOT.gap) / cell));
      const startX = (width - (cols * cell - DOT.gap)) / 2 + DOT.size / 2;
      const startY = (height - (rows * cell - DOT.gap)) / 2 + DOT.size / 2;
      node.style.backgroundSize = `${cell}px ${cell}px`;
      node.style.backgroundPosition = `${startX - cell / 2}px ${startY - cell / 2}px`;
    };
    const observer = new ResizeObserver(layout);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  }, [ref]);
}

export default function DotFrame({ color, live }: { color: string; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useDotAlignment(ref);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const clear = () => {
      node.style.removeProperty('--hole-x');
      node.style.removeProperty('--hole-y');
    };
    if (!live) {
      clear();
      return undefined;
    }
    const move = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      node.style.setProperty('--hole-x', `${(event.clientX - bounds.left).toFixed(1)}px`);
      node.style.setProperty('--hole-y', `${(event.clientY - bounds.top).toFixed(1)}px`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      clear();
    };
  }, [live]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-0 hidden opacity-34 [background-image:radial-gradient(circle,var(--frame-color)_var(--frame-dot),transparent_calc(var(--frame-dot)+0.7px))] [@media(min-width:2160px)]:block [mask-image:var(--frame-hole),var(--frame-floor),var(--frame-shape)] [-webkit-mask-composite:source-in,source-in] [mask-composite:intersect,intersect]"
      aria-hidden="true"
      style={
        {
          '--frame-color': color,
          '--frame-dot': `${DOT.size / 2 + 0.15}px`,
          '--frame-hole': frameHole,
          '--frame-floor': frameFloor,
          '--frame-shape': frameShape,
        } as CSSProperties
      }
    />
  );
}
