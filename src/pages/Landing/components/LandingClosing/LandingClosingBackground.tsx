import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { theme } from 'antd';
import { useLandingTheme } from '../../hooks/useLandingTheme';
import { withAlpha } from '../../model/themeColors';

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

/** 先显示静态波纹，行动区接近视口且 WebGL 成功绘制后再切换为动态波浪。 */
export default function LandingClosingBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');
  const [wavesReady, setWavesReady] = useState(false);
  const { theme: mode } = useLandingTheme();
  const { token } = theme.useToken();
  const light = mode === 'light';
  const staticShadow = withAlpha(token.colorPrimary, light ? 0.26 : 0.24);
  const staticCrest = withAlpha(token.colorPrimaryBorder, light ? 0.46 : 0.34);
  const staticWaves = `radial-gradient(ellipse at 60% 132%, ${staticShadow} 0 26%, transparent 48%),
    radial-gradient(ellipse at 31% 123%, ${staticCrest} 0 22%, transparent 45%),
    radial-gradient(ellipse at 96% 116%, ${staticShadow}, transparent 53%),
    radial-gradient(ellipse at 5% 115%, ${staticCrest}, transparent 46%)`;

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
      style={{
        backgroundImage: wavesReady ? undefined : staticWaves,
        maskImage: mask,
        WebkitMaskImage: mask,
        opacity: light ? 0.88 : 1,
      }}
    >
      {near && (
        <Suspense fallback={null}>
          <GradientWaves
            horizonColor={token.colorPrimary}
            waveColor={token.colorPrimaryBorder}
            crestColor={token.colorPrimaryBgHover}
            lightMode={light}
            tilt={58}
            dpr={1.25}
            intro={false}
            onReadyChange={setWavesReady}
            style={{ transform: 'scaleX(1.18)' }}
          />
        </Suspense>
      )}
    </div>
  );
}
