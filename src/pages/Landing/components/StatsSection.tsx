import { CountUp } from '../reactbits/CountUp';
import { AnimatedContent } from '../reactbits/AnimatedContent';

const stats = [
  { label: '接入系统数', value: 328 },
  { label: '接入应用数', value: 2640 },
  { label: '参数项数', value: 125801 },
  { label: '参数发布次数', value: 116863 },
];

export function StatsSection() {
  return (
    <section aria-labelledby="stats-title" id="stats" className="scroll-mt-16 bg-[var(--lp-ink)]">
      <div className="mx-auto flex max-w-1200px flex-col gap-12 px-5 py-24 md:px-8">
        <AnimatedContent className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex flex-col gap-4">
            <p className="m-0 flex items-center gap-2 text-13px font-600 tracking-[0.2em] text-[#8fb8ff]">
              <span aria-hidden="true" className="h-2px w-6 bg-[var(--lp-red)]" />
              产品现状
            </p>
            <h2 id="stats-title" className="m-0 text-balance text-32px font-700 leading-tight text-[var(--lp-surface)] md:text-44px">
              行内规模化落地，持续稳定运行
            </h2>
          </div>
          <p className="m-0 text-13px text-[rgba(255,255,255,0.5)]">统计数据截止到 2025-03-03</p>
        </AnimatedContent>
        <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.08)] lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="flex flex-col gap-3 bg-[var(--lp-ink)] p-6 md:p-8">
              <dt className="text-14px text-[rgba(255,255,255,0.6)]">{item.label}</dt>
              <dd className="m-0 text-36px font-800 tracking-tight text-[var(--lp-surface)] md:text-52px">
                <CountUp to={item.value} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
