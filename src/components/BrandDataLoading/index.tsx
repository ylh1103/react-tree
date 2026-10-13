import { useId, type SVGProps } from 'react';
import type { BrandDataLoadingVariant } from './model/styles';
export type { BrandDataLoadingVariant } from './model/styles';

interface BrandDataLoadingProps extends SVGProps<SVGSVGElement> {
  variant?: BrandDataLoadingVariant;
}

const red =
  'M88 48 36 63Q18 68 18 86V143Q18 166 41 161L91 148Q101 146 109 153L120 165V70Q120 42 99 45Z';
const blue =
  'M88 16 101 28Q109 35 123 31L153 23Q178 17 178 43V107Q178 122 163 126L113 140Q88 146 88 121Z';
const overlap = 'M88 48L99 45Q120 42 120 70V138L113 140Q88 146 88 121Z';

function BrandMark() {
  return (
    <>
      <path d={red} fill="#ff3159" />
      <path d={blue} fill="#249afc" />
      <path d={overlap} fill="#2923b5" />
    </>
  );
}
const colors = ['#ff3159', '#f33d77', '#7d57da', '#3985ee', '#249afc'];
const delays = [
  '[animation-delay:0ms]!',
  '[animation-delay:-160ms]!',
  '[animation-delay:-320ms]!',
  '[animation-delay:-480ms]!',
  '[animation-delay:-640ms]!',
];
const dotDelays = [
  '[animation-delay:0ms]!',
  '[animation-delay:-120ms]!',
  '[animation-delay:-240ms]!',
  '[animation-delay:-120ms]!',
  '[animation-delay:-240ms]!',
  '[animation-delay:-360ms]!',
  '[animation-delay:-240ms]!',
  '[animation-delay:-360ms]!',
  '[animation-delay:-480ms]!',
];

const segmentDelays = [
  '[animation-delay:0ms]!',
  '[animation-delay:-150ms]!',
  '[animation-delay:-300ms]!',
  '[animation-delay:-450ms]!',
  '[animation-delay:-600ms]!',
  '[animation-delay:-750ms]!',
  '[animation-delay:-900ms]!',
  '[animation-delay:-1050ms]!',
];
const cometDots = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6;
  return {
    x: 100 + 64 * Math.cos(angle),
    y: 100 + 64 * Math.sin(angle),
    radius: 5 + index * 0.6,
    opacity: 0.12 + index * 0.08,
    color: colors[Math.min(4, Math.floor(index / 3))],
  };
});

/** Transparent data indicators; size inherits from Spin and variants have stable keys. */
export function BrandDataLoading({
  variant = 'rings',
  className = '',
  ...props
}: BrandDataLoadingProps) {
  const id = useId();
  return (
    <svg
      {...props}
      viewBox="0 0 200 200"
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`inline-block align-middle overflow-visible ${className}`}
    >
      {variant === 'beacon' && (
        <>
          <circle cx="100" cy="100" r="91" stroke="#249afc" strokeWidth="4" opacity=".12" />
          <g className="animate-brand-beacon [transform-origin:100px_100px] motion-reduce:animate-none">
            <circle
              cx="100"
              cy="100"
              r="91"
              pathLength="100"
              stroke="#249afc"
              strokeWidth="7"
              strokeDasharray="15 85"
              strokeLinecap="round"
            />
            <circle cx="191" cy="100" r="8" fill="#ff3159" />
          </g>
          <g transform="translate(26 33) scale(.75)">
            <BrandMark />
          </g>
        </>
      )}
      {variant === 'shine' && (
        <g transform="translate(16 26) scale(.85)">
          <defs>
            <clipPath id={`${id}-clip`}>
              <path d={red} />
              <path d={blue} />
            </clipPath>
            <linearGradient id={`${id}-light`}>
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset=".5" stopColor="white" stopOpacity=".65" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
          <BrandMark />
          <g clipPath={`url(#${id}-clip)`}>
            <path
              d="M-80 -30H-28L65 220H13Z"
              fill={`url(#${id}-light)`}
              className="animate-brand-shine motion-reduce:animate-none"
            />
          </g>
        </g>
      )}
      {variant === 'echo' && (
        <g transform="translate(32 37) scale(.7)">
          {[false, true].map((delayed) => (
            <g
              key={String(delayed)}
              fill="none"
              strokeWidth="6"
              className={`animate-brand-echo [transform-origin:98px_92px] motion-reduce:animate-none motion-reduce:opacity-0 ${delayed ? '[animation-delay:-1000ms]!' : ''}`}
            >
              <path d={red} stroke="#ff3159" />
              <path d={blue} stroke="#249afc" />
            </g>
          ))}
          <BrandMark />
        </g>
      )}
      {variant === 'inflow' && (
        <>
          <path
            d="M8 102H52M148 102H192"
            stroke="#7d57da"
            strokeWidth="3"
            strokeDasharray="4 7"
            opacity=".2"
          />
          <circle
            cx="8"
            cy="102"
            r="7"
            fill="#ff3159"
            className="animate-brand-inflow-red motion-reduce:animate-none"
          />
          <circle
            cx="192"
            cy="102"
            r="7"
            fill="#249afc"
            className="animate-brand-inflow-blue [animation-delay:-700ms]! motion-reduce:animate-none"
          />
          <g transform="translate(40 44) scale(.6)">
            <BrandMark />
          </g>
        </>
      )}
      {variant === 'comet' && (
        <g className="animate-loading-ring [transform-origin:100px_100px] motion-reduce:animate-none">
          {cometDots.map((dot, index) => (
            <circle
              key={index}
              cx={dot.x}
              cy={dot.y}
              r={dot.radius}
              fill={dot.color}
              opacity={dot.opacity}
            />
          ))}
        </g>
      )}
      {variant === 'relay' && (
        <>
          <path
            d="M58 100C58 56 142 144 142 100S58 144 58 100S142 56 142 100"
            stroke="#7d57da"
            strokeWidth="5"
            opacity="0.1"
          />
          <circle
            cx="58"
            cy="100"
            r="14"
            fill="#ff3159"
            className="animate-loading-relay-red motion-reduce:animate-none"
          />
          <circle
            cx="142"
            cy="100"
            r="14"
            fill="#249afc"
            className="animate-loading-relay-blue motion-reduce:animate-none"
          />
        </>
      )}
      {variant === 'segments' && (
        <g strokeWidth="13" strokeLinecap="round">
          {segmentDelays.map((delay, index) => (
            <circle
              key={index}
              cx="100"
              cy="100"
              r="67"
              pathLength="100"
              strokeDasharray="7 93"
              strokeDashoffset={-index * 12.5}
              stroke={colors[Math.min(4, Math.floor((index * 5) / 8))]}
              className={`animate-loading-segment motion-reduce:animate-none ${delay}`}
            />
          ))}
        </g>
      )}
      {variant === 'shuttle' && (
        <>
          <rect x="30" y="76" width="140" height="12" rx="6" fill="#ff3159" opacity=".1" />
          <rect x="30" y="112" width="140" height="12" rx="6" fill="#249afc" opacity=".1" />
          <rect
            x="30"
            y="76"
            width="36"
            height="12"
            rx="6"
            fill="#ff3159"
            className="animate-loading-shuttle motion-reduce:animate-none"
          />
          <rect
            x="30"
            y="112"
            width="36"
            height="12"
            rx="6"
            fill="#249afc"
            className="animate-loading-shuttle [animation-delay:-900ms]! motion-reduce:animate-none"
          />
        </>
      )}
      {variant === 'trace' && (
        <g strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <path d={red} stroke="#ff3159" opacity="0.15" />
          <path d={blue} stroke="#249afc" opacity="0.15" />
          <path
            d={red}
            stroke="#ff3159"
            pathLength="100"
            strokeDasharray="30 70"
            className="animate-loading-trace motion-reduce:animate-none"
          />
          <path
            d={blue}
            stroke="#249afc"
            pathLength="100"
            strokeDasharray="30 70"
            className="animate-loading-trace [animation-delay:-900ms]! motion-reduce:animate-none"
          />
        </g>
      )}
      {variant === 'rings' && (
        <>
          <circle cx="100" cy="100" r="85" stroke="#249afc" strokeWidth="8" opacity="0.12" />
          <circle cx="100" cy="100" r="67" stroke="#ff3159" strokeWidth="8" opacity="0.12" />
          <g className="animate-loading-ring [transform-origin:100px_100px] motion-reduce:animate-none">
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="#249afc"
              strokeWidth="9"
              pathLength="100"
              strokeDasharray="28 72"
              strokeLinecap="round"
            />
          </g>
          <g className="animate-loading-ring [animation-direction:reverse]! [transform-origin:100px_100px] motion-reduce:animate-none">
            <circle
              cx="100"
              cy="100"
              r="67"
              stroke="#ff3159"
              strokeWidth="9"
              pathLength="100"
              strokeDasharray="24 76"
              strokeDashoffset="-50"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(62 62) scale(.4)">
            <path d={red} fill="#ff3159" />
            <path d={blue} fill="#249afc" />
            <path d="M88 48L99 45Q120 42 120 70V138L113 140Q88 146 88 121Z" fill="#2923b5" />
          </g>
        </>
      )}
      {variant === 'wave' &&
        colors.map((color, index) => (
          <rect
            key={color}
            x={45 + index * 24}
            y="59"
            width="14"
            height="82"
            rx="7"
            fill={color}
            className={`animate-loading-wave [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none ${delays[index]}`}
          />
        ))}
      {variant === 'matrix' &&
        Array.from({ length: 9 }, (_, index) => (
          <circle
            key={index}
            cx={58 + (index % 3) * 42}
            cy={58 + Math.floor(index / 3) * 42}
            r="13"
            fill={colors[(index % 3) * 2]}
            className={`animate-loading-dot [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none ${dotDelays[index]}`}
          />
        ))}
    </svg>
  );
}
