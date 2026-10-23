/** 路由与导航唯一配置；图标使用完整工具类名，供 UnoCSS 构建管线自动提取。 */
import type { ParameterPlatform } from './paths.ts';
type PageModule = typeof import('@/pages/SystemsHome/index.tsx');
/** 清单骨架只声明布局参数；新业务复用结构，不把专用页面组件带入静态路由。 */
export interface CollectionLoadingLayout {
  storageKey: string;
  title: string;
  defaultWidth?: number;
  selectionParam?: string;
  integratedHeaderWhenEmpty?: boolean;
}

export interface WorkspaceRoute {
  id: string;
  path: string;
  to: string;
  label: string;
  icon: string;
  bottom?: boolean;
  action?: 'settings';
  splitPane?: boolean;
  platform: ParameterPlatform;
  page?: () => Promise<PageModule>;
  loader?: 'applications' | 'database';
  skeleton?: 'overview' | 'collection';
  loadingLayout?: CollectionLoadingLayout;
}
export const workspaceRoutes: WorkspaceRoute[] = [
  {
    id: 'overview',
    path: 'overview',
    to: '/overview',
    label: '总览',
    icon: 'i-lucide-layout-grid',
    platform: 'application',
    skeleton: 'overview',
    page: () => import('@/pages/SystemOverview/index.tsx'),
  },
  {
    id: 'application',
    path: 'application/:appName?',
    to: '/application',
    label: '应用',
    icon: 'i-lucide-cloud',
    platform: 'application',
    splitPane: true,
    loader: 'applications',
    skeleton: 'collection',
    loadingLayout: {
      storageKey: 'parameter-management:split-pane:application:v1',
      title: '应用参数',
      defaultWidth: 290,
      selectionParam: 'appName',
      integratedHeaderWhenEmpty: true,
    },
    page: () => import('@/pages/SystemApplications/index.tsx'),
  },
  {
    id: 'params',
    path: 'params',
    to: '/params',
    label: '参数项',
    icon: 'i-lucide-sliders-horizontal',
    platform: 'application',
    page: () => import('@/pages/SystemParameters/index.tsx'),
  },
  {
    id: 'search',
    path: 'search',
    to: '/search',
    label: '搜索',
    icon: 'i-lucide-search',
    platform: 'application',
    splitPane: true,
    skeleton: 'collection',
  },
  {
    id: 'inspect',
    path: 'inspect',
    to: '/inspect',
    label: '检查',
    icon: 'i-lucide-scan-eye',
    platform: 'application',
  },
  {
    id: 'exception',
    path: 'exception',
    to: '/exception',
    label: '异常项',
    icon: 'i-lucide-file-warning',
    platform: 'application',
  },
  {
    id: 'compare',
    path: 'compare',
    to: '/compare',
    label: '定时比对',
    icon: 'i-lucide-calendar-clock',
    platform: 'application',
  },
  {
    id: 'apps-comparison',
    path: 'apps-comparison',
    to: '/apps-comparison',
    label: '批量比对',
    icon: 'i-lucide-files',
    platform: 'application',
  },
  {
    id: 'setting',
    path: 'setting',
    to: '/setting',
    label: '设置',
    icon: 'i-lucide-settings',
    platform: 'application',
    bottom: true,
    action: 'settings',
    page: () => import('@/pages/UserSettings/index.tsx'),
  },
  {
    id: 'database-setting',
    path: 'db/setting',
    to: '/db/setting',
    label: '设置',
    icon: 'i-lucide-settings',
    platform: 'database',
    bottom: true,
    action: 'settings',
    page: () => import('@/pages/UserSettings/index.tsx'),
  },
  {
    id: 'database',
    path: 'db/:paramTypeName?',
    to: '/db',
    label: '参数',
    icon: 'i-lucide-database',
    platform: 'database',
    loader: 'database',
    skeleton: 'collection',
    loadingLayout: {
      storageKey: 'parameter-management:split-pane:database:v1',
      title: '数据库参数',
      defaultWidth: 300,
      selectionParam: 'paramTypeName',
    },
    page: () => import('@/pages/DatabaseParameters/index.tsx'),
  },
];
export const navigationItems = workspaceRoutes.filter((item) => item.platform === 'application');
export const databaseNavigationItems = workspaceRoutes
  .filter((item) => item.platform === 'database')
  .sort((a, b) => Number(Boolean(a.bottom)) - Number(Boolean(b.bottom)));
