/** 路由异常展示：保留系统与地址上下文，按失败原因提供明确的恢复入口，不自行推导访问权限。 */
import { Button } from 'antd';
import { useContext } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLinkClickHandler, useLocation, useMatch } from 'react-router';
import { AppFailure } from '@/components/AppFailure';
import JoinSystemAction from '@/components/JoinSystemAction';
import type { SystemJoinTarget } from '@/types/systems';
import { SystemContext } from '@/contexts/SystemContext';
import { platformHome } from '@/router/paths';
import StatusIllustration from './StatusIllustration';

interface RouteStatusProps {
  forbidden?: boolean;
  scope?: 'page' | 'system';
  joinTarget?: SystemJoinTarget;
}

/** 状态页也会作为路由错误回退渲染；独立捕捉其运行时错误，不再交回处理原 403/404 的路由边界。 */
export default function RouteStatusPage(props: RouteStatusProps) {
  return (
    <ErrorBoundary FallbackComponent={AppFailure}>
      <RouteStatusContent {...props} />
    </ErrorBoundary>
  );
}

/** 系统概览入口仅使用已通过授权的布局上下文，根错误边界也能从 URL 展示目标系统标识。 */
function RouteStatusContent({ forbidden = false, scope = 'page', joinTarget }: RouteStatusProps) {
  const { pathname } = useLocation();
  const systemMatch = useMatch('/systems/:systemName/*');
  const workspace = useContext(SystemContext);
  const systemName = systemMatch?.params.systemName;
  const applicationTarget =
    forbidden && scope === 'system' && joinTarget?.systemName === systemName
      ? joinTarget
      : undefined;
  const title = forbidden
    ? scope === 'system'
      ? '无系统访问权限'
      : '无访问权限'
    : scope === 'system'
      ? '系统不存在'
      : '页面不存在';
  const description = forbidden
    ? scope === 'system'
      ? applicationTarget
        ? '你尚未加入该系统，可以申请加入并将申请链接发给系统负责人。'
        : '请联系系统管理员确认当前账号的访问权限。'
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
    <h1 className="m-0 text-[clamp(1.75rem,5cqi,2.5rem)] font-600 leading-tight tracking-tight text-text">
      {title}
    </h1>
  );
  const detail = (
    <>
      <p className="m-0 break-words text-15px leading-7 text-text-secondary">{description}</p>
      <dl className="m-0 mt-5 flex items-start gap-3 border-l-2 border-l-solid border-accent-border py-1 pl-3 text-12px leading-5">
        <dt className="shrink-0 text-text-muted">{systemName ? '目标系统' : '访问地址'}</dt>
        <dd className="m-0 min-w-0 break-all font-mono text-text-secondary">
          {systemName || pathname}
        </dd>
      </dl>
    </>
  );
  const actions = (
    <div className="grid gap-2 @[400px]:flex @[400px]:flex-wrap @[400px]:items-center @[400px]:gap-3">
      {applicationTarget && (
        <JoinSystemAction key={applicationTarget.systemName} system={applicationTarget} primary />
      )}
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
        type={overview || applicationTarget ? 'default' : 'primary'}
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
    <div className="min-w-0">
      {heading}
      <div className="mt-3 @[760px]:mt-5">{detail}</div>
      <div className="mt-5 @[760px]:mt-8">{actions}</div>
    </div>
  );
  // 按内容区宽度切换单双列，兼容独立状态页和带侧栏的工作区。窄屏先展示操作，插画随列宽缩放。
  return (
    <section
      className="@container box-border flex min-h-full w-full min-w-0 flex-col bg-canvas px-[clamp(1rem,4vw,3rem)] py-[clamp(1.5rem,4dvh,2.5rem)] text-text"
      aria-label={title}
    >
      <div className="mx-auto flex w-full max-w-1040px flex-1 flex-col justify-center">
        <div className="mx-auto grid w-full max-w-560px gap-5 @[760px]:max-w-none @[760px]:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] @[760px]:items-center @[760px]:gap-x-[clamp(2rem,6cqi,4rem)]">
          {content}
          <div className="mx-auto w-full max-w-[clamp(17.5rem,80cqi,20rem)] @[760px]:max-w-480px">
            {icon}
          </div>
        </div>
      </div>
    </section>
  );
}
