/** 组件专用关键帧：仅保留当前方案使用的动画；UnoCSS 负责动画属性，关键帧随组件内嵌。 */
export const animationKeyframes = `@keyframes brand-blue{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(24px,18px) rotate(12deg)}60%{transform:translate(24px,-18px) rotate(8deg)}82%{transform:translate(-3px,0) rotate(-2deg)}}
@keyframes brand-red{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-24px,-18px) rotate(-12deg)}60%{transform:translate(-24px,18px) rotate(-8deg)}82%{transform:translate(3px,0) rotate(2deg)}}`;
