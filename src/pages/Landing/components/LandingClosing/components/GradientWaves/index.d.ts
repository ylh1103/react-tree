import type { CSSProperties, ReactElement } from 'react';

interface GradientWavesProps {
  horizonColor: string;
  waveColor: string;
  crestColor: string;
  lightMode: boolean;
  tilt: number;
  dpr: number;
  style?: CSSProperties;
}

export default function GradientWaves(props: GradientWavesProps): ReactElement;
