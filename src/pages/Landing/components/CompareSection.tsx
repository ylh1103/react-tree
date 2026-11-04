import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';

const commonPractices = [
  { platform: 'ACS 容器云', practice: '存放到 classpath 目录，跟随应用 Label 投产，或使用环境变量' },
  { platform: '金融交易云', practice: '自行管理或由平台管理 application.yml 文件，跟随应用 Label 投产' },
];

const benefits = [
  { title: '集中管理应用参数', body: '抽取共性参数，减少分散配置的复杂性。' },
  { title: '实时更新', body: '修改参数无需发布应用或重启应用，提高灵活性。' },
  { title: '版本控制', body: '记录每次参数的修改历史，支持快速回滚。' },
];

const concerns = [
  {
    title: '依赖性：应用启动强依赖配置中心',
    answer: '灵动参数服务配置中心高可用部署，客户端 SDK 支持文件故障转移。',
  },
  {
    title: '学习成本：需要一定的上手时间',
    answer: '5 分钟即可快速上手，使用参数管家完成参数修改。',
  },
];

export function CompareSection() {
  return (
    <section aria-labelledby="compare-title" id="compare" className="scroll-mt-16 bg-[var(--lp-surface)]">
      <div className="mx-auto flex max-w-1200px flex-col gap-12 px-5 py-24 md:px-8">
        <SectionHeading
          id="compare-title"
          eyebrow="方案对比"
          title="不使用配置中心 vs 使用配置中心"
          description="不使用配置中心时，参数通常随应用制品一同投产，修改一个值也要走完整的发布流程。"
        />
        <AnimatedContent>
          <dl className="m-0 grid gap-4 md:grid-cols-2">
            {commonPractices.map((item) => (
              <div key={item.platform} className="flex flex-col gap-1.5 rounded-2xl bg-[var(--lp-paper)] p-5">
                <dt className="text-14px font-600 text-[var(--lp-ink)]">{item.platform}</dt>
                <dd className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">{item.practice}</dd>
              </div>
            ))}
          </dl>
        </AnimatedContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <AnimatedContent className="flex flex-col gap-6 rounded-3xl border border-solid border-[rgba(22,119,255,0.3)] p-6 md:p-8">
            <h3 className="m-0 flex items-center gap-2 text-20px font-700 text-[var(--lp-blue)]">
              <span aria-hidden="true" className="i-lucide-circle-check h-5 w-5" />
              使用配置中心的好处
            </h3>
            <ul className="m-0 flex list-none flex-col gap-5 p-0">
              {benefits.map((item) => (
                <li key={item.title} className="flex flex-col gap-1">
                  <span className="text-16px font-600 text-[var(--lp-ink)]">{item.title}</span>
                  <span className="text-14px leading-relaxed text-[var(--lp-muted)]">{item.body}</span>
                </li>
              ))}
            </ul>
          </AnimatedContent>
          <AnimatedContent delay={0.1} className="flex flex-col gap-6 rounded-3xl border border-solid border-[rgba(239,47,79,0.3)] p-6 md:p-8">
            <h3 className="m-0 flex items-center gap-2 text-20px font-700 text-[var(--lp-red)]">
              <span aria-hidden="true" className="i-lucide-circle-alert h-5 w-5" />
              使用配置中心的顾虑，以及我们的解法
            </h3>
            <ul className="m-0 flex list-none flex-col gap-5 p-0">
              {concerns.map((item) => (
                <li key={item.title} className="flex flex-col gap-2">
                  <span className="text-16px font-600 text-[var(--lp-ink)]">{item.title}</span>
                  <span className="flex items-start gap-2 rounded-xl bg-[var(--lp-paper)] px-3.5 py-2.5 text-14px leading-relaxed text-[var(--lp-ink)]">
                    <span aria-hidden="true" className="i-lucide-corner-down-right mt-1 h-4 w-4 shrink-0 text-[var(--lp-blue)]" />
                    {item.answer}
                  </span>
                </li>
              ))}
            </ul>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
