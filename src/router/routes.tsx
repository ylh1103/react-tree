/**
 * 组装根应用、站点入口、系统工作区和两个参数平台。
 * 布局保持静态，业务页面按需加载；根错误边界负责页面资源失败时的恢复入口。
 */
import type { RouteObject } from 'react-router';
import App from '@/App';
import AppLayout from '@/layouts/AppLayout';
import SiteLayout from '@/layouts/SiteLayout';
import SystemLayout from '@/layouts/SystemLayout';
import RouteStatusPage from '@/pages/RouteStatus';
import { applicationRoutes } from './application';
import { databaseRoutes } from './database';
import { lazyPage } from './lazy';
import { pageLoading } from './loading';
import { preloadSystems } from './loaders';
import RouteErrorPage from '@/pages/RouteError';
import { InitialRouteFallback, SystemsHomeSkeleton } from './skeletons';

/** 统一组装站点、系统布局和两个参数平台的路由。 */
export const routes: RouteObject[] = [
  {
    id: 'root',
    Component: App,
    ErrorBoundary: RouteErrorPage,
    // 父 loader 或页面模块未完成时，根回退也按目标 URL 选择骨架，不必等待 App 和子路由能够渲染。
    HydrateFallback: InitialRouteFallback,
    children: [
      {
        id: 'site',
        Component: SiteLayout,
        children: [
          {
            id: 'home',
            index: true,
            loader: preloadSystems,
            ...pageLoading(SystemsHomeSkeleton),
            lazy: lazyPage(() => import('@/pages/SystemsHome')),
          },
          { id: 'site-not-found', path: '*', Component: RouteStatusPage },
        ],
      },
      {
        id: 'system',
        path: 'systems/:systemName',
        loader: preloadSystems,
        Component: SystemLayout,
        children: [
          {
            id: 'workspace',
            Component: AppLayout,
            children: [
              ...applicationRoutes,
              ...databaseRoutes,
              { id: 'system-not-found', path: '*', Component: RouteStatusPage },
            ],
          },
        ],
      },
    ],
  },
];
