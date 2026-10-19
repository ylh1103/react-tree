/** 全局页头：系统切换、平台切换、常用工具与显示设置入口。 */
import { Button, Dropdown, Popover, Tooltip } from 'antd';
import { useContext, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import logo from '../assets/logo.jpg';
import { SystemContext } from '../contexts/SystemContext';
import { platformHome } from '../router/paths';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { openUserSettings } from '../store/slices/preferencesSlice';

const headerTools = [
  { label: '友情链接', icon: 'i-lucide-panels-top-left', content: '暂无友情链接' },
  { label: '旧版本', icon: 'i-lucide-history', content: '暂无可用的旧版本入口' },
  { label: '高风险提权', icon: 'i-lucide-shield-alert', content: '暂无待处理的提权申请' },
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
const primaryTools = headerTools.slice(5);
const secondaryTools = headerTools.slice(0, 5);

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
  const [moreOpen, setMoreOpen] = useState(false);
  const activeSecondaryTool = secondaryTools.find((tool) => tool.label === activeTool);
  const showToolTips = headerToolsIconOnly || !wideHeader;
  const contextControlClass =
    'h-36px! px-2.5! gap-2! text-13px! rounded-control! layout-focus motion-reduce:transition-none!';
  const toolControlClass = `shrink-0 h-36px! text-13px! text-text-secondary! rounded-control! layout-focus motion-reduce:transition-none! ${showToolTips ? 'w-36px! px-0! gap-0!' : 'px-2.5! gap-2!'}`;

  return (
    <header className="shrink-0 min-w-0 text-text bg-header border-b border-b-solid border-divider">
      <div className="flex items-center gap-4 h-51px px-4">
        <h1 className="m-0 shrink-0">
          <Button
            type="text"
            htmlType="button"
            onClick={() => navigate('/')}
            aria-label="灵动参数管家，返回主页"
            title="返回主页"
            className="h-36px! px-1! gap-2! text-text! layout-focus motion-reduce:transition-none!"
          >
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="block w-28px h-28px shrink-0 object-contain"
            />
            <span className="text-18px font-600 leading-26px whitespace-nowrap">灵动参数管家</span>
          </Button>
        </h1>
        <span className="h-20px w-1px shrink-0 bg-divider" aria-hidden="true" />

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <nav aria-label="当前工作上下文" className="flex flex-1 items-center gap-2 min-w-0">
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
                    className={`${contextControlClass} min-w-0 max-w-360px wide:max-w-440px text-text! border-border-subtle! [&>.ant-btn-content]:min-w-0 [&>.ant-btn-content]:flex-1`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 font-600">{workspace.system.systemName}</span>
                      <span className="h-12px w-1px shrink-0 bg-divider" aria-hidden="true" />
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
              </>
            ) : (
              <span className="text-13px text-text-muted">参数管理平台</span>
            )}
          </nav>

          <nav aria-label="快捷工具" className="flex shrink-0 items-center ml-auto gap-1">
            {primaryTools.map((tool) => (
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
                    icon={<span className={`${tool.icon} w-16px h-16px`} aria-hidden="true" />}
                    aria-label={tool.label}
                    className={toolControlClass}
                  >
                    {!showToolTips && <span>{tool.label}</span>}
                  </Button>
                </Tooltip>
              </Popover>
            ))}
            <Popover
              title={activeSecondaryTool?.label}
              content={
                <div className="max-w-260px text-13px leading-22px">
                  {activeSecondaryTool?.content}
                </div>
              }
              trigger="click"
              placement="bottomRight"
              open={Boolean(activeSecondaryTool)}
              onOpenChange={(open) => {
                if (!open) setActiveTool(null);
              }}
            >
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                open={moreOpen}
                onOpenChange={(open) => {
                  setMoreOpen(open);
                  if (open) setActiveTool(null);
                }}
                menu={{
                  selectable: false,
                  className:
                    'min-w-200px [&_.ant-dropdown-menu-item]:min-h-36px [&_.ant-dropdown-menu-item]:gap-2!',
                  items: [
                    {
                      type: 'group',
                      label: '管理与检视',
                      children: secondaryTools.slice(2).map((tool) => ({
                        key: tool.label,
                        label: tool.label,
                        icon: <span className={`${tool.icon} w-16px h-16px`} aria-hidden="true" />,
                      })),
                    },
                    { type: 'divider' },
                    {
                      type: 'group',
                      label: '相关入口',
                      children: secondaryTools.slice(0, 2).map((tool) => ({
                        key: tool.label,
                        label: tool.label,
                        icon: <span className={`${tool.icon} w-16px h-16px`} aria-hidden="true" />,
                      })),
                    },
                  ],
                  onClick: ({ key }) => {
                    setMoreOpen(false);
                    setActiveTool(key);
                  },
                }}
              >
                <Tooltip
                  title={showToolTips && !moreOpen && !activeSecondaryTool ? '更多工具' : undefined}
                  trigger={['hover', 'focus']}
                >
                  <Button
                    type="text"
                    aria-label="更多工具"
                    className={toolControlClass}
                    icon={<span className="i-lucide-ellipsis w-16px h-16px" aria-hidden="true" />}
                  >
                    {!showToolTips && <span>更多</span>}
                  </Button>
                </Tooltip>
              </Dropdown>
            </Popover>
          </nav>
        </div>

        <div className="flex shrink-0 items-center pl-3 border-l border-l-solid border-divider">
          <Tooltip title="显示设置">
            <Button
              type="text"
              aria-label="显示设置"
              onClick={() => dispatch(openUserSettings())}
              className="h-36px! w-36px! px-0! rounded-control! layout-focus"
              icon={<span className="i-lucide-settings-2 w-16px h-16px" aria-hidden="true" />}
            />
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
