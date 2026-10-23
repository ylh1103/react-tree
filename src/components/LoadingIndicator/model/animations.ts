/** 组件专用关键帧按方案集中管理：普通 UnoCSS 工具类无法定义关键帧，因此仅将当前方案内嵌到 SVG。 */
import type { LoadingStyleId } from '../../../types/loading.ts';

/** 保留稳定动画名；动画属性与减少动态效果的回退仍由组件内 UnoCSS 工具类负责。 */
export const animationKeyframes: Record<LoadingStyleId, string> = {
  'data-matrix': `@keyframes loading-dot{0%,100%{transform:scale(.48);opacity:.25}45%{transform:scale(1);opacity:1}65%{transform:scale(.9);opacity:.8}}`,
  'data-comet': `@keyframes loading-ring{from{transform:rotate(0)}to{transform:rotate(360deg)}}`,
  'data-trace': `@keyframes loading-trace{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}`,
  'data-wave': `@keyframes loading-wave{0%,100%{transform:scaleY(.28);opacity:.5}50%{transform:scaleY(1);opacity:1}}`,
  'flat-split': `@keyframes brand-blue{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(24px,18px) rotate(12deg)}60%{transform:translate(24px,-18px) rotate(8deg)}82%{transform:translate(-3px,0) rotate(-2deg)}}
@keyframes brand-red{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-24px,-18px) rotate(-12deg)}60%{transform:translate(-24px,18px) rotate(-8deg)}82%{transform:translate(3px,0) rotate(2deg)}}`,
};
