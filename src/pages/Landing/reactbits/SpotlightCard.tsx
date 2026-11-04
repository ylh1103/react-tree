/** 移植自 React Bits「SpotlightCard」：指针位置跟随一圈柔光，离开后淡出。 */
import { useRef, type MouseEvent, type ReactNode } from 'react';

interface SpotlightCardProps {
  children: ReactNode;
  spotlightColor: string;
  className?: string;
}

export function SpotlightCard({ children, spotlightColor, className }: SpotlightCardProps) {
  const lightRef = useRef<HTMLDivElement>(null);

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    const light = lightRef.current;
    if (!light) return;
    const rect = event.currentTarget.getBoundingClientRect();
    light.style.background = `radial-gradient(320px circle at ${event.clientX - rect.left}px ${event.clientY - rect.top}px, ${spotlightColor}, transparent 70%)`;
  }

  return (
    <div onMouseMove={handleMove} className={`group relative overflow-hidden ${className ?? ''}`}>
      <div
        ref={lightRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
