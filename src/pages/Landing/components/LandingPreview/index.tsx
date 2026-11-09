/** 首屏的浏览器式预览，使用 Motion 值驱动弹簧位移，避免移动鼠标时重新渲染。 */
import type { PointerEvent } from 'react';
import { m, useSpring } from 'motion/react';

export default function LandingPreview({ light }: { light: boolean }) {
  const x = useSpring(0, { stiffness: 180, damping: 24 });
  const y = useSpring(0, { stiffness: 180, damping: 24 });

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 12);
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 10);
  }

  function resetPointer() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      aria-hidden="true"
      onPointerMove={trackPointer}
      onPointerLeave={resetPointer}
      className="pointer-events-auto relative z-1 mt-[clamp(32px,5vw,64px)]"
    >
      <m.div
        style={{ x, y }}
        className={`pointer-events-none overflow-hidden rounded-16px border border-solid p-4px shadow-sm motion-reduce:transform-none! ${light ? 'border-border-subtle bg-canvas' : 'border-white/10 bg-[#161616]'}`}
      >
        <div
          className={`relative flex h-9 items-center justify-center ${light ? 'bg-canvas' : 'bg-[#161616] [&_div>span]:bg-white/10'}`}
        >
          <div className="absolute left-3 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
            <span className="h-2.5 w-2.5 rounded-full bg-border" />
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-solid px-3.5 py-1 text-11px font-500 leading-[1.5] ${light ? 'border-border-subtle bg-surface/70 text-text-secondary' : 'border-white/8 bg-[#101010]/70 text-text-secondary'}`}
          >
            <span className="i-lucide-lock h-2.5 w-2.5 shrink-0" />
            param.cmbchina.cn
          </span>
        </div>
        <div
          className={`aspect-[23/10] min-h-180px overflow-hidden rounded-11px [@media(max-width:768px)]:aspect-[16/10] ${light ? 'bg-white' : 'bg-[#080808]'}`}
        />
      </m.div>
    </div>
  );
}
