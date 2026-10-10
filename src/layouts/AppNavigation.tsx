import { NavLink, useLocation } from 'react-router';
import { navigationItems, databaseNavigationItems } from './navigation';
import { useSystemWorkspace } from '../features/systems/SystemContext';
import { systemPath } from '../features/systems/paths';
import { useLayoutPreferences } from '../features/preferences/useLayoutPreferences';

export function AppNavigation() {
  const { system, platform } = useSystemWorkspace();
  const { layoutMode } = useLayoutPreferences();
  const { pathname } = useLocation();
  const isDatabaseSetting =
    pathname.replace(/\/$/, '') === systemPath(system.systemName, 'db/setting');
  const items = platform === 'database' ? databaseNavigationItems : navigationItems;
  return (
    <aside
      className={`w-60px shrink-0 overflow-y-auto bg-nav [scrollbar-width:thin] [scrollbar-color:var(--color-nav-hover)_var(--color-nav)] ${layoutMode === 'compact' ? 'rounded-0 border-r border-r-solid border-nav-hover' : 'border border-solid border-nav-hover rounded-8px'}`}
    >
      <nav className="flex flex-col gap-4px min-h-full py-8px px-3px" aria-label="主导航">
        {items.map(({ to, label, icon, bottom }) => (
          <NavLink
            key={to}
            to={systemPath(system.systemName, to.slice(1))}
            end={to !== '/application' && (to !== '/db' || isDatabaseSetting)}
            className={({ isActive }) =>
              `relative flex shrink-0 flex-col items-center justify-center gap-5px min-h-54px py-7px px-0 rounded-6px no-underline transition-colors duration-140 motion-reduce:transition-none active:bg-nav-pressed focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-nav-emphasis focus-visible:outline-offset-[-2px] ${bottom ? 'mt-auto' : ''} ${isActive ? "text-nav-emphasis bg-nav-active font-600 hover:bg-nav-active-hover before:content-[''] before:absolute before:top-18px before:bottom-18px before:left-0 before:w-2px before:rounded-2px before:bg-current" : 'text-nav-text hover:text-nav-emphasis hover:bg-nav-hover'}`
            }
            title={label}
          >
            <span className={`${icon} w-20px h-20px shrink-0`} aria-hidden="true" />
            <span className="text-12px leading-18px whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
