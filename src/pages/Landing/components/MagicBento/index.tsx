/**
 * 从 React Bits MagicBento TS-TW 裁剪的页面内容网格：保留网格、内容插槽和指针边缘高光。
 * 移除上游演示画面及图标依赖、粒子、倾斜、磁吸、点击波纹与入场动画；不承载整卡点击。
 */
import { useRef, type ReactNode } from 'react';

export interface BentoItem {
  id: string;
  content: ReactNode;
  wide?: boolean;
}
export default function MagicBento({
  items,
  columns = 2,
}: {
  items: BentoItem[];
  columns?: 2 | 3;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={rootRef}
      className={`grid gap-4 ${columns === 3 ? 'min-[768px]:grid-cols-3' : 'min-[768px]:grid-cols-2'}`}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        // 只在用户操作时更新 DOM 变量，不产生全页渲染或常驻动画帧。
        rootRef.current?.querySelectorAll<HTMLElement>('[data-bento-card]').forEach((card) => {
          const rect = card.getBoundingClientRect();
          card.style.setProperty('--mb-x', `${event.clientX - rect.left}px`);
          card.style.setProperty('--mb-y', `${event.clientY - rect.top}px`);
          card.style.setProperty('--mb-near', '1');
        });
      }}
      onPointerLeave={() =>
        rootRef.current
          ?.querySelectorAll<HTMLElement>('[data-bento-card]')
          .forEach((card) => card.style.setProperty('--mb-near', '0'))
      }
    >
      {items.map((item) => (
        <article
          key={item.id}
          data-bento-card
          className={`relative isolate min-w-0 overflow-hidden rounded-16px bg-[var(--landing-surface)] p-6 min-[768px]:p-8 ${item.wide ? 'min-[768px]:col-span-2' : ''}`}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-3 rounded-inherit [box-shadow:inset_0_0_0_1px_var(--landing-border)]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-4 rounded-inherit p-px opacity-[var(--mb-near,0)] transition-opacity duration-200 [background:radial-gradient(260px_circle_at_var(--mb-x,-999px)_var(--mb-y,-999px),var(--color-accent),transparent)] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
          />
          <div className="relative z-2">{item.content}</div>
        </article>
      ))}
    </div>
  );
}
