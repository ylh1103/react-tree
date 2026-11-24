/** 定义系统授权边界和工作区布局，将两个平台的菜单配置转换为可懒加载的子路由。 */
import { Navigate, type RouteObject } from 'react-router';
import { RouteSkeleton } from '@/components/RouteSkeleton';
import { ApplicationSkeleton } from '@/components/RouteSkeleton/components/ApplicationSkeleton';
import WorkspaceLayout from '@/layouts/WorkspaceLayout';
import SystemLayout from '@/layouts/WorkspaceLayout/SystemLayout';
import RouteErrorPage, { SystemRouteErrorPage } from '@/pages/RouteError';
import RouteStatusPage from '@/pages/RouteStatus';
import { systemAccessMiddleware } from '../middleware/systemAccess';
import { applicationRouteConfig } from './application/routes';
import { databaseRouteConfig } from './database/routes';
import { preloadSystems } from './loaders';
import type { WorkspaceRouteConfig } from './types';

/** 平台配置提供匹配规则和预取函数，转换时补齐共用的错误边界、骨架和占位页。 */
function createWorkspaceRoute(config: WorkspaceRouteConfig): RouteObject {
  return {
    id: config.id,
    path: config.path,
    loader: config.loader,
    shouldRevalidate: config.shouldRevalidate,
    HydrateFallback: config.skeleton === 'application' ? ApplicationSkeleton : RouteSkeleton,
    ErrorBoundary: RouteErrorPage,
    handle: {
      label: config.label,
      // 有子操作的工作区在同一应用内保留挂载，导航等待时也不能用 Activity 隐藏并清理编辑器 Effect。
      preserveWorkspace: Boolean(config.children?.length),
    },
    lazy: async () => {
      if (config.page) return { Component: (await config.page()).default };
      const { default: PlaceholderWorkspace } = await import('@/components/PlaceholderWorkspace');
      return {
        Component: function WorkspacePlaceholder() {
          return (
            <PlaceholderWorkspace title={config.label} splitPane={config.splitPane ?? false} />
          );
        },
      };
    },
    children: config.children?.map(createWorkspaceRoute),
  };
}

export const systemWorkspaceRoute: RouteObject = {
  id: 'system',
  path: 'systems/:systemName',
  middleware: [systemAccessMiddleware],
  loader: preloadSystems,
  Component: SystemLayout,
  ErrorBoundary: SystemRouteErrorPage,
  children: [
    {
      id: 'workspace',
      Component: WorkspaceLayout,
      children: [
        { index: true, element: <Navigate to="overview" replace /> },
        ...applicationRouteConfig.map(createWorkspaceRoute),
        ...databaseRouteConfig.map(createWorkspaceRoute),
        { path: '*', Component: RouteStatusPage },
      ],
    },
  ],
};
