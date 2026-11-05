/**
 * 独立 CPU 点阵流体：粗网格速度场的半拉格朗日平流、扩散与衰减，鼠标移动注入动量。
 * 不使用或还原付费 FluidDotField；Canvas 不可用时保留 CSS 静态点阵。
 * 约 30fps、有限网格与 DPR；离屏/后台/手动暂停停止帧循环，卸载释放全部资源。
 */
import { useEffect, useRef } from 'react';

export default function FluidDots({ paused, dark }: { paused: boolean; dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ paused, dark });
  const wakeRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    settings.current = { paused, dark };
    wakeRef.current?.();
  }, [paused, dark]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>('[data-hero]');
    if (!canvas || !hero) return;
    let context: CanvasRenderingContext2D | null;
    try {
      context = canvas.getContext('2d');
    } catch {
      return;
    }
    if (!context) return;
    canvas.style.backgroundColor = 'var(--landing-canvas)';
    const cell = 28;
    let width = 0,
      height = 0,
      cols = 0,
      rows = 0;
    let vx = new Float32Array(0),
      vy = new Float32Array(0),
      ink = new Float32Array(0);
    let nextX = new Float32Array(0),
      nextY = new Float32Array(0),
      nextInk = new Float32Array(0);
    let frame = 0,
      last = 0,
      time = 0,
      visible = true,
      alive = true,
      slowFrames = 0,
      degraded = false;
    const pointer = { x: -1000, y: -1000, dx: 0, dy: 0 };
    const sample = (field: Float32Array, x: number, y: number) => {
      x = Math.max(0, Math.min(cols - 1.001, x));
      y = Math.max(0, Math.min(rows - 1.001, y));
      const left = Math.floor(x),
        top = Math.floor(y),
        fx = x - left,
        fy = y - top;
      return (
        field[top * cols + left] * (1 - fx) * (1 - fy) +
        field[top * cols + left + 1] * fx * (1 - fy) +
        field[(top + 1) * cols + left] * (1 - fx) * fy +
        field[(top + 1) * cols + left + 1] * fx * fy
      );
    };
    const paint = () => {
      context.clearRect(0, 0, width, height);
      const dark = settings.current.dark;
      for (let y = 10; y < height; y += 14)
        for (let x = 10; x < width; x += 14) {
          const gx = x / cell,
            gy = y / cell;
          const density = Math.min(1, sample(ink, gx, gy));
          // 左侧保持稀薄，文字另有稳定表面遮罩；流体只在点阵上着色。
          const fade = 0.18 + 0.82 * Math.min(1, x / Math.max(1, width * 0.6));
          context.fillStyle =
            density > 0.12
              ? `rgba(${dark ? '176,137,226' : '126,89,182'},${(0.12 + density * (dark ? 0.46 : 0.48)) * fade})`
              : dark
                ? 'rgba(210,200,225,0.13)'
                : 'rgba(90,78,110,0.13)';
          context.beginPath();
          context.arc(
            x + sample(vx, gx, gy) * 0.8,
            y + sample(vy, gx, gy) * 0.8,
            0.85 + density * 1.5,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!alive || !visible || document.hidden || settings.current.paused || degraded) return;
      if (now - last < 32) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.06, (now - last) / 1000 || 0.033);
      last = now;
      time += dt;
      const started = performance.now();
      const centerX = cols * (0.7 + 0.12 * Math.sin(time * 0.14));
      const centerY = rows * (0.55 + 0.22 * Math.cos(time * 0.18));
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x;
          const dx = x - centerX,
            dy = y - centerY;
          const vortex = Math.exp(-(dx * dx + dy * dy) / 100);
          const px = x * cell - pointer.x,
            py = y * cell - pointer.y;
          const influence = Math.exp(-(px * px + py * py) / 10000);
          const backX = x - vx[i] * dt * 0.8,
            backY = y - vy[i] * dt * 0.8;
          nextX[i] =
            (sample(vx, backX, backY) * 0.97 -
              dy * vortex * dt * 0.25 +
              pointer.dx * influence * 0.018) *
            0.98;
          nextY[i] =
            (sample(vy, backX, backY) * 0.97 +
              dx * vortex * dt * 0.25 +
              pointer.dy * influence * 0.018) *
            0.98;
          const source = Math.exp(-((dx * dx) / 55 + (dy * dy) / 16));
          nextInk[i] = Math.min(
            1,
            sample(ink, backX, backY) * 0.988 +
              source * dt * 0.45 +
              influence * Math.min(0.12, Math.hypot(pointer.dx, pointer.dy) * 0.002),
          );
        }
      [vx, nextX] = [nextX, vx];
      [vy, nextY] = [nextY, vy];
      [ink, nextInk] = [nextInk, ink];
      pointer.dx *= 0.65;
      pointer.dy *= 0.65;
      paint();
      slowFrames = performance.now() - started > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
      if (slowFrames > 12) {
        degraded = true;
        canvas.dataset.rendering = 'static';
        return;
      }
      canvas.dataset.rendering = 'fluid';
      frame = requestAnimationFrame(tick);
    };
    const wake = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      paint();
      canvas.dataset.rendering = settings.current.paused ? 'paused' : degraded ? 'static' : 'fluid';
      if (alive && visible && !document.hidden && !settings.current.paused && !degraded) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    wakeRef.current = wake;
    const resize = () => {
      width = hero.clientWidth;
      height = hero.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / cell) + 2;
      rows = Math.ceil(height / cell) + 2;
      vx = new Float32Array(cols * rows);
      vy = new Float32Array(cols * rows);
      ink = new Float32Array(cols * rows);
      nextX = new Float32Array(cols * rows);
      nextY = new Float32Array(cols * rows);
      nextInk = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++)
          ink[y * cols + x] =
            Math.exp(-((x - cols * 0.75) ** 2 / 55 + (y - rows * 0.6) ** 2 / 18)) * 0.7;
      wake();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || settings.current.paused) return;
      const rect = hero.getBoundingClientRect(),
        x = event.clientX - rect.left,
        y = event.clientY - rect.top;
      pointer.dx = Math.max(-55, Math.min(55, x - pointer.x));
      pointer.dy = Math.max(-55, Math.min(55, y - pointer.y));
      pointer.x = x;
      pointer.y = y;
    };
    const leave = () => {
      pointer.x = -1000;
      pointer.y = -1000;
    };
    const sizeObserver = new ResizeObserver(resize);
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      wake();
    });
    sizeObserver.observe(hero);
    observer.observe(hero);
    hero.addEventListener('pointermove', move, { passive: true });
    hero.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', wake);
    resize();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      observer.disconnect();
      hero.removeEventListener('pointermove', move);
      hero.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', wake);
      wakeRef.current = null;
    };
  }, []);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden [background-image:radial-gradient(var(--landing-border)_1px,transparent_1px)] [background-size:14px_14px]"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
