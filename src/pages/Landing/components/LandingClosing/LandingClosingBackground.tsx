import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { theme } from 'antd';
import { useReducedMotion } from 'motion/react';
import { useLandingTheme } from '../../hooks/useLandingTheme';

const GradientWaves = lazy(() => import('./components/GradientWaves'));
const mask = `linear-gradient(
    to bottom,
    transparent 0,
    transparent 22%,
    rgb(0 0 0 / 0.009) 27.6%,
    rgb(0 0 0 / 0.058) 33.2%,
    rgb(0 0 0 / 0.163) 38.8%,
    rgb(0 0 0 / 0.317) 44.4%,
    rgb(0 0 0 / 0.5) 50%,
    rgb(0 0 0 / 0.683) 55.6%,
    rgb(0 0 0 / 0.837) 61.2%,
    rgb(0 0 0 / 0.942) 66.8%,
    rgb(0 0 0 / 0.991) 72.4%,
    #000 78%
  )`;

/** 在行动区接近视口时加载波浪，尊重减少动态效果的偏好。 */
export default function LandingClosingBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  const reducedMotion = useReducedMotion();
  const { theme: mode } = useLandingTheme();
  const { token } = theme.useToken();

  useEffect(() => {
    const root = rootRef.current;
    if (!root || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [near]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-1 overflow-hidden"
      style={{ maskImage: mask, WebkitMaskImage: mask, opacity: mode === 'light' ? 0.88 : 1 }}
    >
      {near && !reducedMotion && (
        <Suspense fallback={null}>
          <GradientWaves
            horizonColor={token.colorPrimary}
            waveColor={token.colorPrimaryBorder}
            crestColor={token.colorPrimaryBgHover}
            lightMode={mode === 'light'}
            tilt={58}
            dpr={1.25}
            style={{ transform: 'scaleX(1.18)' }}
          />
        </Suspense>
      )}
    </div>
  );
}
