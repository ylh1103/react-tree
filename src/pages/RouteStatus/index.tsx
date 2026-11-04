/** 路由异常展示：保留系统与地址上下文，按失败原因提供明确的恢复入口，不自行推导访问权限。 */
import { Button } from 'antd';
import { useContext } from 'react';
import { useLinkClickHandler, useLocation, useMatch } from 'react-router';
import { SystemContext } from '@/contexts/SystemContext';
import { platformHome } from '@/router/paths';
import StatusIllustration from './StatusIllustration';

interface RouteStatusProps {
  forbidden?: boolean;
  scope?: 'page' | 'system';
}

/** 系统概览入口仅使用已通过授权的布局上下文，根错误边界也能从 URL 展示目标系统标识。 */
export default function RouteStatusPage({ forbidden = false, scope = 'page' }: RouteStatusProps) {
  const { pathname } = useLocation();
  const systemMatch = useMatch('/systems/:systemName/*');
  const workspace = useContext(SystemContext);
  const systemName = systemMatch?.params.systemName;
  const title = forbidden
    ? scope === 'system'
      ? '无系统访问权限'
      : '无访问权限'
    : scope === 'system'
      ? '系统不存在'
      : '页面不存在';
  const description = forbidden
    ? scope === 'system'
      ? '请联系系统管理员确认当前账号的访问权限。'
      : '请联系管理员确认当前账号对该页面或资源的访问权限。'
    : scope === 'system'
      ? '请检查系统地址，或返回系统列表重新选择。'
      : '请检查页面地址，或通过下方入口继续访问。';
  const overview =
    !forbidden && scope === 'page' && workspace
      ? platformHome(workspace.system.systemName, workspace.platform)
      : null;
  // Button 的 href 输出原生链接；复用 Router 的链接处理，保留修饰键及新标签页打开行为。
  const handleOverviewClick = useLinkClickHandler(overview ?? '/');
  const handleSystemsClick = useLinkClickHandler('/');
  const icon = (
    <StatusIllustration
      kind={forbidden ? 'forbidden' : scope === 'system' ? 'system-not-found' : 'page-not-found'}
    />
  );
  const heading = (
    <h1 className="m-0 text-40px font-600 leading-14 tracking-tight text-text">{title}</h1>
  );
  const detail = (
    <>
      <p className="m-0 break-words text-15px leading-8 text-text-secondary">{description}</p>
      <dl className="m-0 mt-5 flex items-start gap-3 border-l-2 border-l-solid border-accent-border py-1 pl-3 text-12px leading-5">
        <dt className="shrink-0 text-text-muted">{systemName ? '目标系统' : '访问地址'}</dt>
        <dd className="m-0 min-w-0 break-all font-mono text-text-secondary">
          {systemName || pathname}
        </dd>
      </dl>
    </>
  );
  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      {overview && (
        <Button
          type="primary"
          href={overview}
          onClick={handleOverviewClick}
          icon={
            <span
              aria-hidden="true"
              className={`${workspace?.platform === 'database' ? 'i-lucide-database' : 'i-lucide-layout-grid'} text-4`}
            />
          }
          className="h-44px! px-6!"
        >
          {workspace?.platform === 'database' ? '返回数据库平台' : '返回系统总览'}
        </Button>
      )}
      <Button
        type={overview ? 'default' : 'primary'}
        href="/"
        onClick={handleSystemsClick}
        icon={<span aria-hidden="true" className="i-lucide:arrow-left text-4" />}
        className="h-44px! px-6!"
      >
        返回系统列表
      </Button>
      {/* 与 AppFailure 一致，支持入口暂时预留，待配置后接入真实服务地址。 */}
      <Button className="h-44px! px-5!">
        技术支持
        <span aria-hidden="true" className="i-lucide:arrow-up-right text-18px" />
      </Button>
    </div>
  );
  const content = (
    <div className="min-w-0 flex-[1_1_360px]">
      {heading}
      <div className="mt-5">{detail}</div>
      <div className="mt-8">{actions}</div>
    </div>
  );
  // 外壳已有最小宽度，按内容区剩余空间自然换行，避免视口断点让宽容器提前变成单栏。
  // 插画画幅固定且不参与压缩；内容超高时由父级滚动，不做位移以免长文案越过顶部。
  return (
    <section
      className="box-border flex min-h-full w-full flex-col bg-canvas px-12 py-[clamp(16px,4dvh,40px)] text-text"
      aria-label={title}
    >
      <div className="mx-auto flex w-full max-w-1040px flex-1 flex-col justify-center">
        <div className="flex flex-wrap items-center gap-x-16 gap-y-8">
          {content}
          <div className="mx-auto h-360px w-480px shrink-0">{icon}</div>
        </div>
      </div>
    </section>
  );
}
