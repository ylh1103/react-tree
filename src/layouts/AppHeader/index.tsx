/** 全局页头：系统与平台切换、快捷工具和收纳账户入口的用户信息菜单。 */
import { Button, Dropdown } from 'antd';
import { useContext } from 'react';
import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';
import { SystemContext } from '@/contexts/SystemContext';
import { platformHome } from '@/router/workspace/paths';
import { HeaderTools } from './HeaderTools';
import { HeaderUserMenu } from './HeaderUserMenu';

export function AppHeader() {
  const workspace = useContext(SystemContext);
  const navigate = useNavigate();
  const contextControlClass = 'h-36px! px-2.5! gap-2! text-13px! rounded-control! layout-focus';

  return (
    <header className="shrink-0 min-w-0 text-surface-text bg-header border-b border-b-solid border-divider">
      <div className="flex flex-wrap items-center gap-x-2 min-h-51px px-3 min-[640px]:gap-x-3 min-[640px]:px-4">
        <h1 className="m-0 min-w-0 h-51px flex items-center">
          <Button
            type="text"
            htmlType="button"
            onClick={() => navigate('/')}
            aria-label="灵动参数管家，返回主页"
            title="返回主页"
            className="h-36px! min-w-0 max-w-full px-1! gap-2! text-text! layout-focus"
          >
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="block w-28px h-28px shrink-0 object-contain"
            />
            <span className="min-w-0 truncate text-16px min-[640px]:text-18px font-600 leading-26px">
              灵动参数管家
            </span>
          </Button>
        </h1>
        {workspace && (
          <nav
            aria-label="当前工作上下文"
            className="order-4 flex w-full items-center gap-2 min-w-0 h-48px border-t border-t-solid border-divider min-[960px]:order-none min-[960px]:flex-1 min-[960px]:w-auto min-[960px]:h-51px min-[960px]:border-t-0"
          >
            <Dropdown
              trigger={['click']}
              menu={{
                selectedKeys: [workspace.platform],
                items: [
                  { key: 'application', label: '应用参数' },
                  { key: 'database', label: '数据库参数' },
                ],
                onClick: ({ key }) =>
                  navigate(
                    platformHome(
                      workspace.system.systemName,
                      key === 'database' ? 'database' : 'application',
                    ),
                  ),
              }}
            >
              <Button
                type="text"
                aria-label="切换参数平台"
                className={`${contextControlClass} shrink-0 bg-sidebar! text-text-secondary! hover:bg-hover! hover:text-accent-text!`}
              >
                <span
                  className={`${workspace.platform === 'database' ? 'i-lucide-database' : 'i-lucide-boxes'} w-16px h-16px`}
                  aria-hidden="true"
                />
                {workspace.platform === 'database' ? '数据库参数' : '应用参数'}
                <span className="i-lucide-chevron-down w-12px h-12px" aria-hidden="true" />
              </Button>
            </Dropdown>
            <Dropdown
              trigger={['click']}
              menu={{
                selectedKeys: [workspace.system.systemName],
                items: workspace.systems.map((system) => ({
                  key: system.systemName,
                  label: `${system.systemName} · ${system.systemChineseName}`,
                })),
                onClick: ({ key }) => navigate(platformHome(key, workspace.platform)),
              }}
            >
              <Button
                aria-label="切换系统"
                title={`${workspace.system.systemName} · ${workspace.system.systemChineseName}`}
                className={`
                      ${contextControlClass}
                      flex-1 min-w-0! max-w-full min-[960px]:max-w-360px wide:max-w-440px text-text! border-border-subtle!
                      [&>.ant-btn-content]:min-w-0 [&>.ant-btn-content]:flex-1
                    `}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="min-w-0 truncate font-600">{workspace.system.systemName}</span>
                  <span className="truncate text-text-secondary">
                    {workspace.system.systemChineseName}
                  </span>
                </span>
                <span
                  className="i-lucide-chevron-down shrink-0 w-12px h-12px text-text-muted"
                  aria-hidden="true"
                />
              </Button>
            </Dropdown>
          </nav>
        )}

        <HeaderTools />

        <div className="flex shrink-0 items-center">
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
