/** 首屏独立背景组件：按原有闲置与鼠标交互状态组合三个渲染层。 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import DotFrame from './DotFrame';
import { useParticleVisibility } from './useParticleVisibility';
import GhostReveal from './GhostReveal';
import { DOT, IDLE_MS, dotTint, type PointerPosition } from './model';
const DotGrid = lazy(() => import('../DotGrid'));
export default function HeroParticles({
  light,
  waveColor,
  baseColor,
}: {
  light: boolean;
  waveColor: string;
  baseColor: string;
}) {
  const { ref, visible } = useParticleVisibility();
  const [hover] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const [idle, setIdle] = useState(true);
  const idleRef = useRef(true);
  const pointerRef = useRef<PointerPosition | null>(null);
  useEffect(() => {
    let timer = 0;
    const rest = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        idleRef.current = true;
        setIdle(true);
      }, IDLE_MS);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointerRef.current = { x: event.clientX, y: event.clientY };
      if (idleRef.current) {
        idleRef.current = false;
        setIdle(false);
      }
      rest();
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
      {hover && (
        <div
          className={`pointer-events-none absolute inset-0 z-0 ${light ? '[mask-image:var(--hero-fade)]' : ''}`}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <DotGrid
              paused={!visible}
              dpr={Math.min(window.devicePixelRatio || 1, 1.5)}
              dotSize={DOT.size}
              gap={DOT.gap}
              baseColor={baseColor}
              activeColor={dotTint(waveColor, baseColor, light)}
              proximity={DOT.radius}
              strength={1.15}
              bounce={0.7}
              tension={0.35}
              swell={1.4}
              stretch={0.5}
              glow={0.15}
              opacity={0.55}
              shockRadius={380}
              shockStrength={4}
              intro={false}
              mouseInteraction={!idle}
            />
          </Suspense>
        </div>
      )}
      <DotFrame color={dotTint(waveColor, baseColor, light)} live={!idle} />
      <GhostReveal
        active={idle && visible}
        start={pointerRef}
        color={dotTint(waveColor, baseColor, light)}
      />
    </div>
  );
}
