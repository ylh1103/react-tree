/** 可选的品牌平面加载图标：使用分合回弹，尺寸由调用处字号控制。 */
import { animationKeyframes } from './model/animations.ts';
import { useId, type SVGProps } from 'react';

const redPanel =
  'M88 48 36 63Q18 68 18 86V143Q18 166 41 161L91 148Q101 146 109 153L120 165V70Q120 42 99 45Z';
const bluePanel =
  'M88 16 101 28Q109 35 123 31L153 23Q178 17 178 43V107Q178 122 163 126L113 140Q88 146 88 121Z';

/** 当前支持的平面方案，也可经用户配置作为全局 Ant Design Spin 指示器。 */
export type BrandLoadingVariant = 'split';

/** 继承 SVG 属性，尺寸与状态语义由外层 Spin 或加载容器提供。 */
interface BrandLoadingProps extends SVGProps<SVGSVGElement> {
  variant?: BrandLoadingVariant;
}

const motions: Record<BrandLoadingVariant, { red: string; blue: string }> = {
  split: {
    red: '[animation:brand-red_1.25s_ease-in-out_infinite] [transform-origin:98px_92px] motion-reduce:animate-none',
    blue: '[animation:brand-blue_1.25s_ease-in-out_infinite] [transform-origin:98px_92px] motion-reduce:animate-none',
  },
};

const origin = '[transform-origin:98px_92px] motion-reduce:animate-none';

/** 多实例使用独立裁剪 ID，使红蓝双片移动时的交集始终正确，避免不同尺寸互相影响。 */
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
      <style>{animationKeyframes}</style>
      <g className={origin}>
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
