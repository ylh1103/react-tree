import { Avatar, Button, Dropdown, Modal, Popover, theme } from 'antd';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { SystemContext } from '../features/systems/SystemContext';
import { platformHome } from '../features/systems/paths';
import { LayoutSettings } from '../features/preferences/LayoutSettings';

const headerTools = [
  { label: '友情链接', icon: 'i-lucide-panels-top-left', content: '暂无友情链接' },
  { label: '旧版本', icon: 'i-lucide-link', content: '暂无可用的旧版本入口' },
  { label: '高风险提权', icon: 'i-lucide-zap', content: '暂无待处理的提权申请', danger: true },
  { label: '平台管理', icon: 'i-lucide-users-round', content: '暂无可用的平台管理入口' },
  { label: '快照检测', icon: 'i-lucide-square-terminal', content: '暂无快照检测记录' },
  { label: '小工具', icon: 'i-lucide-wrench', content: '暂无可用工具' },
  { label: '公告', icon: 'i-lucide-megaphone', content: '暂无公告' },
  {
    label: '帮助',
    icon: 'i-lucide-circle-help',
    content: '从左侧菜单切换功能。应用与搜索支持拖动分割线调整侧栏，Ctrl / ⌘ B 可切换侧栏。',
  },
] as const;

export function AppHeader() {
  const { token } = theme.useToken();
  const workspace = useContext(SystemContext);
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="shrink-0 min-w-0 text-text bg-header border-b border-b-solid border-divider">
      <div className="flex flex-wrap items-center gap-20px min-h-56px py-8px px-16px [@media(max-width:1200px)]:gap-12px [@media(max-width:1200px)]:px-12px">
        <div className="flex shrink-0 items-center gap-10px pr-20px border-r border-r-solid border-divider [@media(max-width:1200px)]:pr-12px">
          <svg className="w-28px h-28px" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 11 14 7v21L3 25Z" fill="var(--color-logo-red)" />
            <path d="m14 2 9 4v24l-9-4Z" fill="var(--color-logo-blue)" />
            <path d="m23 6 7-3v19l-7 4Z" fill="var(--color-logo-cyan)" />
          </svg>
          <h1 className="m-0 text-17px font-600 leading-24px tracking-0.2px whitespace-nowrap">
            灵动参数管家
          </h1>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-12px min-w-0 [@media(max-width:700px)]:order-3 [@media(max-width:700px)]:basis-full">
          <nav
            aria-label="当前工作上下文"
            className="flex flex-[0_1_auto] items-center gap-8px min-w-0 [@media(max-width:1200px)]:gap-4px"
          >
            {workspace ? (
              <>
                <Button
                  type="text"
                  onClick={() => navigate('/')}
                  aria-label="返回我的系统"
                  title="返回我的系统"
                  icon={<span className="i-lucide-arrow-left w-16px h-16px" aria-hidden="true" />}
                />
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
                  <Button type="text" aria-label="切换参数平台" className="px-8px! text-13px!">
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
                    className="min-w-0 max-w-300px [@media(max-width:1200px)]:max-w-190px px-8px! text-13px!"
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
            className="flex flex-wrap items-center gap-4px ml-auto py-2px pl-12px border-l border-l-solid border-divider [@media(max-width:700px)]:hidden"
          >
            {headerTools.map((tool) => (
              <Popover
                key={tool.label}
                title={tool.label}
                content={
                  <div className="max-w-[min(260px,calc(100vw-48px))] text-13px leading-22px">
                    {tool.content}
                  </div>
                }
                trigger="click"
                placement="bottomRight"
              >
                <Button
                  type="text"
                  htmlType="button"
                  danger={'danger' in tool && tool.danger}
                  icon={<span className={`${tool.icon} w-15px h-15px`} aria-hidden="true" />}
                  aria-label={tool.label}
                  title={tool.label}
                  className="shrink-0 text-12px! gap-6px! px-8px! [@media(max-width:1600px)]:w-32px [@media(max-width:1600px)]:px-0! [@media(max-width:1600px)]:gap-0! motion-reduce:transition-none!"
                >
                  <span className="[@media(max-width:1600px)]:hidden">{tool.label}</span>
                </Button>
              </Popover>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center ml-auto">
          <Popover
            title="当前用户"
            content={
              <div className="flex flex-col gap-8px">
                <span className="workspace-muted">暂无个人资料</span>
                <Button onClick={() => setSettingsOpen(true)}>用户设置</Button>
              </div>
            }
            trigger="click"
            placement="bottomRight"
          >
            <Button
              type="text"
              htmlType="button"
              aria-label="打开用户信息：伟业"
              className="h-40px! px-6px! gap-6px! motion-reduce:transition-none!"
              icon={
                <Avatar
                  size={30}
                  style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimaryText }}
                >
                  伟业
                </Avatar>
              }
            >
              <span
                className="i-lucide-chevron-down shrink-0 w-12px h-12px opacity-65"
                aria-hidden="true"
              />
            </Button>
          </Popover>
        </div>
      </div>
      <Modal
        title="用户设置"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={<Button onClick={() => setSettingsOpen(false)}>关闭</Button>}
      >
        <LayoutSettings />
      </Modal>
    </header>
  );
}
