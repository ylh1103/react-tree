import type { ReactNode } from 'react';

interface StageWindowProps {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 悬浮在首屏舞台上的仿桌面窗口外壳。 */
export function StageWindow({ title, meta, children, className }: StageWindowProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-solid border-[rgba(255,255,255,0.09)] bg-[rgba(12,12,16,0.84)] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl ${className ?? ''}`}
    >
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-b-solid border-[rgba(255,255,255,0.06)] px-4">
        <span aria-hidden="true" className="flex w-14 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.14)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.14)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.14)]" />
        </span>
        <span className="flex-1 truncate text-center font-mono text-12px text-[var(--lp-muted)]">{title}</span>
        <span className="w-14 text-right font-mono text-11px text-[var(--lp-muted)]">{meta}</span>
      </div>
      {children}
    </div>
  );
}
