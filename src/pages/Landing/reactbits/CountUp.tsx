/**
 * 移植自 React Bits「CountUp」：进入视口后从 0 缓动到目标值。
 * 数字直接写入 DOM 文本，避免每帧触发 React 渲染；读屏只读取最终值。
 */
import { animate, useInView } from 'motion/react';
import { useEffect, useRef } from 'react';

const formatter = new Intl.NumberFormat('en-US');

interface CountUpProps {
  to: number;
  /** 动画时长，单位秒。 */
  duration?: number;
  className?: string;
}

export function CountUp({ to, duration = 2.2, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });

  useEffect(() => {
    const node = ref.current;
    if (!inView || !node) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        node.textContent = formatter.format(Math.round(value));
      },
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{formatter.format(to)}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        0
      </span>
    </span>
  );
}
