import { useEffect, useRef, useState } from 'react';
import { ActionButton } from '../ActionButton';

type Status = 'stale' | 'loading' | 'done';

const instances = [
  { ip: '55.3.60.122', zone: 'SZ' },
  { ip: '55.8.126.74', zone: 'SZ' },
  { ip: '55.9.12.33', zone: 'SH' },
];

const initialStatus: Status[] = instances.map(() => 'stale');

/** 热更新：可选全量或灰度一台，实例依次加载最新配置。 */
export function HotReloadPanel() {
  const [gray, setGray] = useState(false);
  const [status, setStatus] = useState<Status[]>(initialStatus);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const running = status.includes('loading');
  const touched = status.some((item) => item !== 'stale');

  function update(index: number, next: Status) {
    setStatus((current) => current.map((item, i) => (i === index ? next : item)));
  }

  function run() {
    const targets = gray ? [0] : instances.map((_, index) => index);
    targets.forEach((index, order) => {
      timers.current.push(window.setTimeout(() => update(index, 'loading'), order * 650));
      timers.current.push(window.setTimeout(() => update(index, 'done'), order * 650 + 700));
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="radiogroup"
          aria-label="更新范围"
          className="flex rounded-lg border border-solid border-[var(--lp-line)] bg-[var(--lp-bg)] p-0.5"
        >
          {[
            { value: false, label: '全部实例' },
            { value: true, label: '灰度 1 台' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={gray === option.value}
              disabled={running}
              onClick={() => {
                setGray(option.value);
                setStatus(initialStatus);
              }}
              className={`cursor-pointer rounded-md border-0 px-3 py-1 text-12px transition-colors ${
                gray === option.value
                  ? 'bg-[rgba(255,255,255,0.08)] text-[var(--lp-fg)]'
                  : 'bg-transparent text-[var(--lp-muted)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <ActionButton
          size="sm"
          disabled={running}
          onClick={touched ? () => setStatus(initialStatus) : run}
        >
          <span aria-hidden="true" className={`h-3.5 w-3.5 ${touched ? 'i-lucide-rotate-ccw' : 'i-lucide-zap'}`} />
          {touched ? '重置' : '热更新'}
        </ActionButton>
      </div>

      <div className="overflow-hidden rounded-xl border border-solid border-[var(--lp-line)]">
        <table className="w-full border-collapse text-left text-13px">
          <thead className="bg-[var(--lp-panel)] text-12px text-[var(--lp-muted)]">
            <tr>
              <th className="px-4 py-2.5 font-500">实例</th>
              <th className="px-4 py-2.5 font-500">机房</th>
              <th className="px-4 py-2.5 font-500">参数版本</th>
              <th className="px-4 py-2.5 text-right font-500">状态</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((instance, index) => (
              <tr key={instance.ip} className="border-t border-t-solid border-[var(--lp-line)]">
                <td className="px-4 py-3 font-mono text-12px">{instance.ip}</td>
                <td className="px-4 py-3 text-[var(--lp-muted)]">{instance.zone}</td>
                <td className="px-4 py-3 font-mono text-12px">
                  <span className={status[index] === 'done' ? 'text-[var(--lp-blue)]' : 'text-[var(--lp-muted)]'}>
                    {status[index] === 'done' ? '#105' : '#104'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-12px">
                  {status[index] === 'loading' && (
                    <span className="inline-flex items-center gap-1.5 text-[var(--lp-fg)]">
                      <span aria-hidden="true" className="i-lucide-loader-circle h-3.5 w-3.5 animate-spin" />
                      加载中
                    </span>
                  )}
                  {status[index] === 'done' && (
                    <span className="inline-flex items-center gap-1.5 text-[var(--lp-blue)]">
                      <span aria-hidden="true" className="i-lucide-check h-3.5 w-3.5" />
                      已生效
                    </span>
                  )}
                  {status[index] === 'stale' && <span className="text-[var(--lp-muted)]">待更新</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0 font-mono text-12px leading-relaxed text-[var(--lp-muted)]">
        需使用 @ConfigurationProperties，或在 @Value 所在类添加 @RefreshScope
      </p>
    </div>
  );
}
