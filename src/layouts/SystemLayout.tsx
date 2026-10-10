import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';
import { Outlet, useMatch, useParams } from 'react-router';
import { systemsOptions } from '../features/systems/api';
import { SystemContext } from '../features/systems/SystemContext';
import { isAccessDenied } from '../features/systems/model';
import RouteStatusPage from '../pages/RouteStatusPage';

export default function SystemLayout() {
  const { systemName } = useParams();
  const isDatabase = Boolean(useMatch('/systems/:systemName/db/*'));
  const query = useQuery(systemsOptions());
  if (query.isPending)
    return (
      <div className="grid place-items-center flex-1" role="status" aria-label="正在加载系统">
        <Spin />
      </div>
    );
  if (query.error) {
    if (isAccessDenied(query.error)) return <RouteStatusPage forbidden />;
    return (
      <div className="p-24px">
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
  const system = query.data.find((item) => item.systemName === systemName);
  if (!system) return <RouteStatusPage />;
  return (
    <SystemContext
      value={{ system, systems: query.data, platform: isDatabase ? 'database' : 'application' }}
    >
      <Outlet key={system.systemName} />
    </SystemContext>
  );
}
