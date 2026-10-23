/**
 * 静态路由错误边界：403/404 使用状态页，其他错误提供刷新与返回首页的恢复入口。
 * 各错误分支都在提交后交接 HTML 启动画面，避免首屏加载失败时错误提示仍被启动画面遮住。
 */
import { Button, Result, Space } from 'antd';
import { useNavigate, useRouteError } from 'react-router';
import { HttpError } from '@/http/request';
import RouteStatusPage from '@/pages/RouteStatus';
import { BootstrapLoadingHandoff } from '@/components/ResourceLoading/BootstrapHandoff';

/** 静态注册，页面 chunk 加载失败时仍能提供恢复入口。 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  if (error instanceof HttpError && [403, 404].includes(error.status))
    return (
      <BootstrapLoadingHandoff>
        <RouteStatusPage forbidden={error.status === 403} />
      </BootstrapLoadingHandoff>
    );
  const resourceFailure =
    error instanceof Error &&
    /dynamically imported|module script|chunk|Failed to fetch/i.test(error.message);
  return (
    <BootstrapLoadingHandoff>
      <Result
        status="error"
        title={resourceFailure ? '页面资源加载失败' : '页面暂时无法打开'}
        subTitle="请检查网络后刷新页面。若刚刚更新了系统，刷新可获取最新资源。"
        extra={
          <Space>
            <Button type="primary" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
            <Button onClick={() => navigate('/')}>返回系统列表</Button>
          </Space>
        }
      />
    </BootstrapLoadingHandoff>
  );
}
