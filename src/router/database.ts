/** 数据库参数平台的路由与菜单定义；类型清单与设置页独立于应用参数平台维护。 */
import { preloadDatabase, revalidateSystemCollection } from './loaders.ts';
import type { WorkspaceRouteConfig } from './types.ts';

/** 数据库参数平台独立维护类型页和设置页，setting 为保留的静态路径。 */
export const databaseRouteConfig: WorkspaceRouteConfig[] = [
  {
    path: 'db/:paramTypeName?',
    label: '参数',
    icon: 'i-lucide-database',
    loader: preloadDatabase,
    shouldRevalidate: revalidateSystemCollection,
    page: () => import('@/pages/DatabaseParameters/index.tsx'),
  },
  {
    path: 'db/setting',
    label: '设置',
    icon: 'i-lucide-settings',
    bottom: true,
    page: () => import('@/pages/SystemSettings/index.tsx'),
  },
];
