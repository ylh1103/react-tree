/** 导航消费分平台路由定义，所有菜单均跳转页面，URL 决定选中项。 */
import { Tooltip } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { generatePath, NavLink, useLocation } from 'react-router';
import { applicationRouteConfig as navigationItems } from '@/router/application';
import { databaseRouteConfig as databaseNavigationItems } from '@/router/database';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { systemPath } from '@/router/paths';
import { NavigationFrame } from './LayoutFrame';

export function AppNavigation() {
  const { system, platform } = useSystemWorkspace();
  const { pathname } = useLocation();
  const navigationIconOnly = useAppSelector((state) => state.preferences.navigationIconOnly);
  const iconSizeClass = navigationIconOnly ? 'w-24px h-24px' : 'w-22px h-22px';
  const isDatabaseSetting =
    pathname.replace(/\/$/, '') === systemPath(system.systemName, 'db/setting');
  const items = platform === 'database' ? databaseNavigationItems : navigationItems;
  return (
    <NavigationFrame>
      <nav className="flex flex-col gap-0.5 min-h-full py-2 px-0.75" aria-label="主导航">
        {items.map(({ path, label, icon, bottom }) => {
          // 不传可选参数时生成清单入口，避免与路由 path 维护两份地址。
          const page = generatePath(path);
          return (
            <Tooltip
              key={path}
              title={navigationIconOnly ? label : undefined}
              placement="right"
              trigger={['hover', 'focus']}
            >
              <NavLink
                key={path}
                to={systemPath(system.systemName, page)}
                aria-label={label}
                end={page !== 'application' && (page !== 'db' || isDatabaseSetting)}
                className={({ isActive }) =>
                  `group relative flex shrink-0 flex-col items-center justify-center gap-0.5 ${navigationIconOnly ? 'min-h-44px' : 'min-h-60px'} py-1 px-0 rounded-control no-underline transition-colors duration-140 motion-reduce:transition-none layout-focus ${bottom ? 'mt-auto' : ''} ${isActive ? 'text-nav-emphasis! visited:text-nav-emphasis! font-600' : 'text-nav-text! visited:text-nav-text! hover:text-nav-emphasis! visited:hover:text-nav-emphasis!'}`
                }
              >
                {({ isActive, isPending }) => (
                  <>
                    <span
                      className={`
                        flex items-center justify-center w-36px h-36px shrink-0 rounded-control
                        transition-colors duration-140 motion-reduce:transition-none
                        ${isActive ? 'bg-nav-active text-nav-active-text group-hover:bg-nav-active-hover group-active:bg-nav-active-hover' : 'group-hover:bg-nav-hover group-active:bg-nav-pressed'}
                        ${isPending ? 'ring-1 ring-inset ring-nav-emphasis' : ''}
                      `}
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
            </Tooltip>
          );
        })}
      </nav>
    </NavigationFrame>
  );
}
