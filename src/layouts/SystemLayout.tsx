/**
 * 系统工作区入口消费独立授权查询，身份与成员清单不替代访问结果。
 * 不存在、无权限和请求错误分别展示；只有确认有效后才提供 SystemContext 和子路由。
 */
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';
import { Outlet, useMatch, useParams } from 'react-router';
import { systemsOptions, systemAccessOptions } from '@/queries/systems';
import { HttpError } from '@/http/request';
import { SystemContext } from '@/contexts/SystemContext';
import { isAccessDenied } from '@/utils/systems';
import RouteStatusPage from '@/pages/RouteStatus';

export default function SystemLayout() {
  const { systemName } = useParams();
  const isDatabase = Boolean(useMatch('/systems/:systemName/db/*'));
  const query = useQuery(systemAccessOptions(systemName!));
  const list = useQuery(systemsOptions());
  const system = query.data;
  const systems = list.data ?? [];
  if (query.isPending || (!system && query.isFetching))
    return (
      <div className="grid place-items-center flex-1" role="status" aria-label="正在加载系统">
        <Spin />
      </div>
    );
  // 授权失败优先于旧数据；失效的工作区不能继续保留 Outlet。
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
  if (query.error instanceof HttpError && query.error.status === 404) return <RouteStatusPage />;
  if (query.error && !system) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          showIcon
          title="系统加载失败"
          description={query.error.message}
          action={<Button onClick={() => void query.refetch()}>重试</Button>}
        />
      </div>
    );
  }
  if (!system) return <RouteStatusPage />;
  return (
    <SystemContext value={{ system, systems, platform: isDatabase ? 'database' : 'application' }}>
      <div className="flex flex-col h-full min-h-0">
        {query.error && (
          <Alert
            type="warning"
            showIcon
            title="系统信息刷新失败，正在显示已有数据"
            description={query.error.message}
            action={
              <Button loading={query.isFetching} onClick={() => void query.refetch()}>
                重试
              </Button>
            }
            className="shrink-0"
          />
        )}
        <div className="flex-1 min-h-0">
          <Outlet key={system.systemName} />
        </div>
      </div>
    </SystemContext>
  );
}
