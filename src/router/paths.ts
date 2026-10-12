/**
 * 集中构造系统、平台和选中项 URL，动态路径段统一编码。
 * 切换系统或平台进入目标默认页；选中项由 URL 表达，避免组件维护第二份导航状态。
 */
export type ParameterPlatform = 'application' | 'database';

export function systemPath(systemName: string, page = 'overview') {
  return `/systems/${encodeURIComponent(systemName)}/${page}`;
}

export function platformHome(systemName: string, platform: ParameterPlatform) {
  return systemPath(systemName, platform === 'database' ? 'db' : 'overview');
}

export function applicationPath(systemName: string, appName?: string) {
  return systemPath(systemName, `application${appName ? `/${encodeURIComponent(appName)}` : ''}`);
}

export function databasePath(systemName: string, paramTypeName?: string) {
  return systemPath(
    systemName,
    `db${paramTypeName ? `/${encodeURIComponent(paramTypeName)}` : ''}`,
  );
}
