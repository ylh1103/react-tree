import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';
import { PublishShowcase } from './PublishShowcase';
import { RuntimeShowcase } from './RuntimeShowcase';

const steps = [
  { title: '保存参数', body: '将业务应用或公共模块的参数保存到参数管家' },
  { title: '生成快照', body: '合并业务应用和公共模块的配置后生成静态快照' },
  { title: '发布快照', body: '将最终的参数上传到配置中心' },
  { title: '重启 / 热更新', body: '重启应用或一键热更新，使参数生效' },
];

const sources = [
  { name: '应用参数', lines: ['key1=1', 'port=8081'] },
  { name: '公共参数', lines: ['key2=2', 'port=8080'] },
];

function KeyValueCard({ name, lines, tone }: { name: string; lines: string[]; tone: 'plain' | 'accent' }) {
  return (
    <div
      className={`flex min-w-28 flex-col gap-1.5 rounded-xl border border-solid px-4 py-3 ${
        tone === 'accent'
          ? 'border-[var(--lp-blue)] bg-[rgba(22,119,255,0.06)]'
          : 'border-[var(--lp-line)] bg-[var(--lp-surface)]'
      }`}
    >
      <span className="text-12px font-600 text-[var(--lp-ink)]">{name}</span>
      {lines.map((line) => (
        <code key={line} className="font-mono text-12px text-[var(--lp-muted)]">
          {line}
        </code>
      ))}
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 text-11px font-600 text-[var(--lp-red)]">
      {label}
      <span aria-hidden="true" className="i-lucide-arrow-right h-5 w-5" />
    </div>
  );
}

export function WorkflowSection() {
  return (
    <section aria-labelledby="workflow-title" id="workflow" className="scroll-mt-16 bg-[var(--lp-surface)]">
      <div className="mx-auto flex max-w-1200px flex-col gap-14 px-5 py-24 md:px-8">
        <SectionHeading
          id="workflow-title"
          eyebrow="核心功能"
          title="像管理代码一样管理参数"
          description="参考应用版本管理，方便追溯变更历史，以及不同环境、不同版本之间的参数比对。"
        />

        <AnimatedContent className="flex flex-col gap-8 rounded-3xl border border-solid border-[var(--lp-line)] bg-[var(--lp-paper)] p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              {sources.map((item) => (
                <KeyValueCard key={item.name} name={item.name} lines={item.lines} tone="plain" />
              ))}
            </div>
            <FlowArrow label="合并" />
            <KeyValueCard name="参数快照" lines={['key1=1', 'key2=2', 'port=8081']} tone="accent" />
            <FlowArrow label="上传" />
            <KeyValueCard name="配置中心" lines={['key1=1', 'key2=2', 'port=8081']} tone="plain" />
            <p className="m-0 max-w-300px text-14px leading-relaxed text-[var(--lp-muted)] lg:ml-auto">
              应用参数优先级高于公共参数，同名键
              <code className="mx-1 rounded bg-[var(--lp-surface)] px-1.5 py-0.5 font-mono text-12px text-[var(--lp-ink)]">
                port
              </code>
              以应用配置为准，合并结果固化为不可变快照。
            </p>
          </div>

          <ol className="m-0 grid list-none gap-4 p-0 md:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="relative flex flex-col gap-2 rounded-2xl bg-[var(--lp-surface)] p-5">
                <span className="font-mono text-12px text-[var(--lp-blue)]">STEP {index + 1}</span>
                <h3 className="m-0 text-17px font-700 text-[var(--lp-ink)]">{step.title}</h3>
                <p className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">{step.body}</p>
              </li>
            ))}
          </ol>

          <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2 text-13px text-[var(--lp-muted)]">
            <span className="font-600 text-[var(--lp-ink)]">类比应用版本管理</span>
            <span>源代码</span>
            <span aria-hidden="true" className="i-lucide-chevron-right h-3.5 w-3.5" />
            <span>构建 & 发布制品库</span>
            <span aria-hidden="true" className="i-lucide-chevron-right h-3.5 w-3.5" />
            <span>发布 Label</span>
          </p>
        </AnimatedContent>

        <div className="grid gap-6 lg:grid-cols-2">
          <PublishShowcase />
          <RuntimeShowcase />
        </div>
      </div>
    </section>
  );
}
