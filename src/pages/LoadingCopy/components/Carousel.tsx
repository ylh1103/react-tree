/** 用参考页捕获的弧面分片展示十张原图；拖动和键盘改变圆柱角度，离屏或减少动态效果时停止自动旋转。 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { carouselLabels, carouselTiles } from '../model/carousel';

export default function Carousel() {
  const host = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const drag = useRef<{ x: number; angle: number } | null>(null);
  const [index, setIndex] = useState(0);
  function paint() {
    if (ring.current) ring.current.style.transform = `rotateY(${angle.current}deg)`;
  }
  function announce() {
    setIndex(((Math.round(-angle.current / 36) % 10) + 10) % 10);
  }
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = false;
    let previous = 0;
    function animate(now: number) {
      frame = 0;
      if (!visible || document.hidden || motion.matches) {
        previous = 0;
        return;
      }
      if (previous && !drag.current && !element!.matches(':hover,:focus-within')) {
        angle.current -= Math.min(now - previous, 100) * 0.014;
        if (ring.current) ring.current.style.transform = `rotateY(${angle.current}deg)`;
      }
      previous = now;
      frame = requestAnimationFrame(animate);
    }
    function start() {
      if (!frame) frame = requestAnimationFrame(animate);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(element);
    document.addEventListener('visibilitychange', start);
    motion.addEventListener('change', start);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', start);
      motion.removeEventListener('change', start);
    };
  }, []);
  return (
    <div
      ref={host}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
      tabIndex={0}
      className="relative h-full touch-pan-y cursor-grab overflow-hidden [perspective:2500px] active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent"
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, angle: angle.current };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (drag.current) {
          angle.current = drag.current.angle + (event.clientX - drag.current.x) * 0.35;
          paint();
        }
      }}
      onPointerUp={() => {
        drag.current = null;
        announce();
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          angle.current += event.key === 'ArrowLeft' ? 36 : -36;
          paint();
          announce();
        }
      }}
    >
      <span className="sr-only" aria-live="polite">
        {carouselLabels[index]}, {index + 1} of 10
      </span>
      <div className="absolute left-1/2 top-1/2 [transform-style:preserve-3d] [transform:translateZ(-250px)_rotateX(-5deg)]">
        <div ref={ring} className="absolute [transform-style:preserve-3d]">
          {carouselLabels.map((label, photoIndex) => (
            <div
              key={label}
              className="absolute [transform-style:preserve-3d]"
              style={{ transform: `rotateY(${photoIndex * 36}deg) translateZ(250px)` }}
            >
              {carouselTiles.map((tile, tileIndex) => (
                <div
                  key={tileIndex}
                  aria-hidden="true"
                  className="absolute [backface-visibility:hidden]"
                  style={tile.style as CSSProperties}
                >
                  <div
                    className="absolute inset-x-0 top-0 overflow-hidden"
                    style={tile.frame as CSSProperties}
                  >
                    <img
                      src={`/landing/carousel-${photoIndex}.jpg`}
                      alt=""
                      draggable={false}
                      loading="lazy"
                      className="absolute object-cover grayscale"
                      style={tile.image as CSSProperties}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
