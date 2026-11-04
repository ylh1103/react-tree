/** 移植自 React Bits「ShinyText」：一道高光周期性扫过文字。 */
import { motion } from 'motion/react';

interface ShinyTextProps {
  text: string;
  baseColor: string;
  shineColor: string;
  /** 扫过一次的时长，单位秒。 */
  speed?: number;
  className?: string;
}

export function ShinyText({ text, baseColor, shineColor, speed = 3, className }: ShinyTextProps) {
  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent [-webkit-background-clip:text] ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(110deg, ${baseColor} 40%, ${shineColor} 50%, ${baseColor} 60%)`,
        backgroundSize: '200% 100%',
      }}
      initial={{ backgroundPosition: '100% 50%' }}
      animate={{ backgroundPosition: '-100% 50%' }}
      transition={{ duration: speed, ease: 'linear', repeat: Infinity, repeatDelay: 0.6 }}
    >
      {text}
    </motion.span>
  );
}
