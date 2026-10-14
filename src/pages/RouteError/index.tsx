import { Button, Result, Space } from 'antd';
import { useNavigate, useRouteError } from 'react-router';
import { HttpError } from '../../http/request';
import RouteStatusPage from '../RouteStatus';
import { retrySession } from '../../store/session';

/** 静态注册，页面 chunk 加载失败时仍能提供恢复入口。 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  if (error instanceof HttpError && [0, 401].includes(error.status))
    return (
      <Result
        status="warning"
        title={error.message}
        extra={
          <Button
            type="primary"
            onClick={() =>
              void retrySession()
                .then(() => window.location.reload())
                .catch(() => {})
            }
          >
            重新获取会话
          </Button>
        }
      />
    );
  if (error instanceof HttpError && [403, 404].includes(error.status))
    return <RouteStatusPage forbidden={error.status === 403} />;
  const resourceFailure =
    error instanceof Error &&
    /dynamically imported|module script|chunk|Failed to fetch/i.test(error.message);
  return (
    <Result
      status="error"
      title={resourceFailure ? '页面资源加载失败' : '页面暂时无法打开'}
      subTitle="请检查网络后刷新页面。若刚刚更新了系统，刷新可获取最新资源。"
      extra={
        <Space>
          <Button type="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
          <Button onClick={() => navigate('/')}>返回我的系统</Button>
        </Space>
      }
    />
  );
}
