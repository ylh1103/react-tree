import { useLayoutEffect } from 'react';

const scrollStoragePrefix = 'landing:scroll:';

/** 将刷新前的位置保存在当前标签页，在正文和页尾提交后、浏览器绘制前恢复。 */
export function useLandingScrollRestoration() {
  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const storageKey = scrollStoragePrefix + window.location.href;
    let target: number | null = null;
    try {
      const saved = Number(sessionStorage.getItem(storageKey));
      sessionStorage.removeItem(storageKey);
      if (navigation?.type === 'reload' && Number.isFinite(saved) && saved > 0) target = saved;
    } catch {
      // 禁用存储时仍允许页面正常滚动。
    }
    // 页尾随正文一起挂载，布局变短时由浏览器将目标限制在可滚动范围内。
    if (target !== null) window.scrollTo({ top: target, behavior: 'instant' });

    function save() {
      try {
        sessionStorage.setItem(scrollStoragePrefix + window.location.href, String(window.scrollY));
      } catch {
        // 页面离开时，存储受限不影响导航。
      }
    }

    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, []);
}
