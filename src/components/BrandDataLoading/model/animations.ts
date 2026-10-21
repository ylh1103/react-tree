/** 组件专用关键帧：仅保留当前方案使用的动画；UnoCSS 负责动画属性，关键帧随组件内嵌。 */
export const animationKeyframes = `@keyframes loading-dot{0%,100%{transform:scale(.48);opacity:.25}45%{transform:scale(1);opacity:1}65%{transform:scale(.9);opacity:.8}}
@keyframes loading-ring{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes loading-trace{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@keyframes loading-wave{0%,100%{transform:scaleY(.28);opacity:.5}50%{transform:scaleY(1);opacity:1}}`;
