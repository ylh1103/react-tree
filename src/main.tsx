/**
 * 应用启动入口：装配唯一的 QueryClient、Redux Store、主题和路由上下文。
 * HTML 内联画面负责资源加载前的图标和最小配色，AppThemeProvider 在首次提交时补齐完整主题。
 * 主题、图标缓存和跨页签同步在入口安装；长期订阅在 HMR 替换时清理。
 * 主样式下载结束后挂载 React；HTML 启动画面继续保留到内容交接边界提交，不在入口直接移除。
 */
import { ErrorBoundary } from 'react-error-boundary';
import { AppFailure } from '@/components/AppFailure';
import { startLoginSessionSync } from '@/utils/loginSessionSync';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/queries/client';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import 'virtual:uno.css';
import '@/styles/index.css';
import { router } from '@/router';
import { routes } from '@/router/routes';
import { RouteLoadingContext } from '@/router/loading';
import { AppThemeProvider } from '@/providers/AppThemeProvider';
import { startUserSettingsSession } from '@/store/preferences/effects';
import { waitForBootstrapStyles } from '@/utils/bootstrapStyles';
import { BootstrapLoadingProvider } from '@/providers/BootstrapLoadingProvider';

// 已恢复登录资料时立即读取配置，与路由及样式加载并行；匿名页面直接使用默认配置。
const stopUserSettingsSession = startUserSettingsSession(store);
// 进度库独立下载，不增加首屏静态包；初始化导航仍由启动画面处理。
let progressDisposed = false;
let stopRouteProgress: (() => void) | undefined;
void import('@/router/progress')
  .then(({ startRouteProgress }) => {
    if (!progressDisposed) stopRouteProgress = startRouteProgress(router);
  })
  // 进度提示是可选增强，下载失败只记录错误，不阻断启动或业务导航。
  .catch(console.error);
// 共享会话改变后释放旧账号内存并重载，避免其他页签继续展示旧账号工作区。
const stopLoginSessionSync = startLoginSessionSync(() => {
  stopUserSettingsSession();
  queryClient.clear();
  window.location.reload();
});
// HMR 时统一清理监听并取消配置请求，避免旧入口继续写缓存或应用迟到响应。
import.meta.hot?.dispose(() => {
  progressDisposed = true;
  stopRouteProgress?.();
  stopLoginSessionSync();
  stopUserSettingsSession();
});

// 等标记样式结束后再挂载，减少样式尚未应用时的页面闪现；失败的链接也会结束等待。
// 无需在入口串行等待配置或整个 Router 初始化：各显示分支在首次配置等待结束后再交接 HTML 画面。
void waitForBootstrapStyles().then(() => {
  createRoot(document.getElementById('root')!).render(
    <BootstrapLoadingProvider initialActive={Boolean(document.getElementById('bootstrap-loading'))}>
      <ErrorBoundary FallbackComponent={AppFailure}>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <AppThemeProvider>
              <RouteLoadingContext value={routes}>
                <RouterProvider router={router} />
              </RouteLoadingContext>
            </AppThemeProvider>
          </Provider>
        </QueryClientProvider>
      </ErrorBoundary>
    </BootstrapLoadingProvider>,
  );
});
