import { motion } from 'motion/react';
import { useState } from 'react';

const published: Array<[string, string]> = [
  ['config.client.version', '2.3.1'],
  ['cc.route.appNamePrefixList[0]', 'CBTB'],
  ['cc.route.appNamePrefixList[1]', 'CBTF'],
  ['biz-proxy.read-timeout-ms', '20000'],
];

const runtimeByInstance: Record<string, string[]> = {
  '#101 · 55.8.126.74': ['2.3.1', 'CBTB', 'CBTF', '20000'],
  '#102 · 55.3.60.122': ['2.3.1', 'CBTB', '—', '10000'],
};

/** 运行时比对：切换实例，逐项对照运行时参数与平台已发布参数。 */
export function RuntimeDiff() {
  const names = Object.keys(runtimeByInstance);
  const [instance, setInstance] = useState(names[1]);
  const runtime = runtimeByInstance[instance];
  const mismatches = published.filter(([, value], index) => runtime[index] !== value).length;

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="选择实例" className="flex flex-wrap gap-2">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === instance}
            onClick={() => setInstance(name)}
            className={`cursor-pointer rounded-lg border border-solid px-3 py-1.5 font-mono text-12px transition-colors ${
              name === instance
                ? 'border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] text-[var(--lp-fg)]'
                : 'border-[var(--lp-line)] bg-transparent text-[var(--lp-muted)]'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-solid border-[var(--lp-line)]">
        <table className="w-full min-w-480px border-collapse text-left font-mono text-12px">
          <thead className="bg-[var(--lp-panel)] font-sans text-[var(--lp-muted)]">
            <tr>
              <th className="px-4 py-2.5 font-500">配置键</th>
              <th className="px-4 py-2.5 font-500">运行时</th>
              <th className="px-4 py-2.5 font-500">已发布</th>
            </tr>
          </thead>
          <tbody>
            {published.map(([key, value], index) => {
              const diff = runtime[index] !== value;
              return (
                <tr
                  key={key}
                  className={`border-t border-t-solid border-[var(--lp-line)] transition-colors duration-300 ${diff ? 'bg-[rgba(255,77,106,0.08)]' : ''}`}
                >
                  <td className="px-4 py-3 text-[#c6cbd6]">{key}</td>
                  <td className={`px-4 py-3 ${diff ? 'text-[var(--lp-red)]' : 'text-[var(--lp-muted)]'}`}>
                    <motion.span key={`${instance}-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {runtime[index]}
                    </motion.span>
                  </td>
                  <td className="px-4 py-3 text-[var(--lp-muted)]">{value}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p
        aria-live="polite"
        className={`m-0 flex items-center gap-2 text-13px ${mismatches ? 'text-[var(--lp-red)]' : 'text-[var(--lp-blue)]'}`}
      >
        <span aria-hidden="true" className={`h-4 w-4 ${mismatches ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'}`} />
        {mismatches ? `${mismatches} 项参数在该实例未生效` : '运行时参数与平台一致'}
      </p>
    </div>
  );
}
