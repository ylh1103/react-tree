/**
 * 应用启动入口：装配唯一的 QueryClient、Redux Store、主题和路由上下文。
 * HTML 内联画面负责资源加载前的图标和最小配色，AppThemeProvider 在首次提交时补齐完整主题。
 * 主题、图标缓存和跨页签同步在入口安装；长期订阅在 HMR 替换时清理。
 * 主样式下载结束后挂载 React；HTML 启动画面继续保留到内容交接边界提交，不在入口直接移除。
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
import { startSystemAccessFailureHandling } from './queries/accessFailures';
import { loadUserSettings } from './store/slices/preferencesSlice';
import { AppThemeProvider } from './providers/AppThemeProvider';
import { startUserSettingsEffects } from './store/preferences/effects';
import { waitForBootstrapStyles } from './utils/bootstrapStyles';
import { BootstrapLoadingProvider } from './providers/BootstrapLoadingProvider';

// 一个 Store 订阅处理启动缓存、跨页签广播与排队刷新；DOM 配色仍由 Provider 管理。
const stopUserSettingsEffects = startUserSettingsEffects(store);
// HMR 时统一清理监听并取消配置请求，避免旧入口继续写缓存或应用迟到响应。
import.meta.hot?.dispose(stopUserSettingsEffects);

// 系统接口错误仍由统一处理器清理相关缓存，应用启动不再读取登录会话。
const stopAccessFailures = startSystemAccessFailureHandling();
import.meta.hot?.dispose(stopAccessFailures);

// router 在模块初始化时已启动路由加载；此处立即读取设置，不让它与样式等待形成串行请求。
// 样式结束并挂载 React 后，根路由/App 可先显示静态骨架，无骨架时继续使用 HTML 原动画。
void store.dispatch(loadUserSettings());
// HMR 可能发生在样式等待期间；标记旧入口失效，阻止其异步回调在新入口之后再次挂载。
// 此标记不取消浏览器的样式下载，也不会使 waitForBootstrapStyles 主动拒绝。
let disposed = false;
import.meta.hot?.dispose(() => {
  disposed = true;
});

const legacyStyleTransformers = [legacyLogicalPropertiesTransformer, autoPrefixTransformer];

// 等标记样式结束后再挂载，减少样式尚未应用时的页面闪现；失败的链接也会结束等待。
// 无需额外等待配置或整个 Router 初始化：可展示的骨架、正文或错误页会通过交接边界移除 HTML 画面。
void waitForBootstrapStyles().then(
  () => {
    if (disposed) return;
    createRoot(document.getElementById('root')!).render(
      <BootstrapLoadingProvider
        initialActive={Boolean(document.getElementById('bootstrap-loading'))}
      >
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
        </StyleProvider>
      </BootstrapLoadingProvider>,
    );
  },
  (error: unknown) => {
    // 样式资源的 load/error 均由等待函数正常处理；此处仅传播意外异常，旧入口失效后忽略它。
    if (!disposed) throw error;
  },
);
