import { useId, type SVGProps } from 'react';

const redPanel =
  'M88 48 36 63Q18 68 18 86V143Q18 166 41 161L91 148Q101 146 109 153L120 165V70Q120 42 99 45Z';
const bluePanel =
  'M88 16 101 28Q109 35 123 31L153 23Q178 17 178 43V107Q178 122 163 126L113 140Q88 146 88 121Z';

export type BrandLoadingVariant = 'split' | 'rotate' | 'flip' | 'breathe' | 'bounce' | 'orbit';

interface BrandLoadingProps extends SVGProps<SVGSVGElement> {
  variant?: BrandLoadingVariant;
}

const motions: Record<BrandLoadingVariant, { logo: string; red: string; blue: string }> = {
  split: { logo: '', red: 'brand-loading-red', blue: 'brand-loading-blue' },
  rotate: { logo: 'animate-brand-rotate', red: '', blue: '' },
  flip: { logo: '', red: 'animate-brand-flip-red', blue: 'animate-brand-flip-blue' },
  breathe: { logo: 'animate-brand-breathe', red: '', blue: '' },
  bounce: { logo: '', red: 'animate-brand-bounce-red', blue: 'animate-brand-bounce-blue' },
  orbit: { logo: '', red: '', blue: '' },
};

const origin = '[transform-origin:98px_92px] motion-reduce:animate-none';

/** Transparent brand indicator; its 1em size follows Ant Design Spin's size. */
export function BrandLoading({ variant = 'split', className = '', ...props }: BrandLoadingProps) {
  const clipId = `brand-loading-${useId()}`;
  const motion = motions[variant];
  const redClass = `${motion.red} ${origin}`;
  const blueClass = `${motion.blue} ${origin}`;

  return (
    <svg
      {...props}
      viewBox="0 0 196 184"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`inline-block align-middle overflow-visible ${className}`}
    >
      {variant === 'orbit' && (
        <g className={`animate-brand-rotate ${origin}`}>
          <circle
            cx="98"
            cy="92"
            r="108"
            stroke="#1d9bf0"
            strokeWidth="9"
            strokeDasharray="100 579"
            strokeLinecap="round"
          />
          <circle
            cx="98"
            cy="92"
            r="108"
            stroke="#ff2045"
            strokeWidth="9"
            strokeDasharray="100 579"
            strokeDashoffset="-339"
            strokeLinecap="round"
          />
        </g>
      )}
      <g className={`${motion.logo} ${origin}`}>
        <defs>
          <clipPath id={clipId}>
            <path d={redPanel} className={redClass} />
          </clipPath>
        </defs>
        <path d={redPanel} fill="#ff2045" className={redClass} />
        <path d={bluePanel} fill="#1d9bf0" className={blueClass} />
        <g clipPath={`url(#${clipId})`}>
          <path d={bluePanel} fill="#1715b6" className={blueClass} />
        </g>
      </g>
    </svg>
  );
}
