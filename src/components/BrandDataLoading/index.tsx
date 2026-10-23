/** 可缩放的品牌数据加载指示器：复用透明 SVG，并为各方案提供独立动效及减少动态效果的静态回退。 */
import { animationKeyframes } from './model/animations.ts';
import { red, blue } from './model/mark.ts';
import type { SVGProps } from 'react';
import type { BrandDataLoadingVariant } from './model/styles.ts';
export type { BrandDataLoadingVariant } from './model/styles.ts';

/** 尺寸继承字号，可作为 Ant Design Spin 的 indicator；加载语义由外层状态容器提供。 */
interface BrandDataLoadingProps extends SVGProps<SVGSVGElement> {
  variant?: BrandDataLoadingVariant;
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

/** 方案使用稳定键，新增展示效果不改变既有调用方的默认方案。 */
export function BrandDataLoading({
  variant = 'trace',
  className = '',
  ...props
}: BrandDataLoadingProps) {
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
      <style>{animationKeyframes}</style>
      {variant === 'comet' && (
        <g className="[animation:loading-ring_1.6s_linear_infinite] [transform-origin:100px_100px] motion-reduce:animate-none">
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
      {variant === 'trace' && (
        <g strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <path d={red} stroke="#ff3159" opacity="0.15" />
          <path d={blue} stroke="#249afc" opacity="0.15" />
          <path
            d={red}
            stroke="#ff3159"
            pathLength="100"
            strokeDasharray="30 70"
            className="[animation:loading-trace_1.8s_linear_infinite] motion-reduce:animate-none"
          />
          <path
            d={blue}
            stroke="#249afc"
            pathLength="100"
            strokeDasharray="30 70"
            className="[animation:loading-trace_1.8s_linear_infinite] [animation-delay:-900ms]! motion-reduce:animate-none"
          />
        </g>
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
            className={`[animation:loading-wave_1.1s_ease-in-out_infinite] [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none ${delays[index]}`}
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
            className={`[animation:loading-dot_1.4s_ease-in-out_infinite] [transform-box:fill-box] [transform-origin:center] motion-reduce:animate-none ${dotDelays[index]}`}
          />
        ))}
    </svg>
  );
}
