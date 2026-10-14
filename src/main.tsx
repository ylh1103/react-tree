/**
 * 应用启动入口：建立唯一的 QueryClient、Redux Store、主题和路由上下文。
 * 会话和布局先初始化，再授权并预取业务数据；所有长期订阅在 HMR 替换时清理。
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
import { applyTheme } from './styles/theme';
import { requireSession, startAccessFailureHandling, startSessionLifetime } from './store/session';
import { AppThemeProvider } from './providers/AppThemeProvider';
import { getSystemTheme } from './hooks/useResolvedTheme';
import { startThemePersistence } from './store/preferences/themeBootstrap';
import { startUserSettingsSync } from './store/preferences/sync';

// 开发和生产环境都启动主题缓存与用户设置同步；监听随当前页面持续运行。
// 生产环境入口通常只执行一次，关闭或刷新页面时由浏览器释放资源。
// 开发环境 HMR 替换本模块时清理旧监听，避免重复订阅；若手动销毁应用，也应调用这两个 stop 函数。
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

const initialTheme = store.getState().preferences.themeMode;
applyTheme(initialTheme === 'system' ? getSystemTheme() : initialTheme);

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
