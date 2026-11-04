/** 全局页头：系统与平台切换、快捷工具和收纳账户入口的用户信息菜单。 */
import { Button, Dropdown, Popover, Tooltip } from 'antd';
import { useContext, useState, useSyncExternalStore } from 'react';
import { useNavigate } from 'react-router';
import logo from '@/assets/logo.jpg';
import { SystemContext } from '@/contexts/SystemContext';
import { platformHome } from '@/router/paths';
import { useAppSelector } from '@/store/hooks';
import { HeaderUserMenu } from './HeaderUserMenu';

const headerTools = [
  { label: '友情链接', icon: 'i-lucide-link', content: '暂无友情链接' },
  { label: '高风险提权', icon: 'i-lucide-shield-keyhole', content: '暂无待处理的提权申请' },
  { label: '快照检视', icon: 'i-lucide-scan-eye', content: '暂无快照检测记录' },
  { label: '小工具', icon: 'i-lucide-wrench', content: '暂无可用工具' },
  { label: '公告', icon: 'i-lucide-megaphone', content: '暂无公告' },
  {
    label: '帮助',
    icon: 'i-lucide-circle-help',
    content: '从左侧菜单切换功能。应用与搜索支持拖动分割线调整侧栏，Ctrl + B 可切换侧栏。',
  },
] as const;

/** 窄屏把工具收进同一个弹层，保留全部入口及说明，避免六枚按钮挤出用户菜单。 */
function CompactHeaderTools() {
  const [selected, setSelected] = useState<string | null>(null);
  const tool = headerTools.find((item) => item.label === selected);
  return (
    <Popover
      arrow={false}
      trigger="click"
      placement="bottomRight"
      onOpenChange={() => setSelected(null)}
      content={
        <div className="w-280px max-w-[calc(100vw-48px)]">
          <div className="grid grid-cols-2 gap-1">
            {headerTools.map((item) => (
              <Button
                key={item.label}
                type="text"
                aria-pressed={selected === item.label}
                icon={
                  <span
                    className="flex items-center justify-center size-28px rounded-control bg-hover text-accent-text"
                    aria-hidden="true"
                  >
                    <span className={`${item.icon} size-18px`} />
                  </span>
                }
                className={`h-48px! min-w-0! justify-start! gap-2! px-2! rounded-control! layout-focus ${selected === item.label ? 'bg-hover! text-accent-text!' : 'text-text-secondary!'}`}
                onClick={() => setSelected(item.label)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          {tool && (
            <div
              className="mt-3 pt-3 border-t border-t-solid border-divider text-13px leading-22px"
              role="status"
            >
              {tool.content}
            </div>
          )}
        </div>
      }
    >
      <Button
        type="text"
        aria-label="打开快捷工具"
        title="快捷工具"
        icon={<span className="i-lucide-ellipsis size-20px" aria-hidden="true" />}
        className="h-36px! w-36px! p-0! text-text-secondary! rounded-control! layout-focus"
      />
    </Popover>
  );
}

function subscribeWideHeader(onChange: () => void) {
  const media = window.matchMedia('(min-width: 1280px)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const getWideHeaderSnapshot = () => window.matchMedia('(min-width: 1280px)').matches;
// 无浏览器渲染时使用紧凑页头；实际挂载后由媒体查询提供窗口状态。
const getServerWideHeaderSnapshot = () => false;

export function AppHeader() {
  const workspace = useContext(SystemContext);
  const navigate = useNavigate();
  const headerToolsIconOnly = useAppSelector((state) => state.preferences.headerToolsIconOnly);
  const wideHeader = useSyncExternalStore(
    subscribeWideHeader,
    getWideHeaderSnapshot,
    getServerWideHeaderSnapshot,
  );
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const showToolTips = headerToolsIconOnly || !wideHeader;
  const contextControlClass = 'h-36px! px-2.5! gap-2! text-13px! rounded-control! layout-focus';
  const toolControlClass = `shrink-0 h-36px! text-13px! text-text-secondary! rounded-control! layout-focus ${showToolTips ? 'w-36px! px-0! gap-0!' : 'px-2.5! gap-2!'}`;
  // 仅图标模式放大图形以提高辨识度，保持按钮尺寸和头部布局稳定。
  const toolIconSizeClass = showToolTips ? 'w-18px h-18px' : 'w-16px h-16px';

  return (
    <header className="shrink-0 min-w-0 text-text bg-header border-b border-b-solid border-divider">
      <div className="flex flex-wrap items-center gap-x-2 min-h-51px px-3 min-[640px]:gap-x-3 min-[640px]:px-4">
        <h1 className="m-0 shrink-0 h-51px flex items-center">
          <Button
            type="text"
            htmlType="button"
            onClick={() => navigate('/')}
            aria-label="灵动参数管家，返回主页"
            title="返回主页"
            className="h-36px! px-1! gap-2! text-text! layout-focus"
          >
            <img
              src={logo}
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="block w-28px h-28px shrink-0 object-contain"
            />
            <span className="text-16px min-[640px]:text-18px font-600 leading-26px whitespace-nowrap">
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

        {/* 520px 已能容纳品牌、六枚工具图标与头像，只有更窄时才整体收纳工具。 */}
        <div className="ml-auto shrink-0 min-[520px]:hidden">
          <CompactHeaderTools />
        </div>
        <nav
          aria-label="快捷工具"
          className={`hidden min-[520px]:flex shrink-0 items-center ml-auto ${showToolTips ? 'gap-1' : 'gap-0'}`}
        >
          {headerTools.map((tool) => (
            <Popover
              key={tool.label}
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
                  icon={<span className={`${tool.icon} ${toolIconSizeClass}`} aria-hidden="true" />}
                  aria-label={tool.label}
                  className={toolControlClass}
                >
                  {!showToolTips && <span>{tool.label}</span>}
                </Button>
              </Tooltip>
            </Popover>
          ))}
        </nav>

        <div className="flex shrink-0 items-center">
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
