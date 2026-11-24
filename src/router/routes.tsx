/** 组装各功能模块的路由，并在根节点统一声明登录保护、错误边界和启动回退。 */
import type { RouteObject } from 'react-router';
import App from '@/App';
import { RootRouteErrorPage } from '@/pages/RouteError';
import { loginMiddleware, restoreLoginMiddleware } from './middleware/login';
import { publicSiteRoutes, siteRoute } from './site/routes';
import { InitialRouteFallback } from './skeletons';
import { systemWorkspaceRoute } from './workspace/routes';

export const routes: RouteObject[] = [
  {
    Component: App,
    middleware: [restoreLoginMiddleware],
    ErrorBoundary: RootRouteErrorPage,
    // 父 loader 或页面模块未完成时，由根回退保留启动动画；配置等待结束后再按目标 URL 展示骨架。
    HydrateFallback: InitialRouteFallback,
    children: [
      ...publicSiteRoutes,
      {
        // 无路径分组统一保护业务入口，不增加 URL 层级；新增业务页必须放在此分组内。
        middleware: [loginMiddleware],
        children: [siteRoute, systemWorkspaceRoute],
      },
    ],
  },
];
