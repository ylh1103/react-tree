/** 组件专用关键帧：UnoCSS 工具类负责动画属性，关键帧只在组件挂载时内嵌。 */
export const animationKeyframes = `@keyframes brand-blue{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(24px,18px) rotate(12deg)}60%{transform:translate(24px,-18px) rotate(8deg)}82%{transform:translate(-3px,0) rotate(-2deg)}}
@keyframes brand-bounce-blue{0%,45%,100%{transform:translateY(0)}67%{transform:translateY(-42px)}80%{transform:translateY(8px)}}
@keyframes brand-bounce-red{0%,45%,100%{transform:translateY(0)}22%{transform:translateY(-42px)}35%{transform:translateY(8px)}}
@keyframes brand-breathe{0%,100%{transform:scale(.78);opacity:.55}50%{transform:scale(1.12);opacity:1}}
@keyframes brand-flip-blue{0%,20%,100%{transform:scaleX(1)}55%{transform:scaleX(-1)}72%{transform:scaleX(.08)}}
@keyframes brand-flip-red{0%,60%,100%{transform:scaleX(1)}25%{transform:scaleX(-1)}42%{transform:scaleX(.08)}}
@keyframes brand-red{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-24px,-18px) rotate(-12deg)}60%{transform:translate(-24px,18px) rotate(-8deg)}82%{transform:translate(3px,0) rotate(2deg)}}
@keyframes brand-rotate{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
