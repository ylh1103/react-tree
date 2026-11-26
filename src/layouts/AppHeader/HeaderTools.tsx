/** 桌面工具栏和窄屏菜单共用入口配置及浮层，保持两种布局的操作一致。 */
import { Button, Dropdown, Modal, Popover, Tooltip, type MenuProps } from 'antd';
import { useRef, useState, useSyncExternalStore } from 'react';
import supportGroupQr from '@/assets/support-group-qr.jpg';
import { snapshotReviewRoute, toolboxRoute } from '@/router/site/paths';
import { useAppSelector } from '@/store/hooks';
import { helpLinks, relatedSites, supportGroupHref } from './headerResources';
import { headerMenuFocusClass } from './headerMenuStyles';
import { newTabMenuItem } from './newTabMenuItem';

const dialogs = {
  elevation: { label: '高风险提权', icon: 'i-lucide-zap' },
  announcement: { label: '公告', icon: 'i-lucide-megaphone' },
} as const;

type DialogKey = keyof typeof dialogs;
type Tool = { label: string; icon: string } & (
  { kind: 'sites' } | { kind: 'dialog'; dialog: DialogKey } | { kind: 'link'; href: string }
);

const tools: Tool[] = [
  {
    kind: 'link',
    label: '快照检视',
    icon: 'i-lucide-scan-eye',
    href: `/${snapshotReviewRoute}`,
  },
  { kind: 'link', label: '小工具', icon: 'i-lucide-wrench', href: `/${toolboxRoute}` },
  { kind: 'sites', label: '友情链接', icon: 'i-lucide-link' },
  { kind: 'dialog', dialog: 'announcement', ...dialogs.announcement },
];

function SiteIcon({ iconUrl }: { iconUrl?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className="grid size-32px shrink-0 place-items-center rounded-control bg-sidebar"
      aria-hidden="true"
    >
      {iconUrl && !failed ? (
        <img
          src={iconUrl}
          alt=""
          width={18}
          height={18}
          className="size-18px object-contain"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="i-lucide-globe size-16px text-text-secondary" />
      )}
    </span>
  );
}

const toolMenuWidth = 'w-256px max-w-[calc(100vw-32px)]';
const siteMenuClass = `${toolMenuWidth} p-3!`;

const relatedSiteItems: NonNullable<MenuProps['items']> = relatedSites.length
  ? relatedSites.map(({ label, href, iconUrl }) => ({
      ...newTabMenuItem(
        label,
        href,
        <span className="flex min-w-0 items-center gap-3 py-1.5">
          <SiteIcon iconUrl={iconUrl} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-500 leading-5">{label}</span>
            <span className="truncate text-12px leading-4 text-text-secondary">
              {new URL(href).hostname}
            </span>
          </span>
          <span
            className="i-lucide-arrow-up-right size-14px shrink-0 text-text-muted"
            aria-hidden="true"
          />
        </span>,
      ),
      className: `h-auto! min-h-48px! [&_a]:block ${headerMenuFocusClass}`,
    }))
  : [{ key: 'empty', label: '暂无友情链接', disabled: true }];

function subscribeWideHeader(onChange: () => void) {
  const media = window.matchMedia('(min-width: 1280px)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const getWideHeaderSnapshot = () => window.matchMedia('(min-width: 1280px)').matches;
const getServerWideHeaderSnapshot = () => false;

function HelpContent() {
  return (
    <div className="grid w-300px max-w-[calc(100vw-104px)] gap-3">
      <ul className="m-0 grid list-none gap-0.5 p-0">
        {helpLinks.map(({ label, detail, href, icon }) => (
          <li key={label}>
            <Button
              type="text"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label}（在新页签打开）`}
              className="h-auto! min-h-52px w-full justify-start! gap-3! px-2! py-2! layout-focus"
            >
              <span
                className="grid size-32px shrink-0 place-items-center rounded-control bg-sidebar text-accent-text"
                aria-hidden="true"
              >
                <span className={`${icon} size-16px`} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 whitespace-normal text-left">
                <span className="text-sm font-600 leading-5">{label}</span>
                <span className="text-12px leading-4 text-text-secondary">{detail}</span>
              </span>
              <span
                className="i-lucide-arrow-up-right size-14px shrink-0 text-text-muted"
                aria-hidden="true"
              />
            </Button>
          </li>
        ))}
      </ul>
      <section
        aria-label="支持群"
        className="flex items-center justify-between gap-2 rounded-control bg-sidebar p-3"
      >
        <div className="grid min-w-0 justify-items-start gap-1">
          <h3 className="m-0 text-sm font-600 leading-5">支持群</h3>
          <p className="m-0 text-12px leading-4 text-text-secondary">扫码或点击链接加入</p>
          <Button
            type="link"
            href={supportGroupHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="加入支持群（在新页签打开）"
            className="h-28px! gap-1! px-0! text-12px! layout-focus"
          >
            加入支持群
            <span className="i-lucide-arrow-up-right size-14px" aria-hidden="true" />
          </Button>
        </div>
        <img
          src={supportGroupQr}
          alt="支持群二维码"
          width={611}
          height={608}
          className="block h-auto w-80px min-[560px]:w-112px shrink-0 rounded-control bg-white p-1.5"
        />
      </section>
    </div>
  );
}

export function HeaderTools() {
  const iconOnly = useAppSelector((state) => state.preferences.headerToolsIconOnly);
  const wideHeader = useSyncExternalStore(
    subscribeWideHeader,
    getWideHeaderSnapshot,
    getServerWideHeaderSnapshot,
  );
  const [dialog, setDialog] = useState<DialogKey | 'help' | null>(null);
  const [sitesOpen, setSitesOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const compactButton = useRef<HTMLButtonElement>(null);
  const [compactView, setCompactView] = useState<'tools' | 'sites' | null>(null);
  const showIconsOnly = iconOnly || !wideHeader;
  const controlClass = 'shrink-0 text-13px! text-text-secondary! rounded-control! layout-focus';
  const desktopControlClass = `${controlClass} h-36px! ${showIconsOnly ? 'w-36px! px-0! gap-0!' : 'px-2.5! gap-2!'}`;
  const compactControlClass = `${controlClass} size-44px! px-0! gap-0!`;

  const compactToolItems: MenuProps['items'] = tools.map((tool) => {
    const icon = <span className={`${tool.icon} size-16px`} aria-hidden="true" />;
    if (tool.kind === 'sites') {
      return { key: tool.kind, label: tool.label, icon };
    }
    if (tool.kind === 'link') {
      return { ...newTabMenuItem(tool.label, tool.href), icon };
    }
    return { key: tool.dialog, label: tool.label, icon, onClick: () => setDialog(tool.dialog) };
  });
  const compactItems: MenuProps['items'] = [
    {
      key: 'elevation',
      label: dialogs.elevation.label,
      icon: (
        <span className={`${dialogs.elevation.icon} size-16px text-danger`} aria-hidden="true" />
      ),
      onClick: () => setDialog('elevation'),
    },
    { type: 'divider' },
    ...compactToolItems,
    {
      key: 'help',
      label: '帮助',
      icon: <span className="i-lucide-circle-help size-16px" aria-hidden="true" />,
      onClick: () => setDialog('help'),
    },
  ];
  // 返回入口与友情链接入口复用同一个菜单项，使列表切换时键盘焦点留在原位。
  const compactSiteItems: MenuProps['items'] = [
    {
      key: 'sites',
      label: '返回快捷工具',
      icon: <span className="i-lucide-arrow-left size-16px" aria-hidden="true" />,
      className: 'layout-focus',
    },
    { type: 'divider' },
    ...relatedSiteItems,
  ];

  return (
    <>
      <nav
        aria-label="快捷工具"
        className={`ml-auto flex shrink-0 items-center gap-1 ${showIconsOnly ? 'min-[560px]:gap-2' : ''}`}
      >
        <Tooltip
          title={showIconsOnly ? dialogs.elevation.label : undefined}
          placement="bottom"
          trigger={['hover', 'focus']}
          open={dialog ? false : undefined}
        >
          <Button
            type="text"
            className={`${desktopControlClass} hidden! min-[560px]:inline-flex!`}
            icon={
              <span
                className={`${dialogs.elevation.icon} ${showIconsOnly ? 'size-18px' : 'size-16px'} text-danger`}
                aria-hidden="true"
              />
            }
            aria-label={dialogs.elevation.label}
            aria-haspopup="dialog"
            onClick={() => {
              setCompactView(null);
              setSitesOpen(false);
              setDialog('elevation');
            }}
          >
            {showIconsOnly ? null : <span className="text-danger">{dialogs.elevation.label}</span>}
          </Button>
        </Tooltip>
        <div className="min-[560px]:hidden">
          <Dropdown
            menu={{
              items: compactView === 'sites' ? compactSiteItems : compactItems,
              className: compactView === 'sites' ? siteMenuClass : toolMenuWidth,
              onClick: ({ key }) =>
                setCompactView(
                  key === 'sites' ? (compactView === 'sites' ? 'tools' : 'sites') : null,
                ),
            }}
            open={compactView !== null}
            onOpenChange={(open, { source }) => {
              if (source === 'trigger') setCompactView(open ? 'tools' : null);
            }}
            trigger={['click']}
            placement="bottomRight"
            align={{ offset: [0, 10] }}
          >
            <Button
              ref={compactButton}
              type="text"
              aria-label="打开快捷工具"
              aria-haspopup="menu"
              aria-expanded={compactView !== null}
              title="快捷工具"
              icon={<span className="i-lucide-ellipsis size-20px" aria-hidden="true" />}
              className={compactControlClass}
            />
          </Dropdown>
        </div>
        <div
          className={`hidden min-[560px]:flex items-center ${showIconsOnly ? 'gap-2' : 'gap-0'}`}
        >
          {tools.map((tool) => {
            const label = tool.kind === 'link' ? `${tool.label}（在新页签打开）` : tool.label;
            const button = (
              <Button
                type="text"
                icon={
                  <span
                    className={`${tool.icon} ${showIconsOnly ? 'size-18px' : 'size-16px'}`}
                    aria-hidden="true"
                  />
                }
                aria-label={label}
                aria-haspopup={
                  tool.kind === 'dialog' ? 'dialog' : tool.kind === 'sites' ? 'menu' : undefined
                }
                aria-expanded={tool.kind === 'sites' ? sitesOpen : undefined}
                className={desktopControlClass}
                {...(tool.kind === 'link'
                  ? { href: tool.href, target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                onClick={tool.kind === 'dialog' ? () => setDialog(tool.dialog) : undefined}
              >
                {showIconsOnly ? null : tool.label}
              </Button>
            );
            const trigger = (
              <Tooltip
                key={tool.label}
                title={showIconsOnly ? label : undefined}
                placement="bottom"
                trigger={['hover', 'focus']}
                open={(tool.kind === 'sites' && sitesOpen) || dialog ? false : undefined}
              >
                {button}
              </Tooltip>
            );
            return tool.kind === 'sites' ? (
              <Dropdown
                key={tool.label}
                menu={{
                  items: relatedSiteItems,
                  className: siteMenuClass,
                }}
                trigger={['click']}
                placement="bottomRight"
                align={{ offset: [0, 10] }}
                open={sitesOpen}
                onOpenChange={setSitesOpen}
              >
                {trigger}
              </Dropdown>
            ) : (
              trigger
            );
          })}
        </div>
        <div
          className="hidden min-[560px]:block"
          onKeyDown={(event) => {
            if (event.key === 'Escape' && helpOpen) {
              event.stopPropagation();
              setHelpOpen(false);
              helpButton.current?.focus();
            }
          }}
        >
          <Popover
            content={<HelpContent />}
            trigger="click"
            placement="bottomRight"
            arrow={false}
            align={{ offset: [0, 10] }}
            open={helpOpen}
            onOpenChange={setHelpOpen}
            getPopupContainer={(trigger) => trigger.parentElement ?? trigger}
          >
            <Button
              ref={helpButton}
              type="text"
              className={desktopControlClass}
              aria-label="帮助"
              aria-expanded={helpOpen}
              title={showIconsOnly && !helpOpen ? '帮助' : undefined}
              icon={
                <span
                  className={`i-lucide-circle-help ${showIconsOnly ? 'size-18px' : 'size-16px'}`}
                  aria-hidden="true"
                />
              }
            >
              {showIconsOnly ? null : '帮助'}
            </Button>
          </Popover>
        </div>
      </nav>
      <Modal
        title="帮助"
        open={dialog === 'help'}
        width={360}
        footer={null}
        classNames={{ body: 'flex justify-center' }}
        onCancel={() => setDialog(null)}
        afterClose={() => compactButton.current?.focus()}
      >
        <HelpContent />
      </Modal>
      <Modal
        title={dialogs.elevation.label}
        open={dialog === 'elevation'}
        footer={null}
        onCancel={() => setDialog(null)}
      >
        <p className="m-0 py-3 text-text-secondary">提权申请服务待接入</p>
      </Modal>
      <Modal
        title={dialogs.announcement.label}
        open={dialog === 'announcement'}
        footer={null}
        onCancel={() => setDialog(null)}
      >
        <p className="m-0 py-3 text-text-secondary">暂无公告</p>
      </Modal>
    </>
  );
}
