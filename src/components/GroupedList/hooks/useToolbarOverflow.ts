/** 按标题和真实按钮尺寸收纳次要操作；隐藏的操作仍可测量，避免收起后丢失回展依据。 */
import { useLayoutEffect, useRef, useState } from 'react';

/** 尺寸拖动回展预留 8px 防抖；筛选等内容变化时按新宽度重新判断，不沿用旧缓冲。 */
export function shouldCollapseToolbar(
  available: number,
  required: number,
  collapsed: boolean,
  previousRequired = required,
) {
  return available < required + (collapsed && required === previousRequired ? 8 : 0);
}

export function useToolbarOverflow() {
  const headerRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const secondaryRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    const header = headerRef.current;
    const heading = headingRef.current;
    const actions = actionsRef.current;
    const secondary = secondaryRef.current;
    const primary = primaryRef.current;
    if (!header || !heading || !actions || !secondary || !primary) return;

    let previousRequired: number | undefined;
    const measure = () => {
      const style = getComputedStyle(header);
      const available =
        header.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const required =
        heading.getBoundingClientRect().width +
        parseFloat(style.columnGap) +
        secondary.getBoundingClientRect().width +
        primary.getBoundingClientRect().width +
        parseFloat(getComputedStyle(actions).columnGap);
      // 在调用 updater 前保存本次测量快照，避免异步更新读取到后一次测量的宽度。
      const lastRequired = previousRequired;
      previousRequired = required;
      setCollapsed((previous) =>
        shouldCollapseToolbar(available, required, previous, lastRequired),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    [header, heading, actions, secondary, primary].forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return { collapsed, headerRef, headingRef, actionsRef, secondaryRef, primaryRef };
}
