/** 一键发布与回退演示：点击历史快照即可切换“回退目标”，纯展示状态留在组件内。 */
import { useState } from 'react';
import { AnimatedContent } from '../reactbits/AnimatedContent';

const snapshots = [
  { id: 105, time: '2024-09-12 17:18', note: '修改每次批量写入数量为 1000', current: true },
  { id: 104, time: '2024-09-12 17:16', note: '是否支持重复处理改为否' },
  { id: 103, time: '2024-09-12 17:03', note: '每次批量写入次数为 5' },
  { id: 102, time: '2024-09-12 16:36', note: 'F012 是否支持处理改为是' },
];

export function PublishShowcase() {
  const [target, setTarget] = useState(103);
  return (
    <AnimatedContent className="flex flex-col gap-6 rounded-3xl border border-solid border-[var(--lp-line)] p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-22px font-700 text-[var(--lp-ink)]">参数一键发布 & 回退</h3>
        <p className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">
          将参数发布到配置中心，支持办公网查询与提权后发布生产参数；选择任一历史快照即可快速回退。
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-solid border-[var(--lp-line)] bg-[var(--lp-paper)]">
        <div className="flex items-center justify-between border-b border-b-solid border-[var(--lp-line)] px-4 py-2.5 text-12px text-[var(--lp-muted)]">
          <span>快照版本列表</span>
          <span className="font-mono">CBTF · st</span>
        </div>
        <ul className="m-0 flex list-none flex-col p-1.5" aria-label="历史快照">
          {snapshots.map((item) => {
            const selected = item.id === target;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setTarget(item.id)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-colors ${
                    selected ? 'bg-[var(--lp-surface)] shadow-sm' : 'bg-transparent hover:bg-[rgba(14,26,43,0.04)]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`i-lucide-history h-4 w-4 shrink-0 ${selected ? 'text-[var(--lp-blue)]' : 'text-[var(--lp-muted)]'}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-13px text-[var(--lp-ink)]">{item.note}</span>
                    <span className="font-mono text-11px text-[var(--lp-muted)]">{item.time}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-11px ${
                      item.current
                        ? 'bg-[rgba(22,119,255,0.1)] text-[var(--lp-blue)]'
                        : 'text-[var(--lp-muted)]'
                    }`}
                  >
                    #{item.id}
                    {item.current ? ' 当前' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t border-t-solid border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 py-3">
          <span className="text-13px text-[var(--lp-muted)]">
            {target === 105 ? '当前已是最新快照' : `回退至 #${target}，差异预览后一键发布`}
          </span>
          <span
            className={`rounded-lg px-3 py-1 text-12px font-600 ${
              target === 105
                ? 'bg-[rgba(14,26,43,0.06)] text-[var(--lp-muted)]'
                : 'bg-[var(--lp-red)] text-[var(--lp-surface)]'
            }`}
          >
            {target === 105 ? '已发布' : '一键回退'}
          </span>
        </div>
      </div>
    </AnimatedContent>
  );
}
