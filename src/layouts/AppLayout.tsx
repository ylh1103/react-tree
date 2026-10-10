import { theme } from 'antd';
import type { CSSProperties } from 'react';
import { Outlet } from 'react-router';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { useLayoutPreferences } from '../features/preferences/useLayoutPreferences';

/** 所有子页面共用的外壳；页面内部是否分栏由页面自己决定。 */
export default function AppLayout() {
  const { token } = theme.useToken();
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
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
    <div
      data-layout={layoutMode}
      className={`flex flex-col h-100dvh overflow-hidden bg-canvas ${compact ? '[&_.workspace-panel]:rounded-0' : ''}`}
      style={themeVariables}
    >
      <AppHeader />
      <div
        className={`flex flex-1 min-h-0 ${compact ? 'gap-0 p-0' : 'gap-4px p-4px [&:has([data-split-pane])]:gap-0 [&:has([data-sidebar-expanded=true])>aside]:rounded-r-0'}`}
      >
        <AppNavigation />
        <main
          id="app-page"
          className={`layout-scroll ${compact ? 'rounded-0 [&>.workspace-panel]:border-0' : 'rounded-8px [&:has([data-split-pane])]:rounded-l-0 [&_[data-sidebar-expanded=true]>aside]:rounded-l-0'}`}
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
