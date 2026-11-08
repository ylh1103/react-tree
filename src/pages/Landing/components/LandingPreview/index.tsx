/** 首屏的浏览器式预览，鼠标位置只更新局部样式变量。 */
import type { PointerEvent } from 'react';

function trackPointer(event: PointerEvent<HTMLDivElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return;
  const node = event.currentTarget;
  const bounds = node.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  node.style.setProperty('--preview-shift-x', `${(x - 0.5) * 16}px`);
  node.style.setProperty('--preview-shift-y', `${(y - 0.5) * 12}px`);
}

function resetPointer(event: PointerEvent<HTMLDivElement>) {
  const style = event.currentTarget.style;
  for (const property of ['--preview-shift-x', '--preview-shift-y']) {
    style.removeProperty(property);
  }
}

export default function LandingPreview({ light }: { light: boolean }) {
  return (
    <div
      aria-hidden="true"
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      className="pointer-events-auto relative z-1 mt-[clamp(32px,5vw,52px)]"
    >
      <div
        className={`pointer-events-none overflow-hidden rounded-16px border border-solid px-4px pb-4px shadow-[0_18px_40px_-12px_#0004] [translate:var(--preview-shift-x,0px)_var(--preview-shift-y,0px)] transition-[translate] duration-250 ease-out motion-reduce:[translate:none] ${light ? 'border-border-subtle bg-canvas' : 'border-white/10 bg-[#28282a]'}`}
      >
        <div
          className={`relative -mx-4px flex h-36px items-center justify-center text-11px leading-none text-text-secondary ${light ? '[background-image:linear-gradient(110deg,var(--color-canvas),color-mix(in_srgb,var(--color-canvas)_96%,var(--color-accent)))]' : '[background-image:linear-gradient(110deg,#262626,#302d36)] [&_div>span]:bg-white/10'}`}
        >
          <div className="absolute left-14px flex gap-6px">
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2 w-2 rounded-full bg-border" />
            <span className="h-2 w-2 rounded-full bg-border" />
          </div>
          <span
            className={`inline-flex h-22px items-center gap-1 rounded-full border border-solid px-2.5 ${light ? 'border-border-subtle bg-surface' : 'border-white/8 bg-[#1c1c1e] text-white/85'}`}
          >
            <span className="i-lucide-lock h-3 w-3" />
            灵动参数管家
          </span>
        </div>
        <div
          className={`aspect-[23/10] min-h-180px overflow-hidden rounded-11px [@media(max-width:768px)]:aspect-[16/10] ${light ? 'bg-white' : 'bg-[#0c0c0e]'}`}
        />
      </div>
    </div>
  );
}
