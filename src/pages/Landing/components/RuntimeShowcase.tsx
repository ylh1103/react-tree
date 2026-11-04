import { AnimatedContent } from '../reactbits/AnimatedContent';

const instances = [
  { no: 102, ip: '10.3.60.122', time: '2024-04-13 15:21', diff: 0 },
  { no: 101, ip: '10.8.126.74', time: '2024-04-13 15:21', diff: 2 },
];

const diffs = [
  { key: 'config.client.version', runtime: '1.2.0', platform: '1.3.0' },
  { key: 'ccc.route.appNamePrefixList[1]', runtime: '—', platform: 'cbtb-core' },
];

export function RuntimeShowcase() {
  return (
    <AnimatedContent delay={0.1} className="flex flex-col gap-6 rounded-3xl border border-solid border-[var(--lp-line)] p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-22px font-700 text-[var(--lp-ink)]">热更新 & 运行时参数可视化</h3>
        <p className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">
          触发后即可加载最新配置；逐实例比对运行时参数与平台已发布参数的差异，精准定位未生效项。
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-solid border-[var(--lp-line)]">
        <table className="w-full border-collapse text-left text-12px">
          <thead className="bg-[var(--lp-paper)] text-[var(--lp-muted)]">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-500">实例</th>
              <th scope="col" className="px-4 py-2.5 font-500">检查时间</th>
              <th scope="col" className="px-4 py-2.5 font-500">差异</th>
              <th scope="col" className="px-4 py-2.5 text-right font-500">操作</th>
            </tr>
          </thead>
          <tbody className="text-[var(--lp-ink)]">
            {instances.map((row) => (
              <tr key={row.no} className="border-t border-t-solid border-[var(--lp-line)]">
                <td className="px-4 py-3 font-mono">{row.ip}</td>
                <td className="px-4 py-3 font-mono text-[var(--lp-muted)]">{row.time}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono ${
                      row.diff ? 'bg-[rgba(239,47,79,0.1)] text-[var(--lp-red)]' : 'text-[var(--lp-muted)]'
                    }`}
                  >
                    {row.diff}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-[var(--lp-blue)]">热更新</span>
                  <span className="mx-2 text-[var(--lp-line)]">|</span>
                  <span className="text-[var(--lp-blue)]">运行时比对</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col gap-2 border-t border-t-solid border-[var(--lp-line)] bg-[var(--lp-ink)] px-4 py-4 font-mono text-12px">
          <span className="text-[rgba(255,255,255,0.5)]"># 10.8.126.74 运行时 vs 平台已发布</span>
          {diffs.map((item) => (
            <div key={item.key} className="flex flex-wrap gap-x-3">
              <span className="text-[#8fb8ff]">{item.key}</span>
              <span className="text-[#ff8a9c]">{item.runtime}</span>
              <span aria-hidden="true" className="text-[rgba(255,255,255,0.4)]">→</span>
              <span className="text-[rgba(255,255,255,0.88)]">{item.platform}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="m-0 text-12px leading-relaxed text-[var(--lp-muted)]">
        热更新需满足任一条件：配置类使用 <code className="font-mono text-[var(--lp-ink)]">@ConfigurationProperties</code>{' '}
        注解，或 <code className="font-mono text-[var(--lp-ink)]">@Value</code> 所在类添加{' '}
        <code className="font-mono text-[var(--lp-ink)]">@RefreshScope</code>。
      </p>
    </AnimatedContent>
  );
}
