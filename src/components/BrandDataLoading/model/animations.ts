/** 组件专用关键帧：UnoCSS 工具类负责动画属性，关键帧只在组件挂载时内嵌。 */
export const animationKeyframes = `@keyframes brand-beacon{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes brand-echo{0%{transform:scale(1);opacity:.48}90%,100%{transform:scale(1.4);opacity:0}}
@keyframes brand-inflow-blue{0%{transform:translateX(0);opacity:0}20%{opacity:1}75%{transform:translateX(-44px);opacity:1}95%,100%{transform:translateX(-44px);opacity:0}}
@keyframes brand-inflow-red{0%{transform:translateX(0);opacity:0}20%{opacity:1}75%{transform:translateX(44px);opacity:1}95%,100%{transform:translateX(44px);opacity:0}}
@keyframes brand-shine{0%,10%{transform:translateX(0);opacity:0}18%{opacity:1}75%{transform:translateX(265px);opacity:1}85%,100%{transform:translateX(265px);opacity:0}}
@keyframes loading-dot{0%,100%{transform:scale(.48);opacity:.25}45%{transform:scale(1);opacity:1}65%{transform:scale(.9);opacity:.8}}
@keyframes loading-relay-blue{0%,100%{transform:translate(0,0)}25%{transform:translate(-42px,24px)}50%{transform:translate(-84px,0)}75%{transform:translate(-42px,-24px)}}
@keyframes loading-relay-red{0%,100%{transform:translate(0,0)}25%{transform:translate(42px,-24px)}50%{transform:translate(84px,0)}75%{transform:translate(42px,24px)}}
@keyframes loading-ring{from{transform:rotate(0)}to{transform:rotate(360deg)}}
@keyframes loading-segment{0%,100%{opacity:.18}25%{opacity:1}60%{opacity:.18}}
@keyframes loading-shuttle{0%,100%{transform:translateX(0);opacity:.55}50%{transform:translateX(104px);opacity:1}}
@keyframes loading-trace{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@keyframes loading-wave{0%,100%{transform:scaleY(.28);opacity:.5}50%{transform:scaleY(1);opacity:1}}`;
