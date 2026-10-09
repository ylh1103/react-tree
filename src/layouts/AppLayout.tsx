import { theme } from 'antd';
import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';

/** 所有子页面共用的外壳；页面内部是否分栏由页面自己决定。 */
export default function AppLayout() {
  const { token } = theme.useToken();
  const themeVariables = {
    '--color-accent': token.colorPrimary,
    '--color-hover': token.colorPrimaryBg,
    '--color-on-accent': token.colorTextLightSolid,
    '--color-nav-active': token.colorPrimary,
    '--color-nav-active-hover': token.colorPrimaryHover,
    '--color-nav-pressed': token.colorPrimaryActive,
    '--color-nav-emphasis': token.colorTextLightSolid,
  } as CSSProperties;
  return (
    <div className="h-100dvh flex flex-col overflow-hidden bg-canvas" style={themeVariables}>
      <AppHeader />
      <div className="flex flex-1 min-h-0 gap-4px px-4px py-4px [&:has(>main>[data-sidebar-expanded])]:gap-0 [&:has(>main>[data-sidebar-expanded=true])>aside]:rounded-r-0 [&:has(>main>[data-sidebar-expanded])>main]:rounded-l-0">
        <AppNavigation />
        <main id="app-page" className="layout-scroll rounded-2 bg-surface" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
