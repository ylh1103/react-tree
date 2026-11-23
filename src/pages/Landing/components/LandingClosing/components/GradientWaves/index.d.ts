import type { CSSProperties, ReactElement } from 'react';

interface GradientWavesProps {
  horizonColor: string;
  waveColor: string;
  crestColor: string;
  lightMode: boolean;
  tilt: number;
  dpr: number;
  intro?: boolean;
  /** 首帧绘制完成时通知上层切换背景，上下文丢失时恢复静态波纹。 */
  onReadyChange?: (ready: boolean) => void;
  style?: CSSProperties;
}

export default function GradientWaves(props: GradientWavesProps): ReactElement;
