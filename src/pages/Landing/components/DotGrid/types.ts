/** 渲染器参数保持官方语义；React 只提交参数，帧循环独立维护物理状态。 */
import type { CSSProperties } from 'react';
export interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  strength?: number;
  bounce?: number;
  tension?: number;
  returnDuration?: number;
  shockRadius?: number;
  shockStrength?: number;
  swell?: number;
  stretch?: number;
  glow?: number;
  shape?: 'circle' | 'square';
  fade?: number;
  opacity?: number;
  intro?: boolean;
  mouseInteraction?: boolean;
  clickShock?: boolean;
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

/** 帧循环只消费已补齐默认值的参数，避免在逐帧计算中重复判空。 */
export type DotGridSettings = Required<Omit<DotGridProps, 'dpr' | 'className' | 'style'>> &
  Pick<DotGridProps, 'dpr'>;
