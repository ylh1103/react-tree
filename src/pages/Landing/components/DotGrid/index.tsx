/** 粒子画布入口只处理参数默认值与布局；WebGL 实例由专用 Hook 维护。 */
import { useDotGrid } from './useDotGrid';
import type { DotGridProps } from './types';
export default function DotGrid({
  dotSize = 5,
  gap = 18,
  baseColor = '#3a3446',
  activeColor = '#ffffff',
  proximity = 140,
  strength = 1,
  bounce = 0.6,
  tension = 0.4,
  returnDuration = 0.8,
  shockRadius = 320,
  shockStrength = 5,
  swell = 0.8,
  stretch = 0.5,
  glow = 0.5,
  shape = 'circle',
  fade = 0,
  opacity = 1,
  intro = true,
  mouseInteraction = true,
  clickShock = true,
  paused = false,
  dpr,
  className = '',
  style,
}: DotGridProps) {
  const canvasRef = useDotGrid({
    dotSize,
    gap,
    baseColor,
    activeColor,
    proximity,
    strength,
    bounce,
    tension,
    returnDuration,
    shockRadius,
    shockStrength,
    swell,
    stretch,
    glow,
    shape,
    fade,
    opacity,
    intro,
    mouseInteraction,
    clickShock,
    paused,
    dpr,
  });
  return (
    <div className={`relative h-full w-full ${className}`} style={style}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
