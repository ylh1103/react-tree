/** 首次路由等待的启动交接与外壳组装；所有静态展示骨架集中在 RouteSkeleton，不引入业务占位。 */
import { useContext, type ReactNode } from 'react';
import { matchRoutes, useLocation } from 'react-router';
import { matchPageSkeleton, RouteLoadingContext } from './loading';
import { ResourceLoading } from '@/components/ResourceLoading';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { HeaderSkeleton } from '@/components/RouteSkeleton/components/HeaderSkeleton';
import { NavigationSkeleton } from '@/components/RouteSkeleton/components/NavigationSkeleton';
import { AppViewport, SiteFrame, WorkspaceFrame } from '@/layouts/LayoutFrame';
import { useAppSelector } from '@/store/hooks';
import { applicationRouteConfig as navigationItems } from './application';
import { databaseRouteConfig as databaseNavigationItems } from './database';

/** 仅根级等待补齐外壳；页内回退仍只渲染页面骨架，避免在已挂载布局中重复页头和导航。 */
function InitialLayoutSkeleton({ children }: { children: ReactNode }) {
  const routes = useContext(RouteLoadingContext);
  const { pathname } = useLocation();
  const matches = matchRoutes(routes, pathname);
  const workspace = matches?.some(({ route }) => route.id === 'system');
  const database = databaseNavigationItems.some(
    (item) => item.path === matches?.at(-1)?.route.path,
  );
  return (
    <AppViewport>
      {workspace ? (
        <WorkspaceFrame
          header={<HeaderSkeleton />}
          navigation={
            <NavigationSkeleton items={database ? databaseNavigationItems : navigationItems} />
          }
        >
          {children}
        </WorkspaceFrame>
      ) : (
        <SiteFrame header={<HeaderSkeleton />}>{children}</SiteFrame>
      )}
    </AppViewport>
  );
}

/**
 * 根路由 HydrateFallback：首次配置等待结束前保留启动动画，避免骨架先按缓存显示再切换主题或布局。
 * 配置成功或失败后，才根据当前 URL 展示使用确认配置或回退配置的静态骨架；没有骨架时继续等待。
 * 请求和页面模块仍由 Router 并行加载，此处只控制显示，不查询或展示受保护业务数据。
 * 有骨架时在提交后交接 HTML 画面；正式页面仍受原 loader 和系统布局的校验约束。
 */
export function InitialRouteFallback() {
  const routes = useContext(RouteLoadingContext);
  const location = useLocation();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  if (!initialized) return <ResourceLoading />;
  const skeleton = matchPageSkeleton(routes, location.pathname);
  return skeleton ? (
    <BootstrapLoadingHandoff>
      <InitialLayoutSkeleton>{skeleton}</InitialLayoutSkeleton>
    </BootstrapLoadingHandoff>
  ) : (
    <ResourceLoading />
  );
}
