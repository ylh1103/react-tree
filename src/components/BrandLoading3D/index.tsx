import { useId, type HTMLAttributes } from 'react';
import { panelSides } from './geometry';

export type BrandLoading3DVariant = 'magnet' | 'enamel' | 'orbital';

interface BrandLoading3DProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BrandLoading3DVariant;
}

const panelPaths = {
  red: 'M88 48 36 63Q18 68 18 86V143Q18 166 41 161L91 148Q101 146 109 153L120 165V70Q120 42 99 45Z',
  blue: 'M88 16 101 28Q109 35 123 31L153 23Q178 17 178 43V107Q178 122 163 126L113 140Q88 146 88 121Z',
};

const motionClasses = {
  magnet: ['animate-brand3d-magnet-red', 'animate-brand3d-magnet-blue'],
  enamel: ['animate-brand3d-enamel-red', 'animate-brand3d-enamel-blue'],
  orbital: ['animate-brand3d-orbit-red', 'animate-brand3d-orbit-blue'],
};

const sideColors = {
  red: ['bg-[#db365d]', 'bg-[#a31842]', 'bg-[#711232]'],
  blue: ['bg-[#3277d9]', 'bg-[#1745a0]', 'bg-[#102c76]'],
};

export function BrandLoading3D({
  variant = 'magnet',
  className = '',
  ...props
}: BrandLoading3DProps) {
  const id = useId();
  return (
    <span
      {...props}
      aria-hidden="true"
      className={`relative inline-block w-1em h-1em align-middle overflow-visible [perspective:5em] ${className}`}
    >
      <span className="absolute left-1/5 right-1/5 bottom-[-0.14em] h-0.12em rounded-full bg-text/15 blur-[0.06em] animate-brand3d-shadow motion-reduce:animate-none" />
      <span className="absolute inset-0 [transform-style:preserve-3d] [transform:rotateX(-18deg)_rotateY(-28deg)_rotateZ(-8deg)]">
        {(['red', 'blue'] as const).map((color, panelIndex) => {
          const faceId = `${id}-${color}-face`;
          const shineId = `${id}-${color}-shine`;
          const edgeColor = color === 'red' ? '#9d1239' : '#0d329a';
          const faceColors =
            color === 'red' ? ['#ff8ca3', '#ff3159', '#df1047'] : ['#86ddff', '#249afc', '#1854d4'];
          return (
            <span
              key={color}
              className={`absolute inset-0 [transform-style:preserve-3d] motion-reduce:animate-none ${motionClasses[variant][panelIndex]}`}
            >
              {panelSides[color].map((side, index) => (
                <span
                  key={index}
                  style={side.style}
                  className={`absolute h-0.12em [left:var(--edge-x)] [top:var(--edge-y)] [width:var(--edge-width)] [transform-origin:0_0] [transform:rotateZ(var(--edge-angle))_rotateX(90deg)] ${sideColors[color][side.shade]}`}
                />
              ))}
              <svg
                viewBox="0 0 196 184"
                className="absolute inset-0 w-full h-full overflow-visible [transform:translateZ(0.12em)] [backface-visibility:hidden]"
              >
                <defs>
                  <linearGradient
                    id={faceId}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop offset="0" stopColor={faceColors[0]} />
                    <stop offset="0.48" stopColor={faceColors[1]} />
                    <stop offset="1" stopColor={faceColors[2]} />
                  </linearGradient>
                  <linearGradient
                    id={shineId}
                    x1="0"
                    y1="0"
                    x2="0.7"
                    y2="1"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop offset="0" stopColor="white" stopOpacity="0.7" />
                    <stop
                      offset={variant === 'enamel' ? '0.44' : '0.25'}
                      stopColor="white"
                      stopOpacity="0"
                    />
                    <stop
                      offset="0.48"
                      stopColor="white"
                      stopOpacity={variant === 'enamel' ? '0.28' : '0'}
                    />
                    <stop offset="0.62" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={panelPaths[color]} fill={`url(#${faceId})`} />
                <path d={panelPaths[color]} fill={`url(#${shineId})`} />
                <path
                  d={panelPaths[color]}
                  fill="none"
                  stroke="white"
                  strokeOpacity={variant === 'enamel' ? '0.55' : '0.24'}
                  strokeWidth="2.5"
                />
              </svg>
              <svg
                viewBox="0 0 196 184"
                className="absolute inset-0 w-full h-full overflow-visible [transform:translateZ(-0.002em)]"
              >
                <path d={panelPaths[color]} fill={edgeColor} />
              </svg>
            </span>
          );
        })}
      </span>
    </span>
  );
}
