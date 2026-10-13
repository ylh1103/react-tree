import { App as AntdApp, Avatar, Button, Dropdown, Popover, Tooltip } from 'antd';
import { useContext, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import logo from '../assets/logo.jpg';
import { SystemContext } from '../contexts/SystemContext';
import { platformHome } from '../router/paths';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openUserSettings } from '../store/slices/preferencesSlice';

const headerTools = [
  { label: '友情链接', icon: 'i-lucide-panels-top-left', content: '暂无友情链接' },
  { label: '旧版本', icon: 'i-lucide-link', content: '暂无可用的旧版本入口' },
  { label: '高风险提权', icon: 'i-lucide-zap', content: '暂无待处理的提权申请', danger: true },
  { label: '平台管理', icon: 'i-lucide-users-round', content: '暂无可用的平台管理入口' },
  { label: '快照检视', icon: 'i-lucide-square-terminal', content: '暂无快照检测记录' },
  { label: '小工具', icon: 'i-lucide-wrench', content: '暂无可用工具' },
  { label: '公告', icon: 'i-lucide-megaphone', content: '暂无公告' },
  {
    label: '帮助',
    icon: 'i-lucide-circle-help',
    content: '从左侧菜单切换功能。应用与搜索支持拖动分割线调整侧栏，Ctrl / ⌘ B 可切换侧栏。',
  },
] as const;

function subscribeWideHeader(onChange: () => void) {
  const media = window.matchMedia('(min-width: 1280px)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getWideHeaderSnapshot = () => window.matchMedia('(min-width: 1280px)').matches;

export function AppHeader() {
  const workspace = useContext(SystemContext);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const headerToolsIconOnly = useAppSelector((state) => state.preferences.headerToolsIconOnly);
  const wideHeader = useSyncExternalStore(subscribeWideHeader, getWideHeaderSnapshot);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const showToolTips = headerToolsIconOnly || !wideHeader;
  const { message } = AntdApp.useApp();

  return (
    <header className="shrink-0 min-w-0 text-text bg-header border-b border-b-solid border-divider">
      <div className="flex items-center gap-4 min-h-56px py-2 px-4">
        <h1 className="m-0 shrink-0 pr-4">
          <Button
            type="text"
            htmlType="button"
            onClick={() => navigate('/')}
            aria-label="灵动参数管家，返回主页"
            title="返回主页"
            className="h-40px! px-1! gap-2.5! text-text! layout-focus motion-reduce:transition-none!"
          >
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              className="block w-32px h-32px shrink-0 object-contain"
            />
            <span className="text-17px font-600 leading-24px tracking-0.2px whitespace-nowrap">
              灵动参数管家
            </span>
          </Button>
        </h1>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <nav
            aria-label="当前工作上下文"
            className="flex flex-[0_1_auto] items-center gap-2 min-w-0"
          >
            {workspace ? (
              <>
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
                  <Button type="text" aria-label="切换参数平台" className="px-2! text-13px!">
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
                    className="min-w-0 max-w-190px wide:max-w-300px px-2! text-13px!"
                  >
                    <span className="truncate">
                      {workspace.system.systemName} · {workspace.system.systemChineseName}
                    </span>
                    <span
                      className="i-lucide-chevron-down shrink-0 w-12px h-12px"
                      aria-hidden="true"
                    />
                  </Button>
                </Dropdown>
              </>
            ) : (
              <span className="text-13px text-text-muted">参数管理平台</span>
            )}
          </nav>

          <nav
            aria-label="快捷工具"
            className={`flex items-center ml-auto py-0.5 pl-3 ${showToolTips ? 'gap-1.5' : 'gap-1'}`}
          >
            {headerTools.map((tool) => (
              <Popover
                key={tool.label}
                title={tool.label}
                content={<div className="max-w-260px text-13px leading-22px">{tool.content}</div>}
                trigger="click"
                placement="bottomRight"
                open={activeTool === tool.label}
                onOpenChange={(open) => setActiveTool(open ? tool.label : null)}
              >
                <Tooltip
                  title={showToolTips ? tool.label : undefined}
                  placement="bottom"
                  trigger={['hover', 'focus']}
                  open={activeTool === tool.label ? false : undefined}
                >
                  <Button
                    type="text"
                    htmlType="button"
                    danger={'danger' in tool && tool.danger}
                    icon={
                      <span
                        className={`${tool.icon} ${headerToolsIconOnly ? 'w-18px h-18px' : 'w-15px h-15px'}`}
                        aria-hidden="true"
                      />
                    }
                    aria-label={tool.label}
                    className={`shrink-0 text-12px! motion-reduce:transition-none! ${showToolTips ? 'w-44px! h-36px! px-3! gap-0! rounded-control!' : 'w-auto px-2! gap-1.5!'}`}
                  >
                    {!headerToolsIconOnly && (
                      <span className="hidden desktop:inline">{tool.label}</span>
                    )}
                  </Button>
                </Tooltip>
              </Popover>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center pl-3">
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            popupRender={(menu) => (
              <div className="min-w-200px rounded-ui bg-surface shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-b-solid border-divider">
                  <div className="text-14px font-600 text-text">伟业</div>
                  <div className="mt-1 text-12px text-text-secondary">当前用户 · 暂无个人资料</div>
                </div>
                {menu}
              </div>
            )}
            menu={{
              selectable: false,
              className:
                'shadow-none! rounded-0! p-1.5! [&_.ant-dropdown-menu-item]:min-h-36px [&_.ant-dropdown-menu-item]:px-2.5! [&_.ant-dropdown-menu-item]:gap-2!',
              items: [
                {
                  key: 'settings',
                  label: '用户配置',
                  icon: <span className="i-lucide-settings-2 w-16px h-16px" aria-hidden="true" />,
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  label: '退出登录',
                  icon: <span className="i-lucide-log-out w-16px h-16px" aria-hidden="true" />,
                },
              ],
              onClick: ({ key }) => {
                if (key === 'settings') dispatch(openUserSettings());
                if (key === 'logout') {
                  void message.info('当前为演示环境，暂未接入登录服务');
                }
              },
            }}
          >
            <Button
              type="text"
              htmlType="button"
              aria-label="打开用户菜单：伟业"
              className="h-40px! w-auto! min-w-56px! px-3! rounded-control! hover:bg-watermark! active:bg-hover! layout-focus motion-reduce:transition-none!"
              icon={
                <Avatar
                  size={30}
                  aria-hidden="true"
                  className="bg-hover! text-accent-text! text-14px! font-500"
                >
                  伟
                </Avatar>
              }
            />
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
