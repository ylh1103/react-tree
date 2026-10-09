import { Avatar, Dropdown, Popover, theme } from 'antd';
import type { CSSProperties } from 'react';
import './AppHeader.css';

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

const contexts = ['应用参数', 'CAC - 信用卡核心 - 核心账务', '系统环境锁定'];

export function AppHeader() {
  const { token } = theme.useToken();

  return (
    <header
      className="app-header"
      style={
        {
          '--header-bg': token.colorBgContainer,
          '--header-border': token.colorBorderSecondary,
          '--header-text': token.colorText,
          '--header-muted': token.colorTextSecondary,
          '--header-soft': token.colorFillQuaternary,
          '--header-hover': token.colorFillSecondary,
          '--header-primary': token.colorPrimary,
          '--header-primary-bg': token.colorPrimaryBg,
          '--header-danger': token.colorErrorText,
          '--header-danger-bg': token.colorErrorBg,
          '--header-danger-border': token.colorErrorBorder,
        } as CSSProperties
      }
    >
      <div className="app-header__main">
        <div className="app-header__brand">
          <svg className="app-header__logo" viewBox="0 0 32 32" aria-hidden="true">
            <path d="M3 11 14 7v21L3 25Z" fill="var(--color-logo-red)" />
            <path d="m14 2 9 4v24l-9-4Z" fill="var(--color-logo-blue)" />
            <path d="m23 6 7-3v19l-7 4Z" fill="var(--color-logo-cyan)" />
          </svg>
          <h1>灵动参数管家</h1>
        </div>

        <div className="app-header__workspace">
          <nav aria-label="当前工作上下文" className="app-header__contexts">
            {contexts.map((label, index) => (
              <Dropdown
                key={label}
                trigger={['click']}
                menu={{ selectedKeys: [label], items: [{ key: label, label }] }}
              >
                <button
                  type="button"
                  className={`app-header__context${index === 1 ? ' app-header__context--application' : ''}`}
                  aria-label={`当前${label}，打开菜单`}
                  title={label}
                >
                  <span className="app-header__context-label">{label}</span>
                  <span className="i-lucide-chevron-down app-header__chevron" aria-hidden="true" />
                </button>
              </Dropdown>
            ))}
          </nav>

          <nav aria-label="快捷工具" className="app-header__tools">
            {headerTools.map((tool) => (
              <Popover
                key={tool.label}
                title={tool.label}
                content={<div className="app-header__popover-content">{tool.content}</div>}
                trigger="click"
                placement="bottomRight"
              >
                <button
                  type="button"
                  aria-label={tool.label}
                  title={tool.label}
                  className={`app-header__tool${'danger' in tool ? ' app-header__tool--danger' : ''}`}
                >
                  <span className={`${tool.icon} app-header__tool-icon`} aria-hidden="true" />
                  <span className="app-header__tool-label">{tool.label}</span>
                </button>
              </Popover>
            ))}
          </nav>
        </div>

        <div className="app-header__account">
          <Dropdown
            trigger={['click']}
            menu={{ selectedKeys: ['st'], items: [{ key: 'st', label: 'ST环境' }] }}
          >
            <button type="button" className="app-header__environment" aria-label="当前环境：ST环境">
              <span className="app-header__status-dot" aria-hidden="true" />
              ST环境
              <span className="i-lucide-chevron-down app-header__chevron" aria-hidden="true" />
            </button>
          </Dropdown>
          <Popover title="当前用户" content="暂无个人资料" trigger="click" placement="bottomRight">
            <button type="button" aria-label="打开用户信息：伟业" className="app-header__user">
              <Avatar
                size={30}
                style={{ backgroundColor: token.colorPrimaryBg, color: token.colorPrimaryText }}
              >
                伟业
              </Avatar>
              <span className="i-lucide-chevron-down app-header__chevron" aria-hidden="true" />
            </button>
          </Popover>
        </div>
      </div>
    </header>
  );
}
