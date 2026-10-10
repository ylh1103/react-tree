export const navigationItems = [
  { to: '/overview', label: '总览', icon: 'i-lucide-layout-grid', splitPane: false, bottom: false },
  { to: '/application', label: '应用', icon: 'i-lucide-cloud', splitPane: true, bottom: false },
  {
    to: '/params',
    label: '参数项',
    icon: 'i-lucide-sliders-horizontal',
    splitPane: false,
    bottom: false,
  },
  { to: '/search', label: '搜索', icon: 'i-lucide-search', splitPane: true, bottom: false },
  { to: '/inspect', label: '检查', icon: 'i-lucide-scan-eye', splitPane: false, bottom: false },
  {
    to: '/exception',
    label: '异常项',
    icon: 'i-lucide-file-warning',
    splitPane: false,
    bottom: false,
  },
  {
    to: '/compare',
    label: '定时比对',
    icon: 'i-lucide-calendar-clock',
    splitPane: false,
    bottom: false,
  },
  {
    to: '/apps-comparison',
    label: '批量比对',
    icon: 'i-lucide-files',
    splitPane: false,
    bottom: false,
  },
  { to: '/setting', label: '设置', icon: 'i-lucide-settings', splitPane: false, bottom: true },
];

export const databaseNavigationItems = [
  { to: '/db', label: '参数', icon: 'i-lucide-database', bottom: false },
  { to: '/db/setting', label: '设置', icon: 'i-lucide-settings', bottom: true },
];
