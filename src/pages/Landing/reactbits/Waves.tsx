/**
 * 移植自 React Bits「Waves」背景：Perlin 噪声驱动的竖向线条随时间起伏，并被指针扰动。
 * 监听挂载在父元素上，前景内容不会挡住交互；离开视口暂停绘制，减弱动效偏好下只绘制一帧静态。
 */
import { useEffect, useRef } from 'react';

interface WavesProps {
  lineColor: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: { x: number; y: number; vx: number; vy: number };
}

const GRADIENTS: Array<[number, number]> = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [1, 0], [-1, 0],
  [0, 1], [0, -1], [0, 1], [0, -1],
];

function createNoise(seed: number) {
  const source = Array.from({ length: 256 }, (_, index) => index);
  let state = seed;
  for (let index = 255; index > 0; index -= 1) {
    state = (state * 16807) % 2147483647;
    const swap = state % (index + 1);
    [source[index], source[swap]] = [source[swap], source[index]];
  }
  const perm = new Array<number>(512);
  const grad = new Array<[number, number]>(512);
  for (let index = 0; index < 512; index += 1) {
    perm[index] = source[index & 255];
    grad[index] = GRADIENTS[perm[index] % 12];
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;
  const dot = (g: [number, number], x: number, y: number) => g[0] * x + g[1] * y;

  return (inputX: number, inputY: number) => {
    let cellX = Math.floor(inputX);
    let cellY = Math.floor(inputY);
    const x = inputX - cellX;
    const y = inputY - cellY;
    cellX &= 255;
    cellY &= 255;
    const n00 = dot(grad[cellX + perm[cellY]], x, y);
    const n01 = dot(grad[cellX + perm[cellY + 1]], x, y - 1);
    const n10 = dot(grad[cellX + 1 + perm[cellY]], x - 1, y);
    const n11 = dot(grad[cellX + 1 + perm[cellY + 1]], x - 1, y - 1);
    const u = fade(x);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
  };
}

export function Waves({
  lineColor,
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 12,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  className,
}: WavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noise = createNoise(42);
    const mouse = { x: -9999, y: -9999, lx: 0, ly: 0, sx: 0, sy: 0, vs: 0, a: 0, set: false };
    let lines: Point[][] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const totalLines = Math.ceil((width + 200) / xGap);
      const totalPoints = Math.ceil((height + 30) / yGap);
      const xStart = (width - xGap * totalLines) / 2;
      const yStart = (height - yGap * totalPoints) / 2;
      lines = Array.from({ length: totalLines + 1 }, (_, i) =>
        Array.from({ length: totalPoints + 1 }, (_, j) => ({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        })),
      );
    };

    const movePoints = (time: number) => {
      for (const points of lines) {
        for (const point of points) {
          const move =
            noise((point.x + time * waveSpeedX) * 0.002, (point.y + time * waveSpeedY) * 0.0015) * 12;
          point.wave.x = Math.cos(move) * waveAmpX;
          point.wave.y = Math.sin(move) * waveAmpY;

          const dx = point.x - mouse.sx;
          const dy = point.y - mouse.sy;
          const distance = Math.hypot(dx, dy);
          const radius = Math.max(175, mouse.vs);
          if (distance < radius) {
            const strength = 1 - distance / radius;
            const force = Math.cos(distance * 0.001) * strength;
            point.cursor.vx += Math.cos(mouse.a) * force * radius * mouse.vs * 0.00065;
            point.cursor.vy += Math.sin(mouse.a) * force * radius * mouse.vs * 0.00065;
          }
          point.cursor.vx += -point.cursor.x * tension;
          point.cursor.vy += -point.cursor.y * tension;
          point.cursor.vx *= friction;
          point.cursor.vy *= friction;
          point.cursor.x = Math.min(maxCursorMove, Math.max(-maxCursorMove, point.cursor.x + point.cursor.vx * 2));
          point.cursor.y = Math.min(maxCursorMove, Math.max(-maxCursorMove, point.cursor.y + point.cursor.vy * 2));
        }
      }
    };

    const position = (point: Point, withCursor: boolean) => ({
      x: point.x + point.wave.x + (withCursor ? point.cursor.x : 0),
      y: point.y + point.wave.y + (withCursor ? point.cursor.y : 0),
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      for (const points of lines) {
        const start = position(points[0], false);
        ctx.moveTo(start.x, start.y);
        points.forEach((point, index) => {
          const isLast = index === points.length - 1;
          const current = position(point, !isLast);
          ctx.lineTo(current.x, current.y);
        });
      }
      ctx.stroke();
    };

    const tick = (time: number) => {
      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;
      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      mouse.vs = Math.min(100, mouse.vs + (Math.hypot(dx, dy) - mouse.vs) * 0.1);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);
      movePoints(time);
      draw();
      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    const handleMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      if (!mouse.set) {
        mouse.sx = mouse.lx = mouse.x;
        mouse.sy = mouse.ly = mouse.y;
        mouse.set = true;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
      movePoints(performance.now());
      draw();
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame && !reduceMotion) frame = requestAnimationFrame(tick);
    });

    resize();
    resizeObserver.observe(host);
    if (reduceMotion) {
      movePoints(0);
      draw();
    } else {
      visibilityObserver.observe(host);
      host.addEventListener('pointermove', handleMove);
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener('pointermove', handleMove);
    };
  }, [lineColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, xGap, yGap, friction, tension, maxCursorMove]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
