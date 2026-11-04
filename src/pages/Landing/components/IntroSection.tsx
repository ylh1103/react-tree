import { AnimatedContent } from '../reactbits/AnimatedContent';
import { SectionHeading } from './SectionHeading';

const statement = [
  { label: '为', text: [{ t: '行内' }, { t: '开发人员', hl: true }] },
  { label: '提供', text: [{ t: '一款' }, { t: '技术参数', hl: true }, { t: '管理的' }, { t: '工具集', hl: true }] },
  {
    label: '目的是',
    text: [{ t: '降低参数修改的' }, { t: '风险', hl: true }, { t: '，提升操作' }, { t: '效率', hl: true }],
  },
];

const capabilities = [
  {
    icon: 'i-lucide-rocket',
    title: '自动化发布与回退',
    body: '实现参数自动化发布、回退，降低人工核对成本和操作风险。',
  },
  {
    icon: 'i-lucide-git-compare',
    title: '可视化、版本化管理',
    body: '参数变更可对比、可追溯，便于分析每一次修改带来的影响。',
  },
  {
    icon: 'i-lucide-shield-check',
    title: '高容错能力',
    body: '参数管理工具及配置中心出现异常时，不影响业务系统正常运行。',
  },
  {
    icon: 'i-lucide-blocks',
    title: '通用化、开放化',
    body: '方案通用且开放，支持在不同团队、不同应用间快速复用。',
  },
];

export function IntroSection() {
  return (
    <section aria-labelledby="intro-title" className="scroll-mt-16 bg-[var(--lp-surface)]" id="intro">
      <div className="mx-auto flex max-w-1200px flex-col gap-14 px-5 py-24 md:px-8">
        <SectionHeading id="intro-title" eyebrow="产品简介" title="让每一次参数修改，都有据可依" />
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <AnimatedContent className="flex flex-col gap-6">
            {statement.map((row) => (
              <p key={row.label} className="m-0 flex items-baseline gap-5 text-22px leading-snug md:text-28px">
                <span className="w-20 shrink-0 text-16px font-700 text-[var(--lp-red)] md:text-18px">{row.label}</span>
                <span className="text-[var(--lp-ink)]">
                  {row.text.map((part, index) =>
                    part.hl ? (
                      <strong key={index} className="font-700 text-[var(--lp-blue)]">
                        {part.t}
                      </strong>
                    ) : (
                      <span key={index}>{part.t}</span>
                    ),
                  )}
                </span>
              </p>
            ))}
          </AnimatedContent>
          <ul className="m-0 grid list-none gap-px overflow-hidden rounded-2xl border border-solid border-[var(--lp-line)] bg-[var(--lp-line)] p-0 sm:grid-cols-2">
            {capabilities.map((item, index) => (
              <li key={item.title} className="bg-[var(--lp-surface)]">
                <AnimatedContent delay={index * 0.08} distance={16} className="flex h-full flex-col gap-3 p-6">
                  <span aria-hidden="true" className={`${item.icon} h-5 w-5 text-[var(--lp-blue)]`} />
                  <h3 className="m-0 text-16px font-600 text-[var(--lp-ink)]">{item.title}</h3>
                  <p className="m-0 text-14px leading-relaxed text-[var(--lp-muted)]">{item.body}</p>
                </AnimatedContent>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
