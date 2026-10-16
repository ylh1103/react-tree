/**
 * 应用启动入口：装配唯一的 QueryClient、Redux Store、主题和路由上下文。
 * HTML 内联脚本负责资源加载前的最小配色，AppThemeProvider 在首次提交时补齐完整主题。
 * 主题缓存与跨页签同步在入口安装，完整主题由 Provider 应用；长期订阅在 HMR 替换时清理。
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queries/client';
import { Provider } from 'react-redux';
import { store } from './store';
import { createRoot } from 'react-dom/client';
import {
  StyleProvider,
  legacyLogicalPropertiesTransformer,
  autoPrefixTransformer,
} from '@ant-design/cssinjs';
import { RouterProvider } from 'react-router/dom';
import 'virtual:uno.css';
import './styles/index.css';
import { router } from './router';
import { routes } from './router/routes';
import { RouteLoadingContext } from './router/loading';
import { requireSession, startAccessFailureHandling, startSessionLifetime } from './store/session';
import { AppThemeProvider } from './providers/AppThemeProvider';
import { startThemePersistence } from './store/preferences/themeBootstrap';
import { startUserSettingsSync } from './store/preferences/sync';

// 只把服务端确认的主题写入下次启动缓存；当前页面的 DOM 配色由 Provider 管理。
// 监听生命周期属于应用入口，HMR 时取消旧订阅，避免一次状态更新触发多次持久化。
const stopThemePersistence = startThemePersistence(store);
import.meta.hot?.dispose(stopThemePersistence);

// 登录身份变化时重建按用户隔离的同步通道，停止旧用户在途刷新。
let stopUserSettingsSync: (() => void) | undefined;
let syncedUser: string | undefined;
const stopSyncSubscription = store.subscribe(() => {
  const identity = store.getState().session.user?.ystId;
  if (identity === syncedUser) return;
  syncedUser = identity;
  stopUserSettingsSync?.();
  stopUserSettingsSync = identity ? startUserSettingsSync(store) : undefined;
});
import.meta.hot?.dispose(() => {
  stopSyncSubscription();
  stopUserSettingsSync?.();
});

// 与 loader 共用会话初始化，业务请求必须等待身份和授权。
const stopAccessFailures = startAccessFailureHandling();
import.meta.hot?.dispose(stopAccessFailures);
const stopSessionLifetime = startSessionLifetime();
import.meta.hot?.dispose(stopSessionLifetime);
void requireSession().catch(() => {
  /* 登录错误由根布局展示。 */
});

const legacyStyleTransformers = [legacyLogicalPropertiesTransformer, autoPrefixTransformer];

createRoot(document.getElementById('root')!).render(
  <StyleProvider hashPriority="high" transformers={legacyStyleTransformers}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AppThemeProvider>
          <RouteLoadingContext value={routes}>
            <RouterProvider router={router} />
          </RouteLoadingContext>
        </AppThemeProvider>
      </Provider>
    </QueryClientProvider>
  </StyleProvider>,
);
