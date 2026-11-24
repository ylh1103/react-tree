/** 维护站点公开入口和登录后的站点布局路由，根路由负责将两者挂到对应的访问分组。 */
import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { RouteSkeleton } from '@/components/RouteSkeleton';
import SiteLayout from '@/layouts/SiteLayout';
import RouteErrorPage from '@/pages/RouteError';
import RouteStatusPage from '@/pages/RouteStatus';
import { systemJoinRequestRoute } from '@/utils/systemJoinLink';

function lazyPage(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default });
}

export const publicSiteRoutes: RouteObject[] = [
  { path: 'login', lazy: lazyPage(() => import('@/pages/Login')) },
  { path: 'landing', lazy: lazyPage(() => import('@/pages/Landing')) },
];

export const siteRoute: RouteObject = {
  // 加载骨架和站点内容区用布局 ID 定位对应的路由范围。
  id: 'site',
  Component: SiteLayout,
  children: [
    {
      index: true,
      HydrateFallback: RouteSkeleton,
      ErrorBoundary: RouteErrorPage,
      lazy: lazyPage(() => import('@/pages/SystemsHome')),
    },
    {
      path: systemJoinRequestRoute,
      HydrateFallback: RouteSkeleton,
      ErrorBoundary: RouteErrorPage,
      lazy: lazyPage(() => import('@/pages/SystemJoinRequest')),
    },
    { path: '*', Component: RouteStatusPage },
  ],
};
