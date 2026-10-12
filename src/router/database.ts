import type { RouteObject } from 'react-router';
import { lazyPage } from './lazy';
import { pageLoading } from './loading';
import { DatabaseSkeleton } from './skeletons';
import { preloadDatabase, revalidateSystemCollection } from './loaders';

/** 数据参数平台，路径相对于 systems/:systemName。 */
export const databaseRoutes: RouteObject[] = [
  {
    id: 'database-setting',
    path: 'db/setting',
    ...pageLoading(),
    lazy: lazyPage(() => import('../pages/UserSettings')),
  },
  {
    id: 'database',
    path: 'db/:paramTypeName?',
    ...pageLoading(DatabaseSkeleton),
    loader: preloadDatabase,
    shouldRevalidate: revalidateSystemCollection,
    lazy: lazyPage(() => import('../pages/DatabaseParameters')),
  },
];
