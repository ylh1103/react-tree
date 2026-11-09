import type { ComponentType, ReactNode } from 'react';

declare const CTA: ComponentType<{
  actions?: ReactNode;
  secondaryHref?: string;
  waveColors?: { horizonColor: string; waveColor: string; crestColor: string };
}>;
export default CTA;
