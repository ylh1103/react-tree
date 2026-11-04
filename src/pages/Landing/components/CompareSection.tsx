import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';

const rows = [
  { topic: '参数存放', before: 'classpath、环境变量或自管 yml', after: '集中管理，抽取公共参数' },
  { topic: '生效方式', before: '随应用 Label 重新投产', after: '热更新，无需重启' },
  { topic: '变更追溯', before: '分散在各处，难以回溯', after: '每次修改留痕，一键回滚' },
  { topic: '可用性', before: '无外部依赖', after: '服务端高可用部署，SDK 文件故障转移' },
  { topic: '上手成本', before: '沿用现有习惯', after: '5 分钟上手' },
];

export function CompareSection() {
  return (
    <section
      id="compare"
      aria-labelledby="compare-title"
      className="mx-auto max-w-1200px scroll-mt-24 px-4 pb-24 md:px-8 md:pb-32"
    >
      <SectionHeading
        id="compare-title"
        title="为什么要用配置中心"
        description="ACS 容器云与金融交易云的常见做法，对比灵动参数管家。"
      />
      <AnimatedContent delay={0.1} className="mt-12 overflow-x-auto rounded-3xl border border-solid border-[var(--lp-line)]">
        <table className="w-full min-w-600px border-collapse text-left text-14px">
          <thead>
            <tr className="bg-[var(--lp-panel)] text-13px">
              <th scope="col" className="w-1/5 px-6 py-4 font-500 text-[var(--lp-muted)]">
                维度
              </th>
              <th scope="col" className="px-6 py-4 font-500 text-[var(--lp-muted)]">
                传统做法
              </th>
              <th scope="col" className="px-6 py-4 font-600 text-[var(--lp-fg)]">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--lp-blue)]" />
                  灵动参数管家
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.topic} className="border-t border-t-solid border-[var(--lp-line)]">
                <th scope="row" className="px-6 py-5 font-500 text-[var(--lp-fg)]">
                  {row.topic}
                </th>
                <td className="px-6 py-5 text-[var(--lp-muted)]">{row.before}</td>
                <td className="px-6 py-5 text-[var(--lp-fg)]">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="i-lucide-check h-4 w-4 shrink-0 text-[var(--lp-blue)]" />
                    {row.after}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AnimatedContent>
    </section>
  );
}
