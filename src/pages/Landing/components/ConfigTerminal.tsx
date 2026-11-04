/**
 * 首屏演示终端：循环展示“修改参数 → 生成快照 → 热更新生效”三个阶段。
 * 计时器只驱动演示阶段，卸载时清理；减弱动效偏好下停在最终阶段。
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type Phase = 'current' | 'diff' | 'applied';
const phases: Phase[] = ['current', 'diff', 'applied'];

const status: Record<Phase, { label: string; detail: string }> = {
  current: { label: '快照 #104', detail: '已发布至配置中心' },
  diff: { label: '快照 #105', detail: '合并生成 · 1 项变更待发布' },
  applied: { label: '热更新完成', detail: '2 / 2 实例已加载最新参数' },
};

type Line = { indent: number; key?: string; value?: string; comment?: string; diff?: boolean };

const lines: Line[] = [
  { indent: 0, key: 'bee' },
  { indent: 1, key: 'tracing' },
  { indent: 2, comment: '# 链路追踪埋点功能开关' },
  { indent: 2, key: 'enable', value: 'true' },
  { indent: 2, key: 'deployUnitId', value: "'LL57.CI02_CCC-BFF'" },
  { indent: 2, key: 'httpServer' },
  { indent: 3, key: 'urlPattern', value: "'/*'" },
  { indent: 3, key: 'samplingRate', diff: true },
  { indent: 0, key: 'biz-proxy' },
  { indent: 1, key: 'connect-timeout-ms', value: "'10000'" },
  { indent: 1, key: 'read-timeout-ms', value: "'20000'" },
];

const instances = ['10.3.60.122', '10.8.126.74'];

function usePhase() {
  const [index, setIndex] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? phases.length - 1 : 0,
  );
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % phases.length), 2800);
    return () => window.clearInterval(timer);
  }, []);
  return phases[index];
}

function CodeLine({ line, number, phase }: { line: Line; number: number; phase: Phase }) {
  const pad = { paddingLeft: `${line.indent * 1.25}rem` };
  const gutter = (
    <span aria-hidden="true" className="w-6 shrink-0 select-none text-right text-[rgba(255,255,255,0.25)]">
      {number}
    </span>
  );
  if (line.diff && phase === 'diff') {
    return (
      <>
        <div className="flex gap-4 bg-[rgba(239,47,79,0.16)]">
          {gutter}
          <span style={pad} className="text-[#ff8a9c]">
            {'- '}samplingRate: {"'1'"}
          </span>
        </div>
        <div className="flex gap-4 bg-[rgba(22,119,255,0.22)]">
          <span aria-hidden="true" className="w-6 shrink-0" />
          <span style={pad} className="text-[#9cc4ff]">
            {'+ '}samplingRate: {"'0.5'"}
          </span>
        </div>
      </>
    );
  }
  const value = line.diff ? (phase === 'current' ? "'1'" : "'0.5'") : line.value;
  return (
    <div className="flex gap-4">
      {gutter}
      <span style={pad}>
        {line.comment ? (
          <span className="text-[rgba(255,255,255,0.38)]">{line.comment}</span>
        ) : (
          <>
            <span className="text-[#8fb8ff]">{line.key}</span>
            <span className="text-[rgba(255,255,255,0.5)]">:</span>
            {value && <span className="text-[rgba(255,255,255,0.88)]"> {value}</span>}
          </>
        )}
      </span>
    </div>
  );
}

export function ConfigTerminal() {
  const phase = usePhase();
  return (
    <figure className="m-0 overflow-hidden rounded-2xl border border-solid border-[rgba(255,255,255,0.08)] bg-[var(--lp-ink)] shadow-[0_40px_80px_-30px_rgba(14,26,43,0.55)]">
      <figcaption className="sr-only">参数快照发布与热更新演示</figcaption>
      <div className="flex items-center justify-between border-b border-b-solid border-[rgba(255,255,255,0.08)] px-4 py-3">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-red)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--lp-blue)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[rgba(255,255,255,0.2)]" />
        </div>
        <span className="font-mono text-12px text-[rgba(255,255,255,0.55)]">application.yml · uat</span>
      </div>
      <pre className="m-0 overflow-hidden px-2 py-4 font-mono text-12.5px leading-6 text-[rgba(255,255,255,0.88)] md:text-13px">
        {lines.map((line, index) => (
          <CodeLine key={index} line={line} number={index + 1} phase={phase} />
        ))}
      </pre>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-t-solid border-[rgba(255,255,255,0.08)] px-4 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 text-13px"
            aria-live="polite"
          >
            <span
              className={`h-2 w-2 rounded-full ${phase === 'diff' ? 'bg-[var(--lp-red)]' : 'bg-[var(--lp-blue)]'}`}
            />
            <span className="font-600 text-[var(--lp-surface)]">{status[phase].label}</span>
            <span className="text-[rgba(255,255,255,0.55)]">{status[phase].detail}</span>
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-2">
          {instances.map((ip) => (
            <span
              key={ip}
              className={`rounded-md px-2 py-0.5 font-mono text-11px transition-colors duration-500 ${
                phase === 'applied'
                  ? 'bg-[rgba(22,119,255,0.25)] text-[#9cc4ff]'
                  : 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.45)]'
              }`}
            >
              {ip}
            </span>
          ))}
        </div>
      </div>
    </figure>
  );
}
