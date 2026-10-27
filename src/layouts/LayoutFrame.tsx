/**
 * 正式布局与首屏骨架共用的展示容器，只消费显示偏好，不查询系统或推导授权。
 * 将视口、页头、导航及内容区的几何结构集中维护，避免异步等待前后发生布局跳动。
 */
import type { CSSProperties, ReactNode } from 'react';
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences';
import { useAppSelector } from '@/store/hooks';
import { navigationThemeVariables } from '@/styles/theme';

/** 根应用与根路由回退使用同一最小宽度及布局间距，配置未返回时也有完整尺寸约束。 */
export function AppViewport({ children }: { children: ReactNode }) {
  const { layoutMode, layoutGap } = useLayoutPreferences();
  return (
    <div className="h-full overflow-auto">
      <div
        className="h-full min-w-1280px [&[data-layout=compact]]:[--layout-gap:0px]"
        data-layout={layoutMode}
        style={{ '--layout-gap': `${layoutMode === 'compact' ? 0 : layoutGap}px` } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}

/** 站点首页仅有页头和内容，不显示系统内的主导航。 */
export function SiteFrame({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-canvas">
      {header}
      <main className="layout-scroll" id="app-page" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

/** 系统工作区容器；调用方决定渲染真实导航还是无业务数据的占位。 */
export function WorkspaceFrame({
  header,
  navigation,
  children,
}: {
  header: ReactNode;
  navigation: ReactNode;
  children: ReactNode;
}) {
  const { layoutMode } = useLayoutPreferences();
  const compact = layoutMode === 'compact';
  return (
    <div
      data-layout={layoutMode}
      className={`flex flex-col h-full overflow-hidden bg-canvas ${compact ? '[&_.workspace-panel]:rounded-0' : ''}`}
    >
      {header}
      <div
        className={`flex flex-1 min-h-0 gap-layout p-layout ${compact ? '' : '[&:has([data-split-pane])]:gap-0 [&:has([data-sidebar-expanded=true])>aside]:rounded-r-0'}`}
      >
        {navigation}
        <main
          id="app-page"
          className={`layout-scroll ${compact ? 'rounded-0 [&>.workspace-panel]:border-0' : 'rounded-ui [&:has([data-split-pane])]:rounded-l-0 [&_[data-sidebar-expanded=true]>aside]:rounded-l-0 [&_[data-sidebar-expanded=true]>aside]:border-l-0'}`}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/** 导航占位和真实菜单共用宽度、配色及边框；不要求 SystemContext 已获授权。 */
export function NavigationFrame({ children }: { children: ReactNode }) {
  const { layoutMode } = useLayoutPreferences();
  const navigationIconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const navigationTheme = useAppSelector((state) => state.preferences.navigationTheme);
  return (
    <aside
      style={navigationThemeVariables[navigationTheme] as CSSProperties}
      className={`${navigationIconOnly ? 'w-48px' : 'w-60px'} shrink-0 overflow-y-auto bg-nav [scrollbar-width:thin] ${navigationTheme === 'theme' ? 'border-border-subtle' : 'border-nav-hover'} ${layoutMode === 'compact' ? 'rounded-0 border-r border-r-solid' : 'border border-solid rounded-ui'}`}
    >
      {children}
    </aside>
  );
}
