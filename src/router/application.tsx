import { Navigate, type RouteObject } from 'react-router';
import { lazyPage, lazyWorkspace } from './lazy';
import { pageLoading } from './loading';
import {
  OverviewSkeleton,
  ApplicationsSkeleton,
  CollectionSkeleton,
} from '../components/PageSkeleton';
import { preloadApplications, revalidateSystemCollection } from './loaders';

/** 应用参数平台，路径相对于 systems/:systemName。 */
export const applicationRoutes: RouteObject[] = [
  { id: 'system-index', index: true, element: <Navigate to="overview" replace /> },
  {
    id: 'overview',
    path: 'overview',
    ...pageLoading(OverviewSkeleton),
    lazy: lazyPage(() => import('../pages/SystemOverviewPage')),
  },
  {
    id: 'application',
    path: 'application/:appName?',
    ...pageLoading(ApplicationsSkeleton),
    loader: preloadApplications,
    shouldRevalidate: revalidateSystemCollection,
    lazy: lazyPage(() => import('../pages/SystemApplicationsPage')),
  },
  { id: 'params', path: 'params', ...pageLoading(), lazy: lazyWorkspace('参数项') },
  {
    id: 'search',
    path: 'search',
    ...pageLoading(CollectionSkeleton),
    lazy: lazyWorkspace('搜索', true),
  },
  { id: 'inspect', path: 'inspect', ...pageLoading(), lazy: lazyWorkspace('检查') },
  { id: 'exception', path: 'exception', ...pageLoading(), lazy: lazyWorkspace('异常项') },
  { id: 'compare', path: 'compare', ...pageLoading(), lazy: lazyWorkspace('定时比对') },
  {
    id: 'apps-comparison',
    path: 'apps-comparison',
    ...pageLoading(),
    lazy: lazyWorkspace('批量比对'),
  },
  {
    id: 'setting',
    path: 'setting',
    ...pageLoading(),
    lazy: lazyPage(() => import('../pages/UserSettingsPage')),
  },
];
