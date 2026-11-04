import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { StageWindow } from './StageWindow';

export interface TerminalScript {
  command: string;
  output: Array<{ text: string; tone: 'info' | 'success' }>;
}

/** 终端窗口：外层用 key 切换脚本，内部状态随新脚本从头开始打字。 */
export function PublishTerminal({ script, runKey }: { script: TerminalScript; runKey: number }) {
  return (
    <StageWindow title="Terminal" meta="uat">
      <TerminalBody key={runKey} script={script} />
    </StageWindow>
  );
}

function TerminalBody({ script }: { script: TerminalScript }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(reduceMotion ? script.command.length : 0);
  const [shown, setShown] = useState(reduceMotion ? script.output.length : 0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const timers: number[] = [];
    let index = 0;
    const typeNext = () => {
      index += 1;
      setTyped(index);
      if (index < script.command.length) {
        timers.push(window.setTimeout(typeNext, 26));
        return;
      }
      script.output.forEach((_, line) => {
        timers.push(window.setTimeout(() => setShown(line + 1), 380 + line * 420));
      });
    };
    timers.push(window.setTimeout(typeNext, 250));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, reduceMotion, script]);

  const typing = typed < script.command.length;

  return (
    <div ref={ref} className="flex min-h-36 flex-col gap-1.5 p-4 font-mono text-12px leading-relaxed md:text-13px">
      <div className="flex break-all">
        <span className="mr-2 text-[var(--lp-muted)]">$</span>
        <span className="text-[var(--lp-fg)]">{script.command.slice(0, typed)}</span>
        {(typing || shown === script.output.length) && (
          <motion.span
            aria-hidden="true"
            className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-[var(--lp-fg)]"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </div>
      {script.output.slice(0, shown).map((line) => (
        <motion.div
          key={line.text}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className={line.tone === 'success' ? 'text-[var(--lp-blue)]' : 'text-[var(--lp-muted)]'}
        >
          {line.tone === 'success' ? '✓ ' : '› '}
          {line.text}
        </motion.div>
      ))}
    </div>
  );
}
