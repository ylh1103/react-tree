/** 生成轻量 m 组件的入场参数；系统动态效果偏好变化时同步更新，不直接操作动画实例。 */
import { useSyncExternalStore } from 'react';
import type { HTMLMotionProps } from 'motion/react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(notify: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
}
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotion = () => true;
const entrance = {
  hero: { y: 16, blur: 8, duration: 1.1 },
};
const visible = { opacity: 1, y: 0, filter: 'blur(0px)' };

export function useLandingEntrance(
  preset: keyof typeof entrance,
): Pick<HTMLMotionProps<'header'>, 'initial' | 'animate' | 'transition'> {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
  const { y, blur, duration } = entrance[preset];
  return {
    initial: reducedMotion ? false : { opacity: 0, y, filter: `blur(${blur}px)` },
    animate: visible,
    transition: { duration: reducedMotion ? 0 : duration, ease: [0.23, 1, 0.32, 1] },
  };
}
