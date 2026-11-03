/**
 * 全局导航进度：订阅唯一 Router，统一覆盖 middleware、loader、重定向及取消等待。
 * 首次初始化沿用启动画面；后续导航共用 NProgress，不因目标变化反复启动或提前结束。
 */
import NProgress from 'nprogress';
import type { DataRouter } from 'react-router';

type NavigationProgress = Pick<typeof NProgress, 'configure' | 'start' | 'done' | 'remove'>;

/** 返回入口/HMR 的清理函数；可注入驱动以验证真实路由状态与进度条生命周期。 */
export function startRouteProgress(router: DataRouter, progress: NavigationProgress = NProgress) {
  progress.configure({
    showSpinner: false,
    // 起步即有可见长度，随后低频推进；缓出曲线减轻每次增量的跳动感。
    minimum: 0.12,
    speed: 280,
    trickleSpeed: 450,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    // 8px 容器为 2px 细线和末端柔光留出空间；位移和完成淡出仍由 NProgress 管理。
    // 外观仅用局部 UnoCSS 工具类，不新增样式表或全局 shortcuts。
    template: `
      <div class="pointer-events-none fixed inset-x-0 top-0 z-2000 h-8px overflow-hidden" role="status" aria-live="polite" aria-atomic="true">
        <div role="bar" aria-hidden="true" class="absolute left-0 top-0 h-2px w-full rounded-r-full bg-accent [box-shadow:0_0_4px_var(--color-accent)]">
          <span class="absolute right-0 top-0 h-full w-60px rounded-full bg-accent-text opacity-60 [box-shadow:0_0_8px_var(--color-accent)]"></span>
        </div>
        <span class="sr-only">正在打开页面…</span>
      </div>`,
  });
  let pending = false;
  const update = () => {
    if (!router.state.initialized) return;
    const nextPending = router.state.navigation.state !== 'idle';
    if (nextPending === pending) return;
    pending = nextPending;
    if (pending) progress.start();
    else progress.done();
  };
  const unsubscribe = router.subscribe(update);
  // 异步模块加载完成时可能已在导航中，立即补齐反馈，不等待下一次通知。
  update();
  return () => {
    unsubscribe();
    if (pending) progress.done();
    progress.remove();
  };
}
