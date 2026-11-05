/** 风险说明与流程解释器：仅切换示意，不调用发布、回退或配置写入接口。 */
import { useRef, useState } from 'react';
import SpotlightCard from './components/SpotlightCard';
import { risks, steps } from './content';
import { muted, SampleNote, section, SectionHeading } from './ui';
import type { ResolvedThemeMode } from '@/types/preferences';
function RiskDetail({ index }: { index: number }) {
  const risk = risks[index];
  return (
    <div className="flex min-h-270px flex-col justify-between gap-6">
      <div>
        <span
          aria-hidden="true"
          className={`${risk.icon} mb-5 text-28px text-[var(--landing-link)]`}
        />
        <h3 className="mb-3 mt-0 text-22px leading-[1.5]">{risk.heading}</h3>
        <div className="my-5 rounded-10px border border-solid border-[var(--landing-border)] bg-[var(--landing-canvas)] p-4 font-mono text-14px leading-[1.8]">
          {risk.detail}
        </div>
        <p className={`text-14px leading-[1.8] ${muted}`}>{risk.note}</p>
      </div>
      <div>
        <p className={`m-0 text-12px leading-[1.8] ${muted}`}>
          示例用于解释能力，实际规则及处理方式以产品版本为准。
        </p>
        <SampleNote />
      </div>
    </div>
  );
}
export function RiskSection({ theme }: { theme: ResolvedThemeMode }) {
  const [selected, setSelected] = useState(0);
  return (
    <section id="capabilities" className={section} aria-labelledby="risk-title">
      <div id="risk-title">
        <SectionHeading
          title="把常见参数问题，提前暴露出来。"
          description="从修改到生效，先看见那些容易遗漏的环节。"
        />
      </div>
      <div className="hidden grid-cols-[2fr_3fr] items-stretch gap-8 min-[768px]:grid">
        <div className="flex flex-col gap-3">
          {risks.map((risk, index) => (
            <button
              key={risk.title}
              type="button"
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={`flex min-h-96px cursor-pointer items-start gap-4 rounded-12px border border-solid p-5 text-left text-inherit transition-[background-color,border-color] duration-200 ${selected === index ? 'border-accent bg-[var(--landing-raised)]' : 'border-[var(--landing-border)] bg-transparent hover:bg-[var(--landing-surface)]'}`}
            >
              <span
                aria-hidden="true"
                className={`${risk.icon} mt-1 shrink-0 text-20px ${selected === index ? 'text-[var(--landing-link)]' : muted}`}
              />
              <span>
                <span className="block text-16px font-600 leading-[1.7]">{risk.title}</span>
                <span className={`mt-2 block text-14px leading-[1.7] ${muted}`}>
                  {risk.summary}
                </span>
              </span>
            </button>
          ))}
        </div>
        <SpotlightCard theme={theme} spotlightColor="var(--color-accent)" intensity={0.06}>
          <div key={selected} className="animate-[landing-detail_180ms_ease-out]">
            <RiskDetail index={selected} />
          </div>
        </SpotlightCard>
      </div>
      <div className="grid gap-5 min-[768px]:hidden">
        {risks.map((risk, index) => (
          <article key={risk.title}>
            <h3 className="mb-3 text-18px leading-[1.6]">{risk.title}</h3>
            <p className={`text-14px leading-[1.7] ${muted}`}>{risk.summary}</p>
            <SpotlightCard theme={theme}>
              <RiskDetail index={index} />
            </SpotlightCard>
          </article>
        ))}
      </div>
    </section>
  );
}
function StepDetail({ index }: { index: number }) {
  const step = steps[index];
  return (
    <div className="flex min-h-290px flex-col justify-between gap-8 rounded-14px border border-solid border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 min-[768px]:p-8">
      <div>
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className={`text-13px ${muted}`}>{step.label}</span>
          <span
            aria-hidden="true"
            className="i-lucide-layers text-24px text-[var(--landing-link)]"
          />
        </div>
        <p className="text-16px font-600 leading-[1.7]">{step.detail}</p>
        <div className="my-5 overflow-x-auto rounded-8px bg-[var(--landing-raised)] p-4 font-mono text-14px leading-[1.8]">
          {step.code}
        </div>
        <p className={`text-14px leading-[1.8] ${muted}`}>{step.note}</p>
      </div>
      <SampleNote />
    </div>
  );
}
export function WorkflowSection() {
  const [selected, setSelected] = useState(0),
    [cursor, setCursor] = useState(0);
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <section id="workflow" className={section} aria-labelledby="workflow-title">
      <div id="workflow-title">
        <SectionHeading
          title="从参数修改到生效，每一步都有依据。"
          description="参数保存、快照生成、发布与生效确认分别呈现，变更过程更清晰。"
        />
      </div>
      <div className="hidden grid-cols-[.42fr_.58fr] items-start gap-8 min-[768px]:grid">
        <div
          role="tablist"
          aria-label="参数变更流程"
          aria-orientation="vertical"
          className="flex flex-col"
        >
          {steps.map((step, index) => (
            <button
              key={step.title}
              ref={(element) => {
                tabsRef.current[index] = element;
              }}
              id={`workflow-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected === index}
              aria-controls="workflow-detail"
              tabIndex={cursor === index ? 0 : -1}
              onFocus={() => setCursor(index)}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                let next: number | undefined;
                if (event.key === 'ArrowDown') next = (index + 1) % steps.length;
                if (event.key === 'ArrowUp') next = (index + steps.length - 1) % steps.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = steps.length - 1;
                if (next !== undefined) {
                  event.preventDefault();
                  tabsRef.current[next]?.focus();
                }
              }}
              className={`flex min-h-105px cursor-pointer items-start gap-4 border-0 border-b border-b-solid border-[var(--landing-border)] py-5 pr-4 text-left text-inherit transition-colors ${selected === index ? 'bg-[var(--landing-surface)]' : 'bg-transparent hover:bg-[var(--landing-surface)]'}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-32px w-32px shrink-0 items-center justify-center rounded-full text-13px ${selected === index ? 'bg-accent text-[var(--landing-on-accent)]' : 'bg-[var(--landing-raised)]'}`}
              >
                0{index + 1}
              </span>
              <span>
                <span className="text-17px font-600">{step.title}</span>
                {selected === index && (
                  <span className="ml-3 text-12px text-[var(--landing-link)]">正在查看</span>
                )}
                <span className={`mt-2 block text-14px leading-[1.7] ${muted}`}>
                  {step.summary}
                </span>
              </span>
            </button>
          ))}
        </div>
        <div
          id="workflow-detail"
          role="tabpanel"
          aria-labelledby={`workflow-tab-${selected}`}
          tabIndex={0}
        >
          <div key={selected} className="animate-[landing-detail_180ms_ease-out]">
            <StepDetail index={selected} />
          </div>
        </div>
      </div>
      <ol className="m-0 grid list-none gap-6 p-0 min-[768px]:hidden">
        {steps.map((step, index) => (
          <li key={step.title}>
            <h3 className="text-20px">
              0{index + 1} / {step.title}
            </h3>
            <p className={`text-15px leading-[1.8] ${muted}`}>{step.summary}</p>
            <StepDetail index={index} />
          </li>
        ))}
      </ol>
      <p className={`mb-0 mt-6 text-14px leading-[1.8] ${muted}`}>
        保存集中配置 → 生成完整快照 → 发布选定版本 →
        按接入条件确认生效。示意仅作讲解，不执行真实发布。
      </p>
    </section>
  );
}
