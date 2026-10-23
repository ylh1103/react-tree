/** 把简洁的业务路由定义装配成 React Router 路由，导航读取同一份定义。 */
import type { RouteObject } from 'react-router';
import { workspaceRoutes } from './config.ts';
import { lazyPage, lazyWorkspace } from './lazy.tsx';
import { pageLoading } from './loading.ts';
import { OverviewSkeleton, CollectionRouteSkeleton } from './skeletons.tsx';
import { preloadApplications, preloadDatabase, revalidateSystemCollection } from './loaders.ts';
import type { ParameterPlatform } from './paths.ts';
const skeletons = {
  overview: OverviewSkeleton,
  collection: CollectionRouteSkeleton,
};
export function createWorkspaceRoutes(platform: ParameterPlatform): RouteObject[] {
  return workspaceRoutes
    .filter((item) => item.platform === platform)
    .map((item) => {
      const loading = pageLoading(item.skeleton ? skeletons[item.skeleton] : undefined);
      return {
        id: item.id,
        path: item.path,
        ...loading,
        handle: {
          ...loading.handle,
          ...item,
        },
        lazy: item.page ? lazyPage(item.page) : lazyWorkspace(item.label, item.splitPane),
        ...(item.loader
          ? {
              loader: item.loader === 'applications' ? preloadApplications : preloadDatabase,
              shouldRevalidate: revalidateSystemCollection,
            }
          : {}),
      };
    });
}
