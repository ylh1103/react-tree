/** 移植自 React Bits「GradientText」：渐变色沿文字往返流动，背景裁剪到字形。 */
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface GradientTextProps {
  children: ReactNode;
  colors: string[];
  /** 单程流动时长，单位秒。 */
  animationSpeed?: number;
  className?: string;
}

export function GradientText({ children, colors, animationSpeed = 6, className }: GradientTextProps) {
  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent [-webkit-background-clip:text] ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${[...colors, colors[0]].join(', ')})`,
        backgroundSize: '300% 100%',
      }}
      initial={{ backgroundPosition: '0% 50%' }}
      animate={{ backgroundPosition: '100% 50%' }}
      transition={{
        duration: animationSpeed,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    >
      {children}
    </motion.span>
  );
}
