import { useEffect, useState, type RefObject } from 'react';

/** 仅对挂载的虚拟行测量；每次提交后测量内容，观察器仅跟踪元素宽度变化。 */
export function useOverflow(refs: RefObject<HTMLSpanElement | null>[], content: unknown[]) {
  const [overflowing, setOverflowing] = useState(false);
  // 用内容签名稳定 effect 依赖，避免行重渲染时反复重建观察器。
  const signature = JSON.stringify(content);
  const first = refs[0];
  const second = refs[1];
  useEffect(() => {
    const elements = [first.current, second?.current].filter(
      (element): element is HTMLSpanElement => element != null,
    );
    const measure = () =>
      setOverflowing(elements.some((element) => element.scrollWidth > element.clientWidth));
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    elements.forEach((element) => observer.observe(element));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [first, second, signature]);
  return overflowing;
}
