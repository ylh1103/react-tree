/**
 * 系统工作区入口消费独立授权查询，身份与成员清单不替代访问结果。
 * 不存在、无权限和请求错误分别展示；只有确认有效后才提供 SystemContext 和子路由。
 */
import { shallowEqual } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Spin } from 'antd';
import { Outlet, useMatch, useParams } from 'react-router';
import { mySystemsOptions, systemAccessOptions } from '@/queries/systems';
import { useAppSelector } from '@/store/hooks';
import { HttpError } from '@/http/request';
import { SystemAccessError } from '@/api/systems';
import { SystemContext } from '@/contexts/SystemContext';
import { isAccessDenied } from '@/utils/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import SiteLayout from '../SiteLayout';

export default function SystemLayout() {
  const { systemName } = useParams();
  const isDatabase = Boolean(useMatch('/systems/:systemName/db/*'));
  // 只订阅授权所需字段；姓名、部门等资料变化不触发工作区更新。
  const user = useAppSelector((state) => {
    const info = state.user.userInfo;
    return info ? { ystId: info.ystId, userType: info.userType } : null;
  }, shallowEqual);
  // 父路由的中间件先校验；这里订阅相同缓存键，处理工作区打开后的刷新结果。
  const query = useQuery(systemAccessOptions(systemName!, user));
  // 父路由 loader 预取同用户的切换列表。它与授权查询独立，挂载时复用预取结果。
  const list = useQuery({ ...mySystemsOptions(user?.ystId ?? null), refetchOnMount: false });
  const system = query.data;
  const systems = list.data ?? [];
  if (query.isPending || (!system && query.isFetching))
    return (
      <div className="grid place-items-center flex-1" role="status" aria-label="正在加载系统">
        <Spin />
      </div>
    );
  // 刷新失败时 Query 可能同时保留 error 和上次的 data。403/404 优先展示状态页，卸载工作区。
  if (isAccessDenied(query.error))
    return (
      <SiteLayout>
        <RouteStatusPage
          scope="system"
          forbidden
          joinTarget={query.error instanceof SystemAccessError ? query.error.joinTarget : undefined}
        />
      </SiteLayout>
    );
  if (query.error instanceof HttpError && query.error.status === 404)
    return (
      <SiteLayout>
        <RouteStatusPage scope="system" />
      </SiteLayout>
    );
  // 其他请求错误有旧数据时保留工作区，并在下方显示重试入口。
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
  if (!system)
    return (
      <SiteLayout>
        <RouteStatusPage scope="system" />
      </SiteLayout>
    );
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
