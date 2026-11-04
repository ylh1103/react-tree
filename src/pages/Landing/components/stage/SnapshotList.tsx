import { motion } from 'motion/react';
import { snapshots, type Snapshot } from '../../data';
import { ActionButton } from '../ActionButton';
import { StageWindow } from './StageWindow';

interface SnapshotListProps {
  selected: Snapshot;
  published: Snapshot;
  onSelect: (id: number) => void;
  onPublish: () => void;
}

export function SnapshotList({ selected, published, onSelect, onPublish }: SnapshotListProps) {
  const isRollback = selected.id < published.id;
  const label =
    selected.id === published.id ? '当前已生效' : isRollback ? `回退到 #${selected.id}` : `发布 #${selected.id}`;

  return (
    <StageWindow title="快照版本" meta={`${snapshots.length} 个`}>
      <div role="radiogroup" aria-label="选择参数快照" className="flex flex-col gap-0.5 p-2">
        {snapshots.map((snapshot) => {
          const active = snapshot.id === selected.id;
          return (
            <button
              key={snapshot.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(snapshot.id)}
              className="relative flex cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left text-[var(--lp-fg)] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-[var(--lp-blue)]"
            >
              {active && (
                <motion.span
                  layoutId="snapshot-active"
                  className="absolute inset-0 rounded-lg border border-solid border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                aria-hidden="true"
                className={`relative h-2 w-2 shrink-0 rounded-full ${snapshot.id === published.id ? 'bg-[var(--lp-blue)]' : 'bg-[rgba(255,255,255,0.18)]'}`}
              />
              <span className="relative w-10 shrink-0 font-mono text-13px">#{snapshot.id}</span>
              <span className="relative min-w-0 flex-1 truncate text-13px">{snapshot.message}</span>
              <span className="relative shrink-0 font-mono text-11px text-[var(--lp-muted)]">
                {snapshot.id === published.id ? '生效中' : snapshot.time}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-t-solid border-[rgba(255,255,255,0.06)] px-4 py-3">
        <span className="text-12px text-[var(--lp-muted)]">点选快照对比参数差异</span>
        <ActionButton size="sm" onClick={onPublish} disabled={selected.id === published.id}>
          {label}
        </ActionButton>
      </div>
    </StageWindow>
  );
}
