/**
 * 静态路由错误边界：403/404 使用状态页，其他错误提供刷新与返回首页的恢复入口。
 * 首次配置等待结束前保留启动动画；之后各错误分支在提交后交接，避免错误页先使用未校准的主题。
 */
import { AppFailure } from '@/components/AppFailure';
import { useNavigate, useRouteError } from 'react-router';
import { HttpError } from '@/http/request';
import RouteStatusPage from '@/pages/RouteStatus';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';
import { ResourceLoading } from '@/components/ResourceLoading';
import { useAppSelector } from '@/store/hooks';

/** 静态注册，页面 chunk 加载失败时仍能提供恢复入口。 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const initialized = useAppSelector((state) => state.preferences.initialized);
  if (!initialized) return <ResourceLoading />;
  if (error instanceof HttpError && [403, 404].includes(error.status))
    return (
      <BootstrapLoadingHandoff>
        <RouteStatusPage forbidden={error.status === 403} />
      </BootstrapLoadingHandoff>
    );
  return <AppFailure error={error} onHome={() => navigate('/')} />;
}
