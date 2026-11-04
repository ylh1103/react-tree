import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

const steps = ['保存参数', '生成快照', '发布快照', '热更新'];

interface ParamCardProps {
  title: string;
  rows: Array<[string, string, boolean?]>;
  active: boolean;
}

function ParamCard({ title, rows, active }: ParamCardProps) {
  return (
    <div
      className={`rounded-xl border border-solid p-3 font-mono text-12px transition-[border-color,background-color,opacity] duration-500 ${
        active
          ? 'border-[rgba(77,141,255,0.6)] bg-[rgba(77,141,255,0.1)] opacity-100'
          : 'border-[var(--lp-line)] bg-[var(--lp-panel)] opacity-60'
      }`}
    >
      <div className="mb-2 font-sans text-12px font-600 text-[var(--lp-fg)]">{title}</div>
      {rows.map(([key, value, highlight]) => (
        <div key={key} className="flex justify-between gap-3 leading-6">
          <span className="text-[var(--lp-muted)]">{key}</span>
          <span className={highlight ? 'text-[var(--lp-blue)]' : 'text-[#c6cbd6]'}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function FlowArrow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 md:w-16">
      <span className="font-mono text-11px text-[var(--lp-muted)]">{label}</span>
      <div className="relative h-8 w-px overflow-hidden bg-[var(--lp-line)] md:h-px md:w-full">
        <motion.span
          className="absolute inset-0 origin-top-left bg-[var(--lp-blue)]"
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

/** 参数版本化：应用参数与公共参数合并为快照，上传配置中心后热更新生效，步骤循环高亮。 */
export function VersionFlow() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % steps.length), 1600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const isActive = (target: number) => reduceMotion || step === target || (target === 2 && step === 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-2">
          <ParamCard title="应用参数" rows={[['key1', '1'], ['port', '8081']]} active={isActive(0)} />
          <ParamCard title="公共参数" rows={[['key2', '2'], ['port', '8080']]} active={isActive(0)} />
        </div>
        <FlowArrow label="合并" active={step === 1 && !reduceMotion} />
        <div className="flex-1">
          <ParamCard
            title="参数快照 #105"
            rows={[['key1', '1'], ['key2', '2'], ['port', '8081', true]]}
            active={isActive(1)}
          />
        </div>
        <FlowArrow label="上传" active={step === 2 && !reduceMotion} />
        <div className="flex-1">
          <ParamCard
            title="配置中心"
            rows={[['key1', '1'], ['key2', '2'], ['port', '8081']]}
            active={isActive(2)}
          />
        </div>
      </div>
      <ol className="m-0 grid list-none grid-cols-4 gap-2 p-0">
        {steps.map((label, index) => (
          <li key={label} className="flex flex-col gap-2">
            <span className="relative h-0.5 overflow-hidden rounded-full bg-[var(--lp-line)]">
              <span
                className={`absolute inset-0 origin-left bg-[var(--lp-blue)] transition-transform duration-500 ${
                  reduceMotion || index <= step ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            </span>
            <span
              className={`text-12px transition-colors md:text-13px ${index === step || reduceMotion ? 'text-[var(--lp-fg)]' : 'text-[var(--lp-muted)]'}`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
      <p className="m-0 font-mono text-12px text-[var(--lp-muted)]">同名参数以应用参数为准：port = 8081</p>
    </div>
  );
}
