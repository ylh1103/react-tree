import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { snapshots } from '../../data';

/** 发布与回退：点击任一历史快照即可将其设为生效版本。 */
export function RollbackTimeline() {
  const [liveId, setLiveId] = useState(105);
  const [lastAction, setLastAction] = useState<string | null>(null);

  function activate(id: number) {
    setLastAction(id < liveId ? `已回退到 #${id}` : `已发布 #${id}`);
    setLiveId(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="m-0 flex list-none flex-col gap-1 p-0">
        {snapshots.map((snapshot) => {
          const live = snapshot.id === liveId;
          return (
            <li
              key={snapshot.id}
              className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 md:gap-4 md:px-4"
            >
              {live && (
                <motion.span
                  layoutId="rollback-live"
                  className="absolute inset-0 rounded-xl border border-solid border-[rgba(77,141,255,0.45)] bg-[rgba(77,141,255,0.1)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative font-mono text-13px text-[var(--lp-fg)]">#{snapshot.id}</span>
              <span className="relative min-w-0 flex-1 truncate text-13px text-[var(--lp-muted)] md:text-14px">
                {snapshot.message}
              </span>
              {live ? (
                <span className="relative flex items-center gap-1.5 text-12px font-600 text-[var(--lp-blue)]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--lp-blue)]" />
                  生效中
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => activate(snapshot.id)}
                  className="relative cursor-pointer rounded-lg border border-solid border-[var(--lp-line)] bg-transparent px-2.5 py-1 text-12px text-[var(--lp-fg)] transition-colors hover:border-[rgba(255,255,255,0.25)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--lp-blue)]"
                >
                  {snapshot.id < liveId ? '回退至此' : '发布'}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex h-6 items-center px-3 font-mono text-12px md:px-4" aria-live="polite">
        <AnimatePresence mode="wait">
          {lastAction ? (
            <motion.span
              key={lastAction}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-[var(--lp-blue)]"
            >
              {`✓ ${lastAction} · 配置中心已同步`}
            </motion.span>
          ) : (
            <span className="text-[var(--lp-muted)]">试试点击「回退至此」</span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
