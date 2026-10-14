/** 导航消费统一路由定义，URL 决定选中项，设置动作显式打开抽屉。 */
import { Button, Tooltip } from 'antd';
import type { CSSProperties } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openUserSettings } from '../store/slices/preferencesSlice';
import { NavLink, useLocation } from 'react-router';
import { navigationItems, databaseNavigationItems } from './navigation';
import { useSystemWorkspace } from '../contexts/SystemContext';
import { systemPath } from '../router/paths';
import { useLayoutPreferences } from '../hooks/useLayoutPreferences';
import { navigationThemeVariables } from '../styles/theme';

export function AppNavigation() {
  const { system, platform } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const navigationIconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const navigationTheme = useAppSelector((state) => state.preferences.navigationTheme);
  const iconSizeClass = navigationIconOnly ? 'w-24px h-24px' : 'w-22px h-22px';
  const isDatabaseSetting =
    pathname.replace(/\/$/, '') === systemPath(system.systemName, 'db/setting');
  const items = platform === 'database' ? databaseNavigationItems : navigationItems;
  return (
    <aside
      style={navigationThemeVariables[navigationTheme] as CSSProperties}
      className={`${navigationIconOnly ? 'w-48px' : 'w-60px'} shrink-0 overflow-y-auto bg-nav [scrollbar-width:thin] [scrollbar-color:var(--color-nav-hover)_var(--color-nav)] ${navigationTheme === 'theme' ? 'border-border-subtle' : 'border-nav-hover'} ${layoutMode === 'compact' ? 'rounded-0 border-r border-r-solid' : 'border border-solid rounded-ui'}`}
    >
      <nav className="flex flex-col gap-0.5 min-h-full py-2 px-0.75" aria-label="主导航">
        {items.map(({ to, label, icon, bottom, action }) => (
          <Tooltip
            key={to}
            title={navigationIconOnly ? label : undefined}
            placement="right"
            trigger={['hover', 'focus']}
          >
            {action === 'settings' ? (
              <Button
                key={to}
                type="text"
                onClick={() => dispatch(openUserSettings())}
                aria-label="用户设置"
                className={`group mt-auto! flex! flex-col! items-center! justify-center! gap-0.5! min-h-60px h-auto! w-full! py-1! px-0! rounded-control! border-0! bg-transparent! text-nav-text! hover:text-nav-emphasis! layout-focus motion-reduce:transition-none! ${navigationIconOnly ? 'min-h-44px!' : ''}`}
              >
                <span className="flex items-center justify-center w-36px h-36px shrink-0 rounded-control transition-colors duration-140 motion-reduce:transition-none group-hover:bg-nav-hover group-active:bg-nav-pressed">
                  <span className={`${icon} ${iconSizeClass} shrink-0`} aria-hidden="true" />
                </span>
                {!navigationIconOnly && (
                  <span className="text-11px leading-16px whitespace-nowrap">{label}</span>
                )}
              </Button>
            ) : (
              <NavLink
                key={to}
                to={systemPath(system.systemName, to.slice(1))}
                aria-label={label}
                end={to !== '/application' && (to !== '/db' || isDatabaseSetting)}
                className={({ isActive }) =>
                  `group relative flex shrink-0 flex-col items-center justify-center gap-0.5 ${navigationIconOnly ? 'min-h-44px' : 'min-h-60px'} py-1 px-0 rounded-control no-underline transition-colors duration-140 motion-reduce:transition-none layout-focus ${bottom ? 'mt-auto' : ''} ${isActive ? 'text-nav-emphasis! visited:text-nav-emphasis! font-600' : 'text-nav-text! visited:text-nav-text! hover:text-nav-emphasis! visited:hover:text-nav-emphasis!'}`
                }
              >
                {({ isActive, isPending }) => (
                  <>
                    <span
                      className={`flex items-center justify-center w-36px h-36px shrink-0 rounded-control transition-colors duration-140 motion-reduce:transition-none ${isActive ? 'bg-nav-active text-nav-active-text group-hover:bg-nav-active-hover group-active:bg-nav-active-hover' : 'group-hover:bg-nav-hover group-active:bg-nav-pressed'} ${isPending ? 'ring-1 ring-inset ring-nav-emphasis' : ''}`}
                    >
                      <span
                        className={`${isPending ? 'i-lucide-loader-circle animate-spin motion-reduce:animate-none' : icon} ${iconSizeClass} shrink-0`}
                        aria-hidden="true"
                      />
                    </span>
                    {!navigationIconOnly && (
                      <span className="text-11px leading-16px whitespace-nowrap">{label}</span>
                    )}
                    {isPending && (
                      <span className="sr-only" role="status">
                        正在打开{label}…
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )}
          </Tooltip>
        ))}
      </nav>
    </aside>
  );
}
