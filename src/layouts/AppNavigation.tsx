import { NavLink } from 'react-router';
import { navigationItems } from './navigation';

export function AppNavigation() {
  return (
    <aside className="w-64px shrink-0 overflow-y-auto rounded-8px bg-nav [scrollbar-width:thin] [scrollbar-color:var(--color-nav-hover)_var(--color-nav)] [@media(max-width:600px)]:w-56px">
      <nav className="flex min-h-full flex-col gap-4px px-4px py-8px" aria-label="主导航">
        {navigationItems.map(({ to, label, icon, bottom }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-h-60px shrink-0 flex-col items-center justify-center gap-6px rounded-8px py-8px no-underline transition-colors duration-160 ease-in-out hover:text-nav-emphasis active:bg-nav-pressed focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2 motion-reduce:transition-none ${bottom ? 'mt-auto' : ''} ${isActive ? 'bg-nav-active text-nav-emphasis font-600 hover:bg-nav-active-hover' : 'text-nav-text font-500 hover:bg-nav-hover'}`
            }
            title={label}
          >
            <span className={`${icon} w-22px h-22px shrink-0`} aria-hidden="true" />
            <span className="text-12px leading-18px whitespace-nowrap">{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
