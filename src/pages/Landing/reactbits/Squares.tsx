/**
 * 移植自 React Bits「Squares」背景：画布绘制持续平移的方格，并高亮指针所在格。
 * 监听挂载在父元素上，避免前景内容遮挡后丢失悬停；四周用擦除渐隐，适配任意背景；减弱动效偏好下只静态绘制。
 */
import { useEffect, useRef } from 'react';

interface SquaresProps {
  speed?: number;
  squareSize?: number;
  borderColor: string;
  hoverFillColor: string;
  className?: string;
}

export function Squares({
  speed = 0.35,
  squareSize = 44,
  borderColor,
  hoverFillColor,
  className,
}: SquaresProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offset = { x: 0, y: 0 };
    let hovered: { x: number; y: number } | null = null;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const startX = Math.floor(offset.x / squareSize) * squareSize;
      const startY = Math.floor(offset.y / squareSize) * squareSize;
      ctx.lineWidth = 1;
      ctx.strokeStyle = borderColor;
      for (let x = startX; x < width + squareSize; x += squareSize) {
        for (let y = startY; y < height + squareSize; y += squareSize) {
          const squareX = x - (offset.x % squareSize);
          const squareY = y - (offset.y % squareSize);
          if (
            hovered &&
            Math.floor((x - startX) / squareSize) === hovered.x &&
            Math.floor((y - startY) / squareSize) === hovered.y
          ) {
            ctx.fillStyle = hoverFillColor;
            ctx.fillRect(squareX, squareY, squareSize, squareSize);
          }
          ctx.strokeRect(squareX + 0.5, squareY + 0.5, squareSize, squareSize);
        }
      }
      const radius = Math.sqrt(width * width + height * height) / 2;
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = () => {
      offset.x = (offset.x - speed + squareSize) % squareSize;
      offset.y = (offset.y - speed + squareSize) % squareSize;
      draw();
      frame = requestAnimationFrame(tick);
    };

    const handleMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const startX = Math.floor(offset.x / squareSize) * squareSize;
      const startY = Math.floor(offset.y / squareSize) * squareSize;
      hovered = {
        x: Math.floor((event.clientX - rect.left + offset.x - startX) / squareSize),
        y: Math.floor((event.clientY - rect.top + offset.y - startY) / squareSize),
      };
      if (reduceMotion) draw();
    };
    const handleLeave = () => {
      hovered = null;
      if (reduceMotion) draw();
    };

    const observer = new ResizeObserver(() => {
      resize();
      draw();
    });
    observer.observe(canvas);
    host.addEventListener('mousemove', handleMove);
    host.addEventListener('mouseleave', handleLeave);
    resize();
    if (reduceMotion) draw();
    else frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener('mousemove', handleMove);
      host.removeEventListener('mouseleave', handleLeave);
    };
  }, [speed, squareSize, borderColor, hoverFillColor]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
