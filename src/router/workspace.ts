/** 把简洁的业务路由定义装配成 React Router 路由，导航读取同一份定义。 */
import type { RouteObject } from 'react-router';
import { workspaceRoutes } from './config.ts';
import { lazyPage, lazyWorkspace } from './lazy.tsx';
import { pageLoading } from './loading.ts';
import {
  OverviewSkeleton,
  ApplicationsSkeleton,
  DatabaseSkeleton,
  CollectionSkeleton,
} from './skeletons.tsx';
import { preloadApplications, preloadDatabase, revalidateSystemCollection } from './loaders.ts';
import type { ParameterPlatform } from './paths.ts';
const skeletons = {
  overview: OverviewSkeleton,
  applications: ApplicationsSkeleton,
  database: DatabaseSkeleton,
  collection: CollectionSkeleton,
};
export function createWorkspaceRoutes(platform: ParameterPlatform): RouteObject[] {
  return workspaceRoutes
    .filter((item) => item.platform === platform)
    .map((item) => ({
      id: item.id,
      path: item.path,
      ...pageLoading(item.skeleton ? skeletons[item.skeleton] : undefined),
      handle: {
        ...pageLoading(item.skeleton ? skeletons[item.skeleton] : undefined).handle,
        ...item,
      },
      lazy: item.page ? lazyPage(item.page) : lazyWorkspace(item.label, item.splitPane),
      ...(item.loader
        ? {
            loader: item.loader === 'applications' ? preloadApplications : preloadDatabase,
            shouldRevalidate: revalidateSystemCollection,
          }
        : {}),
    }));
}
