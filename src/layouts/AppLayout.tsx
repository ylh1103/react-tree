import { RouteOutlet } from '../router/RouteOutlet';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { useLayoutPreferences } from '../features/preferences/useLayoutPreferences';

/** 所有子页面共用的外壳；页面内部是否分栏由页面自己决定。 */
export default function AppLayout() {
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  return (
    <div
      data-layout={layoutMode}
      className={`flex flex-col h-full overflow-hidden bg-canvas ${compact ? '[&_.workspace-panel]:rounded-0' : ''}`}
    >
      <AppHeader />
      <div
        className={`flex flex-1 min-h-0 gap-layout p-layout ${compact ? '' : '[&:has([data-split-pane])]:gap-0 [&:has([data-sidebar-expanded=true])>aside]:rounded-r-0'}`}
      >
        <AppNavigation />
        <main
          id="app-page"
          className={`layout-scroll ${compact ? 'rounded-0 [&>.workspace-panel]:border-0' : 'rounded-8px [&:has([data-split-pane])]:rounded-l-0 [&_[data-sidebar-expanded=true]>aside]:rounded-l-0 [&_[data-sidebar-expanded=true]>aside]:border-l-0'}`}
          tabIndex={-1}
        >
          <RouteOutlet layoutId="workspace" />
        </main>
      </div>
    </div>
  );
}
