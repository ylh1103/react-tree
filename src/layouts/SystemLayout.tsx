/**
 * 系统工作区访问入口，校验 URL 中的系统是否属于可访问清单。
 * 不存在、无权限和请求错误分别展示；只有确认有效后才提供 SystemContext 和子路由。
 */
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';
import { Outlet, useMatch, useParams } from 'react-router';
import { systemsOptions } from '../queries/systems';
import { SystemContext } from '../contexts/SystemContext';
import { isAccessDenied } from '../utils/systems';
import RouteStatusPage from '../pages/RouteStatus';

export default function SystemLayout() {
  const { systemName } = useParams();
  const isDatabase = Boolean(useMatch('/systems/:systemName/db/*'));
  const query = useQuery(systemsOptions());
  const system = query.data?.find((item) => item.systemName === systemName);
  if (query.isPending || (!system && query.isFetching))
    return (
      <div className="grid place-items-center flex-1" role="status" aria-label="正在加载系统">
        <Spin />
      </div>
    );
  if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
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
    <SystemContext
      value={{ system, systems: query.data!, platform: isDatabase ? 'database' : 'application' }}
    >
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
