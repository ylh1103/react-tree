/** 应用参数平台的路由与菜单定义；业务页面按目录懒加载，完整图标类名供 UnoCSS 提取。 */
import { preloadApplications, revalidateSystemCollection } from './loaders.ts';
import type { WorkspaceRouteConfig } from './types.ts';

/** 应用环境操作嵌套在配置页下，切换操作不会卸载父工作区；不生成独立导航菜单。 */
const applicationOperationRoutes: WorkspaceRouteConfig[] = [
  {
    path: ':envTag/create/:version?',
    label: '创建快照',
    icon: 'i-lucide-camera',
    page: () => import('@/pages/CreateSnapshot/index.tsx'),
  },
  {
    path: ':envTag/publish/:version?',
    label: '发布',
    icon: 'i-lucide-send',
    page: () => import('@/pages/PublishSnapshot/index.tsx'),
  },
  {
    path: ':envTag/inspect',
    label: '检查',
    icon: 'i-lucide-scan-eye',
    page: () => import('@/pages/InspectParameters/index.tsx'),
  },
];

/** 应用参数平台独立维护页面顺序及菜单，系统默认入口由路由树重定向到总览。 */
export const applicationRouteConfig: WorkspaceRouteConfig[] = [
  {
    path: 'overview',
    label: '总览',
    icon: 'i-lucide-layout-grid',
    page: () => import('@/pages/SystemOverview/index.tsx'),
  },
  {
    path: 'application/:appName?',
    label: '应用',
    icon: 'i-lucide-cloud',
    splitPane: true,
    loader: preloadApplications,
    shouldRevalidate: revalidateSystemCollection,
    page: () => import('@/pages/SystemApplications/index.tsx'),
    children: applicationOperationRoutes,
  },
  {
    path: 'params',
    label: '参数项',
    icon: 'i-lucide-sliders-horizontal',
    page: () => import('@/pages/SystemParameters/index.tsx'),
  },
  {
    path: 'search',
    label: '搜索',
    icon: 'i-lucide-search',
    splitPane: true,
  },
  {
    path: 'inspect',
    label: '检查',
    icon: 'i-lucide-scan-eye',
  },
  {
    path: 'exception',
    label: '异常项',
    icon: 'i-lucide-file-warning',
  },
  {
    path: 'compare',
    label: '定时比对',
    icon: 'i-lucide-calendar-clock',
  },
  {
    path: 'apps-comparison',
    label: '批量比对',
    icon: 'i-lucide-files',
  },
  {
    path: 'setting',
    label: '设置',
    icon: 'i-lucide-settings',
    bottom: true,
    page: () => import('@/pages/SystemSettings/index.tsx'),
  },
];
