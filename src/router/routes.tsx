/**
 * 组装根应用、站点入口、系统工作区和两个参数平台。
 * 布局保持静态，业务页面按需加载；根错误边界负责页面资源失败时的恢复入口。
 */
import { Navigate, type RouteObject } from 'react-router';
import App from '@/App';
import AppLayout from '@/layouts/AppLayout';
import SiteLayout from '@/layouts/SiteLayout';
import SystemLayout from '@/layouts/SystemLayout';
import RouteStatusPage from '@/pages/RouteStatus';
import { applicationRouteConfig } from './application';
import { databaseRouteConfig } from './database';
import type { WorkspaceRouteConfig } from './types';
import type { ComponentType } from 'react';
import { RouteSkeleton } from '@/components/RouteSkeleton';
import { preloadSystems } from './loaders';
import RouteErrorPage from '@/pages/RouteError';
import { InitialRouteFallback } from './skeletons';

/** 默认导出的页面按路由加载，布局外壳保持稳定。 */
function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

/** 尚未实现的工作区共用页面，保留各自标题和分栏设置。 */
function lazyWorkspace(title: string, splitPane = false) {
  return async () => {
    const { default: PlaceholderWorkspace } = await import('@/components/PlaceholderWorkspace');
    return { Component: () => <PlaceholderWorkspace title={title} splitPane={splitPane} /> };
  };
}

/** 仅补齐共用加载行为；路径、页面和 loader 直接来自对应平台配置，不再按平台或 loader 名称分发。 */
function createWorkspaceRoute(config: WorkspaceRouteConfig): RouteObject {
  return {
    path: config.path,
    loader: config.loader,
    shouldRevalidate: config.shouldRevalidate,
    HydrateFallback: RouteSkeleton,
    ErrorBoundary: RouteErrorPage,
    handle: {
      label: config.label,
    },
    lazy: config.page ? lazyPage(config.page) : lazyWorkspace(config.label, config.splitPane),
  };
}

/** 统一组装站点、系统布局和两个参数平台的路由。 */
export const routes: RouteObject[] = [
  {
    Component: App,
    ErrorBoundary: RouteErrorPage,
    // 父 loader 或页面模块未完成时，由根回退保留启动动画；配置等待结束后再按目标 URL 展示骨架。
    HydrateFallback: InitialRouteFallback,
    children: [
      {
        // 仅布局保留显式 ID，供加载骨架定位外壳及 Outlet 范围。
        id: 'site',
        Component: SiteLayout,
        children: [
          {
            index: true,
            loader: preloadSystems,
            HydrateFallback: RouteSkeleton,
            ErrorBoundary: RouteErrorPage,
            lazy: lazyPage(() => import('@/pages/SystemsHome')),
          },
          { path: '*', Component: RouteStatusPage },
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
              { index: true, element: <Navigate to="overview" replace /> },
              ...applicationRouteConfig.map(createWorkspaceRoute),
              ...databaseRouteConfig.map(createWorkspaceRoute),
              { path: '*', Component: RouteStatusPage },
            ],
          },
        ],
      },
    ],
  },
];
