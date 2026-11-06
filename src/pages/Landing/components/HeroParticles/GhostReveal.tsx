/** 闲置光斑与最后一次鼠标位置平滑交接，按原轨迹显现局部网格。 */
import { useEffect, useRef, type RefObject, type CSSProperties } from 'react';
import { DOT, smootherstep, type PointerPosition } from './model';
import { ghostMask } from './masks';
export default function GhostReveal({
  active,
  start,
  color,
}: {
  active: boolean;
  start: RefObject<PointerPosition | null>;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const grid = useRef({ width: 0, originX: 0, originY: 0 });

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return undefined;
    const layout = () => {
      const cell = DOT.size + DOT.gap;
      const width = host.clientWidth;
      const height = host.clientHeight;
      const cols = Math.max(1, Math.floor((width + DOT.gap) / cell));
      const rows = Math.max(1, Math.floor((height + DOT.gap) / cell));
      const startX = (width - (cols * cell - DOT.gap)) / 2 + DOT.size / 2;
      const startY = (height - (rows * cell - DOT.gap)) / 2 + DOT.size / 2;
      grid.current = { width, originX: startX - cell / 2, originY: startY - cell / 2 };
    };
    const observer = new ResizeObserver(layout);
    observer.observe(host);
    layout();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = ref.current;
    const host = node?.parentElement;
    const spot = spotRef.current;
    const dots = dotsRef.current;
    if (!node || !host || !spot || !dots || !active) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const cell = DOT.size + DOT.gap;
    const wrap = (value: number) => ((value % cell) + cell) % cell;
    const bounds = host.getBoundingClientRect();
    const band = 400;
    const from =
      start.current && start.current.y - bounds.top < band + DOT.radius * 0.5
        ? { x: start.current.x - bounds.left, y: start.current.y - bounds.top }
        : null;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = (now - began) / 1000;
      const { width, originX, originY } = grid.current;
      const x =
        width * 0.58 +
        width * 0.36 * (0.62 * Math.sin(t * 0.16 + 0.4) + 0.38 * Math.sin(t * 0.07 + 2.2));
      const y =
        band * 0.52 +
        band * 0.3 * (0.6 * Math.sin(t * 0.12 + 1.1) + 0.4 * Math.sin(t * 0.05 + 0.3));
      const blend = from ? smootherstep(t / 3.2) : 1;
      const left = (from ? from.x + (x - from.x) * blend : x) - DOT.radius;
      const top = (from ? from.y + (y - from.y) * blend : y) - DOT.radius;
      spot.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      dots.style.transform = `translate3d(${(wrap(originX - left) - cell).toFixed(1)}px, ${(wrap(originY - top) - cell).toFixed(1)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, start]);

  return (
    <div
      ref={ref}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity ease-out motion-reduce:transition-none ${active ? 'opacity-[var(--ghost-strength)] duration-1600' : 'opacity-0 duration-700'}`}
      data-on={active ? '' : undefined}
      aria-hidden="true"
      style={
        {
          '--ghost-color': color,
          '--ghost-dot': `${DOT.size / 2 + 0.15}px`,
          '--ghost-radius': `${DOT.radius}px`,
          '--ghost-cell': `${DOT.size + DOT.gap}px`,
          '--ghost-strength': DOT.strength,
          '--ghost-mask': ghostMask,
        } as CSSProperties
      }
    >
      <div
        ref={spotRef}
        className="absolute left-0 top-0 h-[calc(var(--ghost-radius)*2)] w-[calc(var(--ghost-radius)*2)] overflow-hidden will-change-transform [mask-image:var(--ghost-mask)] [mask-repeat:no-repeat]"
      >
        <div
          ref={dotsRef}
          className="absolute left-0 top-0 h-[calc(var(--ghost-radius)*2+var(--ghost-cell)*2)] w-[calc(var(--ghost-radius)*2+var(--ghost-cell)*2)] will-change-transform [background-image:radial-gradient(circle,var(--ghost-color)_var(--ghost-dot),transparent_calc(var(--ghost-dot)+0.7px))] [background-size:var(--ghost-cell)_var(--ghost-cell)]"
        />
      </div>
    </div>
  );
}
