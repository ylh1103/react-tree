/**
 * 系统应用参数页面：以 systemName 绑定列表服务，以 appName 同步选中项。
 * 侧栏和详情订阅同一合并清单；写入期间暂停查询，选中后通过 URL 导航。
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Empty, Spin } from 'antd';
import { applicationEnvironmentsOptions } from '@/queries/applicationEnvironments';
import type { ApplicationEnvironment } from '@/types/applicationEnvironments';
import { HttpError } from '@/http/request';
import { isAccessDenied } from '@/utils/systems';
import RouteStatusPage from '@/pages/RouteStatus';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { createSystemApplicationService } from '@/queries/applications';
import { applicationListId, groupedListKeys, groupedListOptions } from '@/queries/groupedList';
import type { ListNode } from '@/components/GroupedList/types';
import ApplicationList from './components/ApplicationList';
import { useSystemWorkspace } from '@/contexts/SystemContext';
import { applicationPath } from '@/router/paths';
import {
  ApplicationParametersEmptyState,
  ApplicationParametersToolbar,
  ApplicationParametersWorkspace,
} from './components/ApplicationParametersWorkspace';
import { SplitPane } from '@/components/SplitPane';
import { CollectionSkeleton } from '@/components/CollectionSkeleton';

export default function SystemApplicationsPage() {
  const { system } = useSystemWorkspace();
  const { appName } = useParams();
  const navigate = useNavigate();
  // 环境选择仅属于应用页；绑定系统与应用，切换目标时直接使用默认值，不用 Effect 同步。
  const [environmentSelection, setEnvironmentSelection] = useState<{
    systemName?: string;
    applicationName?: string;
    keys: string[];
  }>({ keys: ['dev', 'st', 'uat'] });
  const service = useMemo(
    () => createSystemApplicationService(system.systemName),
    [system.systemName],
  );
  const listId = applicationListId(system.systemName);
  const writing = useIsMutating({ mutationKey: groupedListKeys.write(listId) }) > 0;
  const query = useQuery({
    ...groupedListOptions(listId, service),
    enabled: !writing,
    select: applicationLeaves,
  });
  const selected = appName ? query.data?.find((item) => item.key === appName) : undefined;
  const environmentQuery = useQuery({
    ...applicationEnvironmentsOptions(system.systemName, appName ?? ''),
    enabled: Boolean(selected) && !isAccessDenied(query.error),
    select: environmentViews,
  });
  const environments = environmentQuery.data ?? [];
  const selectedEnvironments =
    environmentSelection.systemName === system.systemName &&
    environmentSelection.applicationName === appName
      ? environmentSelection.keys.filter((key) => environments.some((env) => env.key === key))
      : environments.slice(0, 3).map((env) => env.key);
  const selection = {
    environments,
    selectedEnvironments,
    onChange: (keys: string[]) =>
      setEnvironmentSelection({ systemName: system.systemName, applicationName: appName, keys }),
  };
  // 首次无数据时才占位；路由只加载通用骨架，已有缓存的刷新仍保留交互工作区。
  if (query.isPending)
    return (
      <CollectionSkeleton
        storageKey="parameter-management:split-pane:application:v1"
        defaultWidth={290}
        title={appName || '应用参数'}
        integratedHeader={!appName}
      />
    );
  // 环境接口拒绝访问时优先于旧配置，移除整个参数工作区。
  if (isAccessDenied(query.error) || isAccessDenied(environmentQuery.error))
    return <RouteStatusPage forbidden />;
  const environmentMissing =
    environmentQuery.error instanceof HttpError && environmentQuery.error.status === 404;
  // 刷新尚未确认目标是否存在时先等待，失败后由列表显示错误与重试，避免误报已删除。
  const checkingTarget = Boolean(appName && !selected && query.isFetching);
  const blockingError = Boolean(
    query.error && (query.data === undefined || (appName && !selected)),
  );
  return (
    <SplitPane
      storageKey="parameter-management:split-pane:application:v1"
      defaultWidth={290}
      sidebarLabel="应用列表"
      title={appName}
      integratedHeader={!appName}
      toolbar={
        selected && !blockingError && environments.length > 0 && !environmentMissing ? (
          <ApplicationParametersToolbar key={appName} {...selection} />
        ) : null
      }
      sidebar={
        <ApplicationList
          systemName={system.systemName}
          service={service}
          selectedAppName={appName ?? null}
          embedded
        />
      }
    >
      {checkingTarget ? (
        <div
          className="grid place-items-center min-h-240px"
          role="status"
          aria-label="正在加载应用"
        >
          <Spin />
        </div>
      ) : blockingError ? null : !appName ? (
        <div className="grid min-h-full min-w-0 place-items-center px-6 py-12">
          <ApplicationParametersEmptyState
            applicationCount={query.data?.length ?? 0}
            onRefresh={() => void query.refetch()}
            refreshing={query.isFetching}
          />
        </div>
      ) : !selected ? (
        <div className="py-16 text-center">
          <Empty description={`应用「${appName}」不存在或已移除`} />
          <Button className="mt-5" onClick={() => navigate(applicationPath(system.systemName))}>
            返回应用首页
          </Button>
        </div>
      ) : (
        <div className="min-w-0 h-full">
          {environmentQuery.isPending ? (
            <div
              className="grid min-h-280px place-items-center"
              role="status"
              aria-label="正在加载应用环境"
            >
              <Spin />
            </div>
          ) : environmentMissing ? (
            <Empty description="应用或环境不存在，可能已被移除" />
          ) : (
            <>
              {environmentQuery.error && (
                <Alert
                  type="error"
                  showIcon
                  title={
                    environmentQuery.data ? '环境刷新失败，正在显示已有数据' : '环境参数加载失败'
                  }
                  description={environmentQuery.error.message}
                  action={
                    <Button
                      loading={environmentQuery.isFetching}
                      onClick={() => void environmentQuery.refetch()}
                    >
                      重试
                    </Button>
                  }
                />
              )}
              {environmentQuery.data && (
                <div className="flex h-full min-h-0 flex-col">
                  {environments.length ? (
                    <div className="flex-1 min-h-0 overflow-auto">
                      <ApplicationParametersWorkspace
                        {...selection}
                        appType={selected.appType ?? '0'}
                      />
                    </div>
                  ) : (
                    <Empty description="该应用暂无环境" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </SplitPane>
  );
}

/** 详情只读取合并后清单中的叶子，分组不会被识别为应用。 */
function applicationLeaves(nodes: ListNode[]): ListNode[] {
  return nodes.flatMap((node) => (node.children ? applicationLeaves(node.children) : [node]));
}

/** 稳定的 select 映射，查询数据未变时不重复创建环境视图和测量工具栏。 */
function environmentViews(items: ApplicationEnvironment[]) {
  return items.map((item) => ({ ...item, key: item.envTag, name: item.envDesc }));
}
