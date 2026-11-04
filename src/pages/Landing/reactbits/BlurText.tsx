/** 移植自 React Bits「BlurText」：逐字从模糊上移到清晰，进入视口时只播放一次。 */
import { motion } from 'motion/react';

interface BlurTextProps {
  text: string;
  /** 相邻字符的启动间隔，单位毫秒。 */
  delay?: number;
  className?: string;
}

export function BlurText({ text, delay = 60, className }: BlurTextProps) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            className="inline-block will-change-[transform,filter,opacity]"
            initial={{ opacity: 0, filter: 'blur(12px)', y: -28 }}
            whileInView={{
              opacity: [0, 0.5, 1],
              filter: ['blur(12px)', 'blur(4px)', 'blur(0px)'],
              y: [-28, 4, 0],
            }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, times: [0, 0.5, 1], delay: (index * delay) / 1000 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
