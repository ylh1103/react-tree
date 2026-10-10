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
