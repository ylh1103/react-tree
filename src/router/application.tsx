/** 应用平台路由由统一业务配置生成，默认入口保留总览。 */
import { Navigate, type RouteObject } from 'react-router';
import { createWorkspaceRoutes } from './workspace';
export const applicationRoutes: RouteObject[] = [
  { id: 'system-index', index: true, element: <Navigate to="overview" replace /> },
  ...createWorkspaceRoutes('application'),
];
