import { AnimatedContent } from '../reactbits/AnimatedContent';
import { CountUp } from '../reactbits/CountUp';
import { SectionHeading } from './SectionHeading';

const stats = [
  { label: '接入系统', value: 328 },
  { label: '接入应用', value: 2640 },
  { label: '参数项', value: 125801 },
  { label: '参数发布', value: 116863, unit: '次' },
];

export function StatsSection() {
  return (
    <section
      id="stats"
      aria-labelledby="stats-title"
      className="mx-auto max-w-1200px scroll-mt-24 px-4 pb-24 md:px-8 md:pb-32"
    >
      <SectionHeading id="stats-title" title="已在行内规模化落地。" description="统计数据截至 2025-03-03" />
      <AnimatedContent delay={0.1} className="mt-12">
        <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-solid border-[var(--lp-line)] bg-[var(--lp-line)] lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-3 bg-[var(--lp-bg)] p-6 md:p-8">
              <dt className="font-mono text-12px tracking-wider text-[var(--lp-muted)]">{stat.label}</dt>
              <dd className="m-0 flex items-baseline gap-1.5 text-30px font-700 tracking-tight md:text-44px">
                <CountUp to={stat.value} />
                {stat.unit && <span className="text-14px font-500 text-[var(--lp-muted)]">{stat.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </AnimatedContent>
    </section>
  );
}
