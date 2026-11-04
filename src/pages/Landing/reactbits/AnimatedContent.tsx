/** 移植自 React Bits「AnimatedContent」：内容进入视口时上移淡入，只播放一次。 */
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface AnimatedContentProps {
  children: ReactNode;
  /** 启动延迟，单位秒，用于同组内容错开出现。 */
  delay?: number;
  distance?: number;
  className?: string;
}

export function AnimatedContent({ children, delay = 0, distance = 32, className }: AnimatedContentProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
