import { Button, Tooltip } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openUserSettings } from '../store/preferencesSlice';
import { NavLink, useLocation } from 'react-router';
import { navigationItems, databaseNavigationItems } from './navigation';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { systemPath } from '../features/systems/paths';
import { useLayoutPreferences } from '../features/preferences/useLayoutPreferences';

export function AppNavigation() {
  const { system, platform } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const navigationIconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const isDatabaseSetting =
    pathname.replace(/\/$/, '') === systemPath(system.systemName, 'db/setting');
  const items = platform === 'database' ? databaseNavigationItems : navigationItems;
  return (
    <aside
      className={`${navigationIconOnly ? 'w-48px' : 'w-60px'} shrink-0 overflow-y-auto bg-nav [scrollbar-width:thin] [scrollbar-color:var(--color-nav-hover)_var(--color-nav)] ${layoutMode === 'compact' ? 'rounded-0 border-r border-r-solid border-nav-hover' : 'border border-solid border-nav-hover rounded-8px'}`}
    >
      <nav className="flex flex-col gap-1 min-h-full py-2 px-0.75" aria-label="主导航">
        {items.map(({ to, label, icon, bottom }) => (
          <Tooltip
            key={to}
            title={navigationIconOnly ? label : undefined}
            placement="right"
            trigger={['hover', 'focus']}
          >
            {to.endsWith('/setting') ? (
              <Button
                key={to}
                type="text"
                onClick={() => dispatch(openUserSettings())}
                aria-label="用户设置"
                className={`navigation-settings ${navigationIconOnly ? 'min-h-44px!' : ''}`}
              >
                <span className={`${icon} w-20px h-20px shrink-0`} aria-hidden="true" />
                {!navigationIconOnly && (
                  <span className="text-12px leading-18px whitespace-nowrap">{label}</span>
                )}
              </Button>
            ) : (
              <NavLink
                key={to}
                to={systemPath(system.systemName, to.slice(1))}
                aria-label={label}
                end={to !== '/application' && (to !== '/db' || isDatabaseSetting)}
                className={({ isActive, isPending }) =>
                  `relative flex shrink-0 flex-col items-center justify-center gap-1.25 ${navigationIconOnly ? 'min-h-44px' : 'min-h-54px'} py-1.75 px-0 rounded-6px no-underline transition-colors duration-140 motion-reduce:transition-none active:bg-nav-pressed focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-nav-emphasis focus-visible:outline-offset-[-2px] ${bottom ? 'mt-auto' : ''} ${isPending ? 'ring-1 ring-inset ring-nav-emphasis bg-nav-hover' : ''} ${isActive ? "text-nav-active-text! visited:text-nav-active-text! bg-nav-active font-600 hover:bg-nav-active-hover before:content-[''] before:absolute before:top-18px before:bottom-18px before:left-0 before:w-2px before:rounded-2px before:bg-current" : 'text-nav-text! visited:text-nav-text! hover:text-nav-emphasis! visited:hover:text-nav-emphasis! hover:bg-nav-hover'}`
                }
              >
                {({ isPending }) => (
                  <>
                    <span
                      className={`${isPending ? 'i-lucide-loader-circle animate-spin motion-reduce:animate-none' : icon} w-20px h-20px shrink-0`}
                      aria-hidden="true"
                    />
                    {!navigationIconOnly && (
                      <span className="text-12px leading-18px whitespace-nowrap">{label}</span>
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
