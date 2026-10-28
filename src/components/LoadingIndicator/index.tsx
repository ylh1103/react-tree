/** 统一管理全部品牌加载图标；纯渲染入口供启动 HTML、图库和 Ant Design Spin 共用，不依赖 Redux。 */
import { useId, type SVGProps } from 'react';
import { animationKeyframes } from './model/animations.ts';
import { red, blue } from './model/mark.ts';
import { loadingStyles } from './model/styles.ts';
import type { LoadingStyleId } from '../../types/loading.ts';

/** 稳定方案标识兼容已保存配置；SVG 尺寸与加载语义由调用处或 Ant Design Spin 提供。 */
interface LoadingIndicatorProps extends SVGProps<SVGSVGElement> {
  styleId: LoadingStyleId;
}

const origin = '[transform-origin:98px_92px] motion-reduce:animate-none';
const redMotion = `[animation:brand-red_1.25s_ease-in-out_infinite] ${origin}`;
const blueMotion = `[animation:brand-blue_1.25s_ease-in-out_infinite] ${origin}`;

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

/** 统一 SVG 外壳与全部动效；多实例裁剪 ID 独立，避免图库中不同尺寸的分合图标相互影响。 */
export function LoadingIndicator({
  styleId: requestedStyleId,
  className = '',
  ...props
}: LoadingIndicatorProps) {
  const clipId = `brand-loading-${useId()}`;
  const styleId = (loadingStyles.find((item) => item.id === requestedStyleId) ?? loadingStyles[0])
    .id;
  const split = styleId === 'flat-split';

  return (
    <svg
      {...props}
      viewBox={split ? '0 0 196 184' : '0 0 200 200'}
      width="1em"
      height="1em"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`inline-block align-middle overflow-visible ${className}`}
    >
      <style>{animationKeyframes[styleId]}</style>
      {split && (
        <g className={origin}>
          <defs>
            <clipPath id={clipId}>
              <path d={red} className={redMotion} />
            </clipPath>
          </defs>
          <path d={red} fill="#ff2045" className={redMotion} />
          <path d={blue} fill="#1d9bf0" className={blueMotion} />
          <g clipPath={`url(#${clipId})`}>
            <path d={blue} fill="#1715b6" className={blueMotion} />
          </g>
        </g>
      )}
      {styleId === 'data-comet' && (
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
      {styleId === 'data-trace' && (
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
      {styleId === 'data-wave' &&
        colors.map((color, index) => (
          <rect
            key={color}
            x={45 + index * 24}
            y="59"
            width="14"
            height="82"
            rx="7"
            fill={color}
            className={`
              [animation:loading-wave_1.1s_ease-in-out_infinite] [transform-box:fill-box]
              [transform-origin:center] motion-reduce:animate-none
              ${delays[index]}
            `}
          />
        ))}
      {styleId === 'data-matrix' &&
        Array.from({ length: 9 }, (_, index) => (
          <circle
            key={index}
            cx={58 + (index % 3) * 42}
            cy={58 + Math.floor(index / 3) * 42}
            r="13"
            fill={colors[(index % 3) * 2]}
            className={`
              [animation:loading-dot_1.4s_ease-in-out_infinite] [transform-box:fill-box]
              [transform-origin:center] motion-reduce:animate-none
              ${dotDelays[index]}
            `}
          />
        ))}
    </svg>
  );
}
