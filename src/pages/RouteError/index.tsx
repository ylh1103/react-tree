/**
 * 静态路由错误边界：403/404 使用状态页，其他错误提供整页刷新与诊断信息。
 * 首次配置等待结束前保留启动动画；之后各错误分支在提交后交接，避免错误页先使用未校准的主题。
 */
import App from '@/App';
import SiteLayout from '@/layouts/SiteLayout';
import { AppFailure } from '@/components/AppFailure';
import { useRouteError } from 'react-router';
import { HttpError } from '@/http/request';
import { SystemAccessError } from '@/api/systemAccessError';
import RouteStatusPage from '@/pages/RouteStatus';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { ResourceLoading } from '@/components/ResourceLoading';
import { useAppSelector } from '@/store/hooks';

/** 静态注册，页面 chunk 加载失败时仍能提供恢复入口。 */
export default function RouteErrorPage({
  layout = 'content',
}: {
  layout?: 'content' | 'site' | 'root';
}) {
  const error = useRouteError();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  if (!initialized) return <ResourceLoading />;
  if (error instanceof HttpError && [403, 404].includes(error.status)) {
    const status = (
      <RouteStatusPage
        forbidden={error.status === 403}
        scope={error instanceof SystemAccessError ? 'system' : 'page'}
      />
    );
    return (
      <BootstrapLoadingHandoff>
        {layout === 'root' ? (
          <App>
            <SiteLayout>{status}</SiteLayout>
          </App>
        ) : layout === 'site' ? (
          <SiteLayout>{status}</SiteLayout>
        ) : (
          status
        )}
      </BootstrapLoadingHandoff>
    );
  }
  return <AppFailure error={error} />;
}

/** 在系统父路由处理授权失败，保留根应用 Provider 和站点页头，不挂载未授权的工作区。 */
export function SystemRouteErrorPage() {
  return <RouteErrorPage layout="site" />;
}

/** 首次导航的 middleware 错误可能归属根边界；恢复应用公共外壳，但用状态内容替代业务 Outlet。 */
export function RootRouteErrorPage() {
  return <RouteErrorPage layout="root" />;
}
